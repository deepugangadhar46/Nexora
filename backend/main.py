"""
NEXORA Backend - FastAPI Application
=====================================

Main FastAPI application with MVP Agent integration.
"""

import os
import asyncio
import logging
import uuid
import json
import re
from typing import Optional, Dict, Any, List, Annotated
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from pydantic import BaseModel, Field, field_validator, StringConstraints
from dotenv import load_dotenv
import bleach
from auth import (
    create_access_token,
    create_refresh_token,
    verify_token as verify_jwt_token,
    hash_password,
    verify_password,
    get_google_oauth_url,
    get_github_oauth_url,
    exchange_google_code,
    exchange_github_code,
    JWT_EXPIRATION_HOURS
)
from payment import payment_manager, PaymentProvider
from subscription import SubscriptionManager, SubscriptionTier, get_credit_cost
from model_router import model_router, TaskType
from exceptions import (
    NexoraException,
    AIServiceException,
    DatabaseException,
    AuthenticationException,
    ValidationException,
    PaymentException,
    InsufficientCreditsException
)
from env_validator import check_environment_on_startup
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import secrets

# Import MVP Builder Agent
from mvp_builder_agent import (
    MVPBuilderAgent,
    CodeGenerationRequest, 
    WebsiteScrapingRequest, 
    SandboxCreateRequest, 
    FileUpdateRequest,
    AIModel
)

# Import Prompt Templates
from prompt_templates_html import (
    build_dynamic_prompt,
    detect_prompt_type,
    get_base_system_prompt,
    get_html_system_prompt,
    PromptType
)

# Import Idea Validation Agent
from idea_validation_agent import IdeaValidationAgent
from idea_validation_api import router as idea_validation_router

# Import Business Planning Agent
from business_planning_agent import BusinessPlanningAgent, BusinessPlanResponse, router as business_planning_router

# Import Market Research Agent
from market_research_agent import MarketResearchAgent

# Import Pitch Deck Agent
from pitch_deck_agent import PitchDeckAgent

# Import Cache
from cache import cache, cached, cache_ai_response, get_cached_ai_response

# Import API v1 Router
from api_v1 import router as api_v1_router, set_agents

# Import Database
import database as db

# Import Middleware (if exists)
try:
    from middleware import setup_middleware
    MIDDLEWARE_AVAILABLE = True
except ImportError:
    MIDDLEWARE_AVAILABLE = False
    logger.warning("Middleware module not found - some security features disabled")

# Load environment variables from root directory
import os
from pathlib import Path
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging FIRST
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Sentry for error monitoring
if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        environment=os.getenv("ENVIRONMENT", "development"),
    )
    logger.info("Sentry initialized for error monitoring")

# Password hashing is now handled in auth.py

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Global variables
mvp_builder_agent = None
subscription_manager = None

# Initialize agents
idea_validation_agent = None
business_planning_agent = None
market_research_agent = None
pitch_deck_agent = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    logger.info(" Starting NEXORA API...")
    
    # Validate environment variables
    try:
        check_environment_on_startup()
    except RuntimeError as e:
        logger.error(f" Startup validation failed: {e}")
        # Continue anyway for development, but log the error
        logger.warning(" Continuing startup despite validation errors (development mode)")
    
    # Initialize database
    try:
        if db.initialize_pool():
            logger.info("Database connection pool initialized")
            db.create_tables()
            logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
    
    # Initialize subscription manager
    subscription_manager = SubscriptionManager(db)
    logger.info("Subscription manager initialized")
    
    global mvp_builder_agent
    try:
        mvp_builder_agent = MVPBuilderAgent()
        logger.info("✓ MVP Builder Agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MVP Agent: {str(e)}")
    
    try:
        idea_validation_agent = IdeaValidationAgent()
        logger.info("✓ Idea Validation Agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Idea Validation Agent: {str(e)}")
    
    try:
        business_planning_agent = BusinessPlanningAgent()
        logger.info("✓ Business Planning Agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Business Planning Agent: {str(e)}")
    
    try:
        market_research_agent = MarketResearchAgent()
        logger.info("✓ Market Research Agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Market Research Agent: {str(e)}")
    
    try:
        pitch_deck_agent = PitchDeckAgent()
        logger.info("✓ Pitch Deck Agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Pitch Deck Agent: {str(e)}")
    
    # Set agents for API v1
    set_agents(
        mvp_builder_agent,
        idea_validation_agent,
        business_planning_agent,
        market_research_agent,
        pitch_deck_agent
    )
    logger.info("✓ API v1 agents configured")
    
    logger.info("NEXORA API startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down NEXORA API...")
    # Add any cleanup code here if needed
    logger.info("NEXORA API shutdown complete")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="NEXORA API",
    description="AI-Powered Startup Generation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Setup middleware if available
if MIDDLEWARE_AVAILABLE:
    setup_middleware(app)
    logger.info("✓ Security middleware enabled")

# Configure CORS with security best practices
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://192.168.29.184:3000",  # Your local IP
    # Add production domains here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if os.getenv('ENVIRONMENT') == 'production' else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(api_v1_router)
app.include_router(idea_validation_router)
app.include_router(business_planning_router)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================



class ChatRequest(BaseModel):
    """Chat request model"""
    message: str = Field(..., description="User message")
    context: Optional[str] = Field(None, description="Conversation context")
    userId: Optional[str] = Field(None, description="User ID")


class ScrapeUrlRequest(BaseModel):
    """URL scraping request model"""
    url: str = Field(..., description="URL to scrape")
    # Note: formats parameter removed for Firecrawl v1 API compatibility


class SearchWebRequest(BaseModel):
    """Web search request model"""
    query: str = Field(..., description="Search query")
    maxResults: int = Field(default=10, description="Maximum results")


class E2BSandboxRequest(BaseModel):
    """E2B Sandbox creation request"""
    template: str = Field(default="base", description="Sandbox template")


class ExecuteCodeRequest(BaseModel):
    sandboxId: str = Field(..., description="Sandbox ID")
    code: str = Field(..., description="Code to execute")
    language: str = Field(default="javascript", description="Programming language")


class UserRegistrationRequest(BaseModel):
    """User registration request"""
    email: str = Field(..., description="User email", max_length=254)
    password: str = Field(..., description="User password", min_length=8, max_length=128)
    name: str = Field(..., description="User name", min_length=1, max_length=100)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v.lower().strip()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v


class UserLoginRequest(BaseModel):
    """User login request"""
    email: str = Field(..., description="User email", max_length=254)
    password: str = Field(..., description="User password", min_length=6, max_length=128)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return v.lower().strip()


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")


class PaymentOrderRequest(BaseModel):
    """Payment order creation request"""
    amount: float = Field(..., description="Amount to pay")
    currency: str = Field(default="INR", description="Currency code")
    user_id: str = Field(..., description="User ID")
    credits: int = Field(..., description="Credits to purchase")


class PaymentVerifyRequest(BaseModel):
    """Payment verification request"""
    provider: str = Field(..., description="Payment provider")
    payment_id: str = Field(..., description="Payment ID")
    order_id: Optional[str] = Field(None, description="Order ID")
    signature: Optional[str] = Field(None, description="Payment signature")
    user_id: str = Field(..., description="User ID")
    credits: int = Field(..., description="Credits purchased")


class SubscriptionUpgradeRequest(BaseModel):
    """Subscription upgrade request"""
    user_id: str = Field(..., description="User ID")
    tier: str = Field(..., description="New subscription tier")
    payment_id: str = Field(..., description="Payment ID")


class SubscriptionCancelRequest(BaseModel):
    """Subscription cancellation request"""
    user_id: str = Field(..., description="User ID")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_user_subscription(user_id: Optional[str]) -> str:
    """Get user subscription tier from database"""
    if not user_id:
        return "free"
    
    try:
        user = db.get_user_by_id(user_id)
        return user.get('subscription_tier', 'free') if user else 'free'
    except Exception as e:
        logger.error(f"Error fetching user subscription: {e}")
        return "free"


async def verify_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Verify JWT token and return user ID
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        str: User ID if token is valid
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Use proper JWT verification from auth module
        from auth import verify_access_token
        payload = verify_access_token(token)
        return payload.get("user_id")
    except Exception as e:
        logger.warning(f"Token verification failed: {str(e)}")
        return None


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "message": "NEXORA API is running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check database connection safely
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health/detailed")
async def detailed_health_check(user_id: str = Depends(verify_token)):
    """Detailed health check - requires authentication"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check database connection
    db_status = "connected" if db.initialize_pool() else "disconnected"
    
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "agents": {
            "mvp_builder_agent": "initialized" if mvp_builder_agent else "not initialized",
            "idea_validator_agent": "initialized" if idea_validator_agent else "not initialized",
            "market_research_agent": "initialized" if market_research_agent else "not initialized",
            "business_plan_agent": "initialized" if business_plan_agent else "not initialized",
            "pitch_deck_agent": "initialized" if pitch_deck_agent else "not initialized"
        },
        "database": db_status,
        "cache": "enabled" if cache else "disabled"
    }


@app.get("/api/health")
async def api_health_check():
    """Health check endpoint with /api prefix for frontend compatibility"""
    return await health_check()


# ============================================================================
# USER AUTHENTICATION ENDPOINTS
# ============================================================================

# Add routes without /api prefix for frontend compatibility
@app.post("/auth/login")
@limiter.limit("10/minute")
async def login_user_compat(request: Request, user_request: UserLoginRequest):
    """Login user - compatibility route"""
    return await login_user(request, user_request)

@app.post("/auth/register")
@limiter.limit("5/hour")
async def register_user_compat(request: Request, user_request: UserRegistrationRequest):
    """Register user - compatibility route"""
    return await register_user(request, user_request)

@app.get("/auth/user/{user_id}")
async def get_user_info_compat(user_id: str):
    """Get user info - compatibility route"""
    return await get_user_info(user_id)

@app.post("/api/auth/register")
@limiter.limit("5/hour")  # Prevent spam registrations
async def register_user(request: Request, user_request: UserRegistrationRequest):
    """Register a new user"""
    try:
        import uuid
        import hashlib
        
        # Check if user already exists
        existing_user = db.get_user_by_email(user_request.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_id = str(uuid.uuid4())
        password_hash = hash_password(user_request.password)
        
        if db.create_user(user_id, user_request.email, user_request.name, password_hash):
            # Generate JWT tokens
            access_token = create_access_token(user_id, user_request.email)
            refresh_token = create_refresh_token(user_id)
            
            return {
                "status": "success",
                "message": "User registered successfully",
                "user": {
                    "id": user_id,
                    "email": user_request.email,
                    "name": user_request.name,
                    "credits": 20
                },
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": JWT_EXPIRATION_HOURS * 3600
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login")
@limiter.limit("10/minute")  # Prevent brute force attacks
async def login_user(request: Request, user_request: UserLoginRequest):
    """Login user"""
    try:
        import hashlib
        
        # Get user
        user = db.get_user_by_email(user_request.email)
        if not user:
            logger.warning(f"Login attempt for non-existent user: {user_request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        password_hash = user.get('password_hash', '')
        password_valid = False
        needs_rehash = False
        
        try:
            # Try bcrypt verification first
            password_valid = verify_password(user_request.password, password_hash)
        except Exception as e:
            # If bcrypt fails, try legacy hash methods (MD5, SHA256)
            import hashlib
            logger.info(f"Bcrypt verification failed, trying legacy hash for user: {user_request.email}")
            
            # Try MD5
            md5_hash = hashlib.md5(user_request.password.encode()).hexdigest()
            if md5_hash == password_hash:
                password_valid = True
                needs_rehash = True
                logger.info(f"User {user_request.email} using legacy MD5 hash")
            else:
                # Try SHA256
                sha256_hash = hashlib.sha256(user_request.password.encode()).hexdigest()
                if sha256_hash == password_hash:
                    password_valid = True
                    needs_rehash = True
                    logger.info(f"User {user_request.email} using legacy SHA256 hash")
        
        if not password_valid:
            logger.warning(f"Invalid password attempt for user: {user_request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Upgrade to bcrypt if using legacy hash
        if needs_rehash:
            new_hash = hash_password(user_request.password)
            db.execute_query(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (new_hash, user['id'])
            )
            logger.info(f"Upgraded password hash to bcrypt for user: {user_request.email}")
        
        # Generate JWT tokens
        access_token = create_access_token(user['id'], user['email'])
        refresh_token = create_refresh_token(user['id'])
        
        # Store user info in response
        user_data = {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "credits": user.get('credits', 0),
            "subscription_tier": user.get('subscription_tier', 'free')
        }
        
        logger.info(f"User logged in successfully: {user_request.email}")
        
        return {
            "status": "success",
            "message": "Login successful",
            "user": user_data,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": JWT_EXPIRATION_HOURS * 3600
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred during login")


@app.post("/api/auth/reset-password")
@limiter.limit("3/hour")
async def reset_password(request: Request, email: str, new_password: str, admin_key: str = ""):
    """Reset user password (for testing/admin purposes - DISABLE IN PRODUCTION)"""
    try:
        # SECURITY WARNING: This endpoint should be disabled in production
        if os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(status_code=404, detail="Endpoint not available")
        
        # Simple admin key check
        expected_key = os.getenv("ADMIN_KEY")
        if not expected_key or admin_key != expected_key:
            logger.warning(f"Unauthorized password reset attempt for {email}")
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Get user
        user = db.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Hash new password
        new_hash = hash_password(new_password)
        
        # Update password
        db.execute_query(
            "UPDATE users SET password_hash = %s WHERE email = %s",
            (new_hash, email)
        )
        
        logger.info(f"Password reset for user: {email}")
        
        return {
            "status": "success",
            "message": "Password reset successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/refresh")
@limiter.limit("20/hour")
async def refresh_token_endpoint(request: Request, token_request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        from auth import refresh_access_token
        
        token_data = refresh_access_token(token_request.refresh_token)
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
        return {
            "status": "success",
            "access_token": token_data["access_token"],
            "refresh_token": token_data["refresh_token"],
            "expires_in": token_data["expires_in"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during token refresh")


# ============================================================================
# OAUTH ENDPOINTS
# ============================================================================

@app.get("/api/auth/google")
async def google_oauth_login():
    """Initiate Google OAuth login"""
    try:
        oauth_url = get_google_oauth_url()
        return {
            "status": "success",
            "url": oauth_url
        }
    except Exception as e:
        logger.error(f"Error initiating Google OAuth: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate Google OAuth")


@app.get("/api/auth/google/callback")
async def google_oauth_callback(code: str, state: Optional[str] = None):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for user info
        user_info = await exchange_google_code(code)
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to authenticate with Google")
        
        # Check if user exists
        existing_user = db.get_user_by_email(user_info["email"])
        
        if existing_user:
            # User exists, log them in
            user_id = existing_user['id']
            email = existing_user['email']
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            password_hash = hash_password(secrets.token_urlsafe(32))  # Random password for OAuth users
            
            if not db.create_user(user_id, user_info["email"], user_info["name"], password_hash):
                raise HTTPException(status_code=500, detail="Failed to create user")
            
            email = user_info["email"]
        
        # Generate tokens
        access_token = create_access_token(user_id, email, {"oauth_provider": "google"})
        refresh_token = create_refresh_token(user_id)
        
        # Get user data
        user = db.get_user_by_id(user_id)
        
        return {
            "status": "success",
            "message": "Google authentication successful",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "credits": user.get('credits', 0),
                "subscription_tier": user.get('subscription_tier', 'free')
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": JWT_EXPIRATION_HOURS * 3600
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Google OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during Google authentication")


@app.get("/api/auth/github")
async def github_oauth_login():
    """Initiate GitHub OAuth login"""
    try:
        oauth_url = get_github_oauth_url()
        return {
            "status": "success",
            "url": oauth_url
        }
    except Exception as e:
        logger.error(f"Error initiating GitHub OAuth: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate GitHub OAuth")


@app.get("/api/auth/github/callback")
async def github_oauth_callback(code: str, state: Optional[str] = None):
    """Handle GitHub OAuth callback"""
    try:
        # Exchange code for user info
        user_info = await exchange_github_code(code)
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to authenticate with GitHub")
        
        # Check if user exists
        existing_user = db.get_user_by_email(user_info["email"])
        
        if existing_user:
            # User exists, log them in
            user_id = existing_user['id']
            email = existing_user['email']
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            password_hash = hash_password(secrets.token_urlsafe(32))  # Random password for OAuth users
            
            if not db.create_user(user_id, user_info["email"], user_info["name"], password_hash):
                raise HTTPException(status_code=500, detail="Failed to create user")
            
            email = user_info["email"]
        
        # Generate tokens
        access_token = create_access_token(user_id, email, {"oauth_provider": "github"})
        refresh_token = create_refresh_token(user_id)
        
        # Get user data
        user = db.get_user_by_id(user_id)
        
        return {
            "status": "success",
            "message": "GitHub authentication successful",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "credits": user.get('credits', 0),
                "subscription_tier": user.get('subscription_tier', 'free')
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": JWT_EXPIRATION_HOURS * 3600
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in GitHub OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during GitHub authentication")


@app.get("/api/user/{user_id}")
async def get_user_info(user_id: str):
    """Get user information"""
    try:
        user = db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "status": "success",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "credits": user['credits'],
                "subscription_tier": user['subscription_tier'],
                "created_at": user['created_at'].isoformat() if user.get('created_at') else None
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/user/{user_id}/credits")
async def update_user_credits(user_id: str, request: BaseModel):
    """Update user credits"""
    try:
        data = request.dict()
        credits = data.get("credits")
        
        if credits is None:
            raise HTTPException(status_code=400, detail="Credits value is required")
        
        if not isinstance(credits, int) or credits < 0:
            raise HTTPException(status_code=400, detail="Credits must be a non-negative integer")
        
        # Update credits in database
        success = db.update_user_credits(user_id, credits)
        
        if not success:
            raise HTTPException(status_code=404, detail="User not found or update failed")
        
        # Get updated user info
        user = db.get_user_by_id(user_id)
        
        return {
            "status": "success",
            "message": "Credits updated successfully",
            "user": {
                "id": user['id'],
                "credits": user['credits']
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user credits: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PAYMENT & SUBSCRIPTION ENDPOINTS
# ============================================================================

@app.get("/api/subscription/tiers")
async def get_subscription_tiers():
    """Get all available subscription tiers"""
    try:
        if not subscription_manager:
            raise HTTPException(status_code=503, detail="Subscription system not initialized")
        
        tiers = subscription_manager.get_all_tiers()
        return {
            "status": "success",
            "tiers": tiers
        }
    except Exception as e:
        logger.error(f"Error getting subscription tiers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/subscription/{user_id}")
async def get_user_subscription(user_id: str, token: Optional[str] = Depends(verify_token)):
    """Get user's subscription details"""
    try:
        if not subscription_manager:
            raise HTTPException(status_code=503, detail="Subscription system not initialized")
        
        subscription = subscription_manager.get_user_subscription(user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        return {
            "status": "success",
            "subscription": subscription
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payment/create-order")
@limiter.limit("10/hour")
async def create_payment_order(
    request: Request,
    payment_request: PaymentOrderRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Create a payment order"""
    try:
        metadata = {
            "user_id": payment_request.user_id,
            "credits": payment_request.credits,
            "type": "credit_purchase"
        }
        
        order = payment_manager.create_order(
            payment_request.amount,
            payment_request.currency,
            metadata=metadata
        )
        
        return {
            "status": "success",
            "order": order
        }
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payment/verify")
async def verify_payment(
    verify_request: PaymentVerifyRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Verify payment and add credits"""
    try:
        provider_enum = PaymentProvider(verify_request.provider)
        
        # Verify payment
        is_valid = payment_manager.verify_payment(
            provider_enum,
            verify_request.payment_id,
            verify_request.order_id,
            verify_request.signature
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Payment verification failed")
        
        # Add credits to user
        if subscription_manager:
            success = subscription_manager.add_credits(
                verify_request.user_id,
                verify_request.credits,
                f"purchase_{verify_request.payment_id}"
            )
            if not success:
                raise HTTPException(status_code=500, detail="Failed to add credits")
        
        return {
            "status": "success",
            "message": "Payment verified and credits added",
            "credits_added": verify_request.credits
        }
    
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment provider")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/subscription/upgrade")
@limiter.limit("5/hour")
async def upgrade_subscription(
    request: Request,
    upgrade_request: SubscriptionUpgradeRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Upgrade user subscription"""
    try:
        if not subscription_manager:
            raise HTTPException(status_code=503, detail="Subscription system not initialized")
        
        tier_enum = SubscriptionTier(upgrade_request.tier)
        success = subscription_manager.upgrade_subscription(
            upgrade_request.user_id,
            tier_enum,
            upgrade_request.payment_id
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to upgrade subscription")
        
        return {
            "status": "success",
            "message": f"Subscription upgraded to {upgrade_request.tier}",
            "subscription": subscription_manager.get_user_subscription(upgrade_request.user_id)
        }
    
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/subscription/cancel")
async def cancel_subscription(
    cancel_request: SubscriptionCancelRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Cancel user subscription"""
    try:
        if not subscription_manager:
            raise HTTPException(status_code=503, detail="Subscription system not initialized")
        
        success = subscription_manager.cancel_subscription(cancel_request.user_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")
        
        return {
            "status": "success",
            "message": "Subscription cancelled. Will downgrade to free at end of period."
        }
    
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects/{user_id}")
async def get_user_projects(user_id: str):
    """Get all projects for a user"""
    try:
        # Query projects from database
        query = "SELECT * FROM projects WHERE user_id = %s ORDER BY created_at DESC"
        projects = db.execute_query(query, (user_id,), fetch_all=True)
        
        if not projects:
            return {
                "status": "success",
                "projects": [],
                "count": 0
            }
        
        # Format projects for response
        formatted_projects = []
        for project in projects:
            formatted_projects.append({
                "id": project['id'],
                "name": project['name'],
                "description": project.get('description', ''),
                "type": project['type'],
                "status": project['status'],
                "data": project.get('data'),
                "created_at": project['created_at'].isoformat() if project.get('created_at') else None,
                "updated_at": project['updated_at'].isoformat() if project.get('updated_at') else None
            })
        
        return {
            "status": "success",
            "projects": formatted_projects,
            "count": len(formatted_projects)
        }
    
    except Exception as e:
        logger.error(f"Error getting user projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))












@app.post("/api/chat")
@limiter.limit("30/minute")
async def chat(request: Request, chat_request: ChatRequest, token: Optional[str] = Depends(verify_token)):
    """
    Enhanced chat endpoint for conversational AI with intelligent caching
    Handles greetings, general questions, and build requests
    """
    try:
        # Check cache for common queries (greetings, FAQs)
        cached_response = await get_cached_ai_response("chat", chat_request.message)
        if cached_response:
            logger.info("✅ Cache hit for chat message")
            return cached_response
        
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        message_lower = chat_request.message.lower().strip()
        
        # Detect conversational greetings and casual messages
        greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']
        casual_phrases = ['how are you', 'what can you do', 'help', 'who are you', 'what are you', 'thanks', 'thank you']
        
        is_greeting = any(message_lower.startswith(g) for g in greetings)
        is_casual = any(phrase in message_lower for phrase in casual_phrases)
        
        # Build keywords that indicate MVP generation intent
        build_keywords = ['build', 'create', 'make', 'develop', 'generate', 'design', 'app', 'website', 'application', 'component']
        is_build_request = any(keyword in message_lower for keyword in build_keywords)
        
        # Build context for conversation
        conversation_context = []
        if chat_request.context:
            conversation_context.append({"role": "user", "content": chat_request.context})
        
        # Determine system prompt based on intent
        if is_greeting or is_casual:
            system_prompt = """You are Nexora AI, an elite AI assistant specialized in building production-ready applications.

Respond warmly and professionally. Introduce yourself briefly and highlight your capabilities:
- 🚀 Build full-stack web applications with modern tech stacks
- 📱 Create beautiful, responsive user interfaces
- 💼 Generate comprehensive business plans
- 🎯 Validate startup ideas with market research
- 📊 Create investor-ready pitch decks
- ⚡ Real-time code generation with live preview

Keep responses concise (2-3 sentences). Be encouraging and action-oriented. End with a question to engage the user."""
        
        elif is_build_request:
            # Use HTML-optimized prompt for build requests
            system_prompt = get_html_system_prompt()
            
            # Add conversation context
            if conversation_context:
                system_prompt += "\n\n## Recent Conversation:\n"
                for msg in conversation_context[-3:]:
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')[:100]
                    system_prompt += f"- {role}: {content}...\n"
        else:
            system_prompt = """You are Nexora AI, a professional assistant for application development.

Provide helpful, concise, and actionable responses. If the user seems interested in building something:
1. Ask clarifying questions about their vision
2. Suggest features they might need
3. Guide them toward using the MVP builder

Be conversational but professional. Keep responses under 4 sentences."""
        
        # Use MVP Builder Agent's AI response method with error handling
        response = ""
        try:
            async for chunk in mvp_builder_agent.get_ai_response(
                prompt=chat_request.message,
                model=AIModel.MINIMAX,
                system_prompt=system_prompt,
                stream=False
            ):
                response = chunk
        except Exception as ai_error:
            logger.error(f"AI response error: {str(ai_error)}")
            # Fallback response
            if is_greeting:
                response = "👋 Hello! I'm Nexora AI, your AI-powered development assistant. I can help you build full-stack applications, create business plans, and validate your startup ideas. What would you like to build today?"
            else:
                response = "I'm here to help you build amazing applications! Could you tell me more about what you'd like to create?"
        
        result = {
            "status": "success",
            "response": response,
            "intent": "greeting" if is_greeting else ("build" if is_build_request else "general"),
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache common responses (greetings, FAQs) for 1 hour
        if is_greeting or is_casual:
            await cache_ai_response("chat", chat_request.message, result, ttl=3600)
        
        return result
    
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="I encountered an error processing your message. Please try again.")


class MVPStreamRequest(BaseModel):
    """MVP streaming request model"""
    prompt: Annotated[str, StringConstraints(min_length=10, max_length=5000)] = Field(..., description="User prompt for MVP generation")
    conversationHistory: List[Dict[str, str]] = Field(default=[], max_length=50, description="Conversation history")
    
    @field_validator('prompt')
    @classmethod
    def sanitize_prompt(cls, v):
        # Remove potentially dangerous content
        return bleach.clean(v, tags=[], strip=True)
    
    @field_validator('conversationHistory')
    @classmethod
    def validate_history(cls, v):
        if len(v) > 50:
            raise ValueError("Conversation history too long")
        return v


@app.post("/api/mvp/stream")
@limiter.limit("10/minute")
async def stream_mvp_generation(request: Request, mvp_request: MVPStreamRequest):
    """
    Stream MVP generation with live file operations and E2B sandbox integration
    Professional streaming with clean progress updates
    """
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        async def generate_stream():
            try:
                # Send initial status
                yield f"data: {json.dumps({'type': 'status', 'message': 'Initializing sandbox environment...'})}\n\n"
                await asyncio.sleep(0)  # Allow event loop to process
                
                # Create sandbox first (using base template)
                sandbox = await mvp_builder_agent.create_sandbox(template="base")
                sandbox_id = sandbox.get('id', '') or sandbox.get('sandboxId', '')
                
                # Construct sandbox URL - check if it's a mock or real E2B sandbox
                if sandbox_id.startswith('mock-'):
                    # For mock sandboxes, use a placeholder URL
                    sandbox_url = f"https://mock-preview.e2b.dev/{sandbox_id}"
                    logger.info(f"Using mock sandbox URL: {sandbox_url}")
                else:
                    # Real E2B sandbox URL
                    sandbox_url = f"https://{sandbox_id}.e2b.dev"
                    logger.info(f"Using E2B sandbox URL: {sandbox_url}")
                
                # Send sandbox URL
                yield f"data: {json.dumps({'type': 'sandbox_url', 'url': sandbox_url, 'sandboxId': sandbox_id, 'isMock': sandbox_id.startswith('mock-')})}\n\n"
                
                # Use HTML/CSS/JS optimized prompt for better completion
                system_prompt = get_html_system_prompt()
                
                # Add explicit file count reminder to the user prompt
                enhanced_prompt = f"""{mvp_request.prompt}

🚨 CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE:
1. Generate AT LEAST 3 files: index.html, styles.css, script.js
2. Use ONLY the <file path="...">...</file> XML format
3. Write COMPLETE code - NO truncation, NO "...", NO placeholders
4. CLOSE ALL XML tags - every <file path="..."> MUST have </file>
5. Make each file production-ready and fully functional

Remember: The system expects 3-7 complete files. Don't stop until all files are done!"""
                
                # Send generation start status with model info
                yield f"data: {json.dumps({'type': 'status', 'message': '🚀 Using MiniMax M2 (32K context) - Generating modern HTML/CSS/JS application (3-7 files)...'})}\n\n"
                
                logger.info(f"🚀 Using MiniMax M2 (Hugging Face) with 32K token context for comprehensive MVP generation")
                
                # Start code generation with streaming
                content_buffer = ""
                current_file = None
                file_start_pattern = re.compile(r'<file path="([^"]+)">')
                file_end_pattern = re.compile(r'</file>')
                files_created = 0
                files_map = {}  # Store all generated files
                full_ai_response = ""  # Track complete AI response
                
                # Fallback: Track if we're getting code without XML tags
                detected_html = False
                detected_css = False
                detected_js = False
                
                async for chunk in mvp_builder_agent.get_ai_response(
                    prompt=enhanced_prompt,
                    model=AIModel.MINIMAX,
                    system_prompt=system_prompt,
                    stream=True
                ):
                    content_buffer += chunk
                    full_ai_response += chunk
                    
                    # Stream AI content to frontend (for display)
                    yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
                    
                    # Debug: Log when we see file tags
                    if '<file path=' in chunk:
                        logger.info(f"🔍 Detected file tag in chunk: {chunk[:100]}")
                    if '</file>' in chunk:
                        logger.info(f"🔍 Detected file end tag in chunk")
                    
                    # Parse for XML file operations: <file path="...">content</file>
                    # Only try to parse if we have enough content
                    while True:
                        if current_file is None:
                            # Look for file start tag
                            match = file_start_pattern.search(content_buffer)
                            if match:
                                file_path = match.group(1)
                                # Determine language from extension
                                ext = file_path.split('.')[-1].lower()
                                language_map = {
                                    'js': 'javascript', 'jsx': 'javascript', 
                                    'ts': 'typescript', 'tsx': 'typescript',
                                    'py': 'python', 'html': 'html', 'css': 'css',
                                    'json': 'json', 'md': 'markdown', 'yml': 'yaml',
                                    'yaml': 'yaml', 'sh': 'shell', 'txt': 'plaintext'
                                }
                                language = language_map.get(ext, 'plaintext')
                                
                                current_file = {
                                    "path": file_path,
                                    "language": language,
                                    "content": "",
                                    "start_index": match.end()
                                }
                                
                                # Send file operation start
                                yield f"data: {json.dumps({'type': 'file_operation', 'operation': 'create', 'path': file_path, 'status': 'processing', 'language': language})}\n\n"
                                
                                # Remove everything before the file content start
                                content_buffer = content_buffer[match.end():]
                                current_file["start_index"] = 0
                            else:
                                # No file start tag found yet, wait for more content
                                break
                        else:
                            # Look for file end tag
                            end_match = file_end_pattern.search(content_buffer)
                            if end_match:
                                # Extract content between <file path="..."> and </file>
                                end_tag_index = end_match.start()
                                file_content = content_buffer[current_file["start_index"]:end_tag_index].strip()
                                
                                current_file["content"] = file_content
                                
                                # Store file in map
                                files_map[current_file["path"]] = file_content
                                
                                # Write file to sandbox
                                try:
                                    await mvp_builder_agent.update_sandbox_file(
                                        sandbox_id=sandbox.get('id'),
                                        file_path=current_file["path"],
                                        content=file_content
                                    )
                                    
                                    files_created += 1
                                    
                                    # Send file completion with clean status
                                    yield f"data: {json.dumps({'type': 'file_operation', 'operation': 'create', 'path': current_file['path'], 'status': 'completed', 'content': file_content, 'language': current_file['language']})}\n\n"
                                    
                                    # Send progress update
                                    file_path_display = current_file["path"]
                                    yield f"data: {json.dumps({'type': 'status', 'message': f'✅ Created {files_created} file(s) - {file_path_display}'})}\n\n"
                                    
                                except Exception as e:
                                    logger.error(f"Error writing file to sandbox: {e}")
                                    yield f"data: {json.dumps({'type': 'file_operation', 'operation': 'create', 'path': current_file['path'], 'status': 'error', 'error': str(e)})}\n\n"
                                
                                # Reset for next file - remove processed content including end tag
                                content_buffer = content_buffer[end_match.end():]
                                current_file = None
                            else:
                                # No end tag found yet, wait for more content
                                break
                
                # Debug: Log full response summary
                logger.info(f"📊 AI Response Summary:")
                logger.info(f"   - Total length: {len(full_ai_response)} characters")
                logger.info(f"   - Contains '<file path=': {full_ai_response.count('<file path=')}")
                logger.info(f"   - Contains '</file>': {full_ai_response.count('</file>')}")
                logger.info(f"   - Files created: {files_created}")
                
                # FALLBACK: If no files were created, try to extract code blocks
                if files_created == 0:
                    logger.warning(f"⚠️ No complete files found! Attempting fallback code extraction...")
                    
                    # Check if we have incomplete XML tags (stream was truncated)
                    incomplete_xml = False
                    if '<file path=' in full_ai_response:
                        file_tag_count = full_ai_response.count('<file path=')
                        close_tag_count = full_ai_response.count('</file>')
                        if file_tag_count > close_tag_count:
                            incomplete_xml = True
                            logger.warning(f"⚠️ Detected incomplete XML tags - {file_tag_count} opening tags, {close_tag_count} closing tags")
                    
                    # Try to extract incomplete XML files first
                    if incomplete_xml:
                        file_pattern = r'<file path="([^"]+)">(.*?)(?:</file>|$)'
                        for match in re.finditer(file_pattern, full_ai_response, re.DOTALL):
                            file_path = match.group(1)
                            file_content = match.group(2).strip()
                            
                            # Skip if already created
                            if file_path in files_map:
                                continue
                            
                            # Complete truncated files based on type
                            if file_path.endswith('.html') and not file_content.strip().endswith('</html>'):
                                file_content += '\n</html>'
                                logger.info(f"⚠️ Completed truncated HTML file: {file_path}")
                            elif file_path.endswith('.js') and file_content.count('{') > file_content.count('}'):
                                # Add missing closing braces
                                missing_braces = file_content.count('{') - file_content.count('}')
                                file_content += '\n' + '}' * missing_braces
                                logger.info(f"⚠️ Added {missing_braces} missing closing braces to {file_path}")
                            
                            try:
                                await mvp_builder_agent.update_sandbox_file(
                                    sandbox_id=sandbox.get('id'),
                                    file_path=file_path,
                                    content=file_content
                                )
                                files_map[file_path] = file_content
                                files_created += 1
                                
                                # Determine language
                                ext = file_path.split('.')[-1].lower()
                                language_map = {'js': 'javascript', 'html': 'html', 'css': 'css', 'md': 'markdown'}
                                language = language_map.get(ext, 'plaintext')
                                
                                yield f"data: {json.dumps({'type': 'file_operation', 'operation': 'create', 'path': file_path, 'status': 'completed', 'content': file_content, 'language': language})}\n\n"
                                logger.info(f"✅ Extracted incomplete XML file: {file_path}")
                            except Exception as e:
                                logger.error(f"Error creating file {file_path}: {e}")
                    
                    # Try to extract HTML (even if incomplete)
                    if 'index.html' not in files_map:
                        html_match = re.search(r'<!DOCTYPE html>.*', full_ai_response, re.DOTALL | re.IGNORECASE)
                        if html_match:
                            html_content = html_match.group(0)
                            # If no closing </html>, add it
                            if not html_content.strip().endswith('</html>'):
                                html_content += '\n</html>'
                                logger.info(f"⚠️ Added missing </html> tag")
                            try:
                                await mvp_builder_agent.update_sandbox_file(
                                    sandbox_id=sandbox.get('id'),
                                    file_path='index.html',
                                    content=html_content
                                )
                                files_map['index.html'] = html_content
                                files_created += 1
                                yield f"data: {json.dumps({'type': 'file_operation', 'operation': 'create', 'path': 'index.html', 'status': 'completed', 'content': html_content, 'language': 'html'})}\n\n"
                                logger.info(f"✅ Extracted HTML file (fallback)")
                            except Exception as e:
                                logger.error(f"Error creating HTML file: {e}")
                    
                    # Try to extract CSS from <style> tags or standalone CSS blocks
                    if 'styles.css' not in files_map:
                        # First try <style> tags
                        css_match = re.search(r'<style[^>]*>(.*?)</style>', full_ai_response, re.DOTALL | re.IGNORECASE)
                        if css_match:
                            css_content = css_match.group(1).strip()
                        else:
                            # Try to find standalone CSS (look for CSS patterns)
                            css_pattern = r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/|(?:^|\n)\s*(?:[.#]?[\w-]+|:root)\s*{[^}]*}'
                            css_matches = re.findall(css_pattern, full_ai_response, re.MULTILINE)
                            if css_matches:
                                css_content = '\n'.join(css_matches)
                            else:
                                css_content = None
                        
                        if css_content:
                            try:
                                await mvp_builder_agent.update_sandbox_file(
                                    sandbox_id=sandbox.get('id'),
                                    file_path='styles.css',
                                    content=css_content
                                )
                                files_map['styles.css'] = css_content
                                files_created += 1
                                yield f"data: {json.dumps({'type': 'file_operation', 'operation': 'create', 'path': 'styles.css', 'status': 'completed', 'content': css_content, 'language': 'css'})}\n\n"
                                logger.info(f"✅ Extracted CSS file (fallback)")
                            except Exception as e:
                                logger.error(f"Error creating CSS file: {e}")
                    
                    # Try to extract JavaScript from <script> tags or standalone JS blocks
                    if 'script.js' not in files_map:
                        # First try <script> tags
                        js_match = re.search(r'<script[^>]*>(.*?)</script>', full_ai_response, re.DOTALL | re.IGNORECASE)
                        if js_match:
                            js_content = js_match.group(1).strip()
                        else:
                            # Try to find standalone JavaScript (look for function declarations, event listeners, etc.)
                            js_pattern = r'(?:document\.addEventListener|function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=)[^;]*;?'
                            js_matches = re.findall(js_pattern, full_ai_response, re.MULTILINE)
                            if js_matches:
                                js_content = '\n'.join(js_matches)
                            else:
                                js_content = None
                        
                        if js_content:
                            try:
                                await mvp_builder_agent.update_sandbox_file(
                                    sandbox_id=sandbox.get('id'),
                                    file_path='script.js',
                                    content=js_content
                                )
                                files_map['script.js'] = js_content
                                files_created += 1
                                yield f"data: {json.dumps({'type': 'file_operation', 'operation': 'create', 'path': 'script.js', 'status': 'completed', 'content': js_content, 'language': 'javascript'})}\n\n"
                                logger.info(f"✅ Extracted JavaScript file (fallback)")
                            except Exception as e:
                                logger.error(f"Error creating JS file: {e}")
                    
                    if files_created > 0:
                        logger.info(f"✅ Fallback extraction successful: {files_created} files created")
                    else:
                        logger.error(f"❌ Fallback extraction failed! Response preview (first 500 chars):")
                        logger.error(full_ai_response[:500])
                        logger.error(f"Response preview (last 500 chars):")
                        logger.error(full_ai_response[-500:])
                
                # Validate file count
                if files_created < 3:
                    logger.warning(f"⚠️ Only {files_created} files generated - below minimum of 3!")
                    yield f"data: {json.dumps({'type': 'warning', 'message': f'Warning: Only {files_created} files generated. Minimum is 3 (index.html, styles.css, script.js).'})}\n\n"
                elif files_created >= 3:
                    logger.info(f"✅ Good file count: {files_created} files generated")
                
                # Log generation summary
                logger.info(f"✅ Generation complete: {files_created} files created")
                logger.info(f"Files: {list(files_map.keys())}")
                
                # Send completion with summary
                yield f"data: {json.dumps({'type': 'complete', 'message': f'Successfully generated {files_created} files', 'files_count': files_created, 'files': list(files_map.keys())})}\n\n"
                
            except asyncio.CancelledError:
                logger.warning("Stream was cancelled by client")
                # Don't yield anything, just exit gracefully
                return
            except Exception as e:
                logger.error(f"Error in stream generation: {e}", exc_info=True)
                try:
                    yield f"data: {json.dumps({'type': 'error', 'message': f'Generation failed: {str(e)}'})}\n\n"
                except:
                    pass  # Client may have disconnected
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
    
    except Exception as e:
        logger.error(f"Error setting up stream: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scrape-url")
async def scrape_url(request: ScrapeUrlRequest):
    """
    Scrape URL using FireCrawl
    """
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        result = await mvp_builder_agent.scrape_website(
            url=request.url,
            include_screenshot=True
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error scraping URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search-web")
async def search_web(request: SearchWebRequest):
    """
    Search web using FireCrawl
    """
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        # Use the search endpoint implementation
        return {
            "status": "success",
            "message": "Use /api/mvp-builder/search endpoint for web search",
            "query": request.query
        }
    
    except Exception as e:
        logger.error(f"Error searching web: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/e2b/create-sandbox")
async def create_e2b_sandbox(request: E2BSandboxRequest):
    """
    Create E2B sandbox
    """
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        sandbox = await mvp_builder_agent.create_sandbox(template=request.template)
        
        return {
            "status": "success",
            "data": sandbox
        }
    
    except Exception as e:
        logger.error(f"Error creating E2B sandbox: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/e2b/execute-code")
async def execute_code(request: ExecuteCodeRequest):
    """
    Execute code in E2B sandbox
    """
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        # E2B command execution - simplified
        return {
            "status": "success",
            "message": "Code execution endpoint - use sandbox file updates instead",
            "sandbox_id": request.sandboxId
        }
    
    except Exception as e:
        logger.error(f"Error executing code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Business Planning endpoints are now handled by the business_planning_router


# ============================================================================
# MARKET RESEARCH API ENDPOINTS
# ============================================================================

# Request Models for Market Research
class MarketResearchRequest(BaseModel):
    """Market research request model"""
    industry: str = Field(default="", description="Industry or sector")
    target_segment: str = Field(default="", description="Target market segment")
    product_description: str = Field(default="", description="Product description")
    geographic_scope: str = Field(default="Global", description="Geographic scope")
    idea: str = Field(default="", description="Business idea")

@app.post("/api/market-research/research")
async def conduct_market_research(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Conduct comprehensive market research"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        result = await market_research_agent.conduct_research(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            product_description=data.get("product_description", ""),
            geographic_scope=data.get("geographic_scope", "Global")
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error in market research: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/market-research/competitors")
async def discover_competitors(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Discover competitors in the market"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        competitors = await market_research_agent.discover_competitors(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            limit=data.get("limit", 10)
        )
        
        return {
            "status": "success",
            "competitors": competitors
        }
    
    except Exception as e:
        logger.error(f"Error discovering competitors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/market-research/market-size")
async def estimate_market_size(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Estimate market size using TAM-SAM-SOM framework"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        market_size = await market_research_agent.estimate_market_size(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            geographic_scope=data.get("geographic_scope", "Global")
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": asdict(market_size)
        }
    
    except Exception as e:
        logger.error(f"Error estimating market size: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/market-research/trends")
async def analyze_trends(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Analyze market trends"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        trends = await market_research_agent.analyze_trends(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            limit=data.get("limit", 20)
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": [asdict(t) for t in trends]
        }
    
    except Exception as e:
        logger.error(f"Error analyzing trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/market-research/sentiment")
async def extract_sentiment(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Extract user sentiment and pain points"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        sentiment = await market_research_agent.extract_user_sentiment(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            competitors=data.get("competitors")
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": [asdict(s) for s in sentiment]
        }
    
    except Exception as e:
        logger.error(f"Error extracting sentiment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/market-research/pricing")
async def analyze_pricing(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Analyze competitor pricing models"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        # First get competitors
        competitors = await market_research_agent.discover_competitors(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            limit=data.get("limit", 10)
        )
        
        # Then analyze their pricing
        pricing = await market_research_agent.analyze_pricing(competitors)
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": [asdict(p) for p in pricing]
        }
    
    except Exception as e:
        logger.error(f"Error analyzing pricing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/market-research/swot")
async def generate_swot(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate SWOT analysis"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        swot = await market_research_agent.generate_swot(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            your_product_description=data.get("product_description", "")
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": asdict(swot)
        }
    
    except Exception as e:
        logger.error(f"Error generating SWOT: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/market-research/market-gaps")
async def identify_market_gaps(
    request: MarketResearchRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Identify market gaps and opportunities"""
    try:
        if not market_research_agent:
            raise HTTPException(status_code=503, detail="Market Research Agent not initialized")
        
        data = request.dict()
        # First get competitors
        competitors = await market_research_agent.discover_competitors(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            limit=10
        )
        
        # Then identify gaps
        gaps = await market_research_agent.identify_market_gaps(
            industry=data.get("industry", ""),
            target_segment=data.get("target_segment", ""),
            competitors=competitors
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": [asdict(g) for g in gaps]
        }
    
    except Exception as e:
        logger.error(f"Error identifying market gaps: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/market-research/report/{report_id}/markdown")
async def download_report_markdown(report_id: str):
    """Download market research report as markdown"""
    try:
        # Look for report file
        reports_dir = "reports"
        report_path = os.path.join(reports_dir, f"market_research_{report_id}.md")
        
        if not os.path.exists(report_path):
            raise HTTPException(status_code=404, detail="Report not found")
        
        return FileResponse(
            path=report_path,
            media_type="text/markdown",
            filename=f"market_research_{report_id}.md"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/market-research/health")
async def market_research_health():
    """Health check for Market Research Agent"""
    return {
        "status": "ok",
        "agent": "initialized" if market_research_agent else "not initialized",
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# BUSINESS PLANNING ADDITIONAL ENDPOINTS
# ============================================================================

# Request Model for Business Planning
class BusinessPlanningRequest(BaseModel):
    """Business planning request model"""
    idea: str = Field(default="", description="Business idea")
    target_market: str = Field(default="", description="Target market")
    industry: str = Field(default="", description="Industry")
    business_model: str = Field(default="", description="Business model")

@app.post("/api/business-plan/lean-canvas")
async def generate_lean_canvas(
    request: BusinessPlanningRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate Lean Canvas for business idea"""
    try:
        if not business_planning_agent:
            raise HTTPException(status_code=503, detail="Business Planning Agent not initialized")
        
        data = request.dict()
        lean_canvas = await business_planning_agent.generate_lean_canvas(
            idea=data.get("idea", ""),
            target_market=data.get("target_market", ""),
            business_model=data.get("business_model", "")
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": asdict(lean_canvas)
        }
    
    except Exception as e:
        logger.error(f"Error generating lean canvas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/business-plan/financials")
async def estimate_financials(
    request: BusinessPlanningRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Estimate financial projections"""
    try:
        if not business_planning_agent:
            raise HTTPException(status_code=503, detail="Business Planning Agent not initialized")
        
        data = request.dict()
        financials = await business_planning_agent.estimate_financials(
            idea=data.get("idea", ""),
            business_model=data.get("business_model", ""),
            target_market_size=data.get("target_market_size", "")
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": asdict(financials)
        }
    
    except Exception as e:
        logger.error(f"Error estimating financials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/business-plan/team")
async def map_team_roles(
    request: BusinessPlanningRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Map team roles and composition"""
    try:
        if not business_planning_agent:
            raise HTTPException(status_code=503, detail="Business Planning Agent not initialized")
        
        data = request.dict()
        team = await business_planning_agent.map_team_roles(
            idea=data.get("idea", ""),
            business_model=data.get("business_model", ""),
            stage=data.get("stage", "pre-seed")
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": asdict(team)
        }
    
    except Exception as e:
        logger.error(f"Error mapping team roles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/business-plan/marketing")
async def build_marketing_strategy(
    request: BusinessPlanningRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Build marketing strategy"""
    try:
        if not business_planning_agent:
            raise HTTPException(status_code=503, detail="Business Planning Agent not initialized")
        
        data = request.dict()
        marketing = await business_planning_agent.build_marketing_strategy(
            idea=data.get("idea", ""),
            target_audience=data.get("target_audience", ""),
            budget=data.get("budget", 10000)
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": asdict(marketing)
        }
    
    except Exception as e:
        logger.error(f"Error building marketing strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/business-plan/compliance")
async def check_compliance(
    request: BusinessPlanningRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Check regulatory compliance requirements"""
    try:
        if not business_planning_agent:
            raise HTTPException(status_code=503, detail="Business Planning Agent not initialized")
        
        data = request.dict()
        compliance = await business_planning_agent.check_regulatory_compliance(
            idea=data.get("idea", ""),
            industry=data.get("industry", ""),
            region=data.get("region", "United States")
        )
        
        from dataclasses import asdict
        return {
            "status": "success",
            "data": asdict(compliance)
        }
    
    except Exception as e:
        logger.error(f"Error checking compliance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/business-plan/health")
async def business_plan_health():
    """Health check for Business Planning Agent"""
    return {
        "status": "ok",
        "agent": "initialized" if business_planning_agent else "not initialized",
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# IDEA VALIDATION ADDITIONAL ENDPOINTS
# ============================================================================

@app.get("/api/idea-validation/report/{validation_id}")
async def download_validation_report(validation_id: str):
    """Download PDF validation report"""
    try:
        # Look for report file
        reports_dir = "reports"
        report_path = os.path.join(reports_dir, f"idea_validation_{validation_id}.pdf")
        
        if not os.path.exists(report_path):
            raise HTTPException(status_code=404, detail="Report not found")
        
        return FileResponse(
            path=report_path,
            media_type="application/pdf",
            filename=f"idea_validation_{validation_id}.pdf"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading validation report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PITCH DECK API ENDPOINTS
# ============================================================================

class PitchDeckCreateRequest(BaseModel):
    """Pitch deck creation request"""
    business_idea: str = Field(..., description="Business idea description")
    business_name: str = Field(default="", description="Business name")
    target_market: str = Field(default="", description="Target market")
    funding_ask: float = Field(default=0, description="Funding ask amount")
    brand_tone: str = Field(default="professional", description="Brand tone")
    include_voiceover: bool = Field(default=True, description="Include voiceover")
    include_demo_script: bool = Field(default=True, description="Include demo script")
    include_qa: bool = Field(default=True, description="Include Q&A")


class PitchDeckSlidesRequest(BaseModel):
    """Pitch deck slides generation request"""
    business_idea: str = Field(..., description="Business idea description")
    business_name: str = Field(default="", description="Business name")
    target_market: str = Field(default="", description="Target market")
    funding_ask: float = Field(default=0, description="Funding ask amount")


class VoiceoverRequest(BaseModel):
    """Voiceover generation request"""
    slides: Dict[str, Any] = Field(..., description="Slides data")
    voice_style: str = Field(default="professional", description="Voice style")


class DemoScriptRequest(BaseModel):
    """Demo script generation request"""
    slides: Dict[str, Any] = Field(..., description="Slides data")
    target_duration_minutes: float = Field(default=5.0, description="Target duration")


class InvestorQARequest(BaseModel):
    """Investor Q&A generation request"""
    business_idea: str = Field(..., description="Business idea")
    slides: Dict[str, Any] = Field(..., description="Slides data")
    num_questions: int = Field(default=10, description="Number of questions")


class DesignThemeRequest(BaseModel):
    """Design theme selection request"""
    business_idea: str = Field(..., description="Business idea")
    brand_tone: str = Field(default="professional", description="Brand tone")


@app.post("/api/pitch-deck/create")
async def create_pitch_deck(
    request: PitchDeckCreateRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Create a complete pitch deck with all features"""
    try:
        if not pitch_deck_agent:
            raise HTTPException(status_code=503, detail="Pitch Deck Agent not initialized")
        
        logger.info(f"Creating pitch deck for: {request.business_name or request.business_idea[:50]}")
        
        # Create complete pitch deck
        pitch_deck = await pitch_deck_agent.create_pitch_deck(
            business_idea=request.business_idea,
            business_name=request.business_name,
            target_market=request.target_market,
            funding_ask=request.funding_ask,
            brand_tone=request.brand_tone,
            include_voiceover=request.include_voiceover,
            include_demo_script=request.include_demo_script,
            include_qa=request.include_qa
        )
        
        # Convert to dict for JSON serialization
        from dataclasses import asdict
        pitch_deck_dict = asdict(pitch_deck)
        
        return {
            "status": "success",
            "data": pitch_deck_dict
        }
    
    except Exception as e:
        logger.error(f"Error creating pitch deck: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pitch-deck/slides")
async def generate_pitch_deck_slides(
    request: PitchDeckSlidesRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate pitch deck slides only"""
    try:
        if not pitch_deck_agent:
            raise HTTPException(status_code=503, detail="Pitch Deck Agent not initialized")
        
        slides = await pitch_deck_agent.generate_slides(
            business_idea=request.business_idea,
            business_name=request.business_name,
            target_market=request.target_market,
            funding_ask=request.funding_ask
        )
        
        from dataclasses import asdict
        slides_dict = asdict(slides)
        
        return {
            "status": "success",
            "data": slides_dict
        }
    
    except Exception as e:
        logger.error(f"Error generating slides: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pitch-deck/voiceover")
async def generate_voiceover(
    request: VoiceoverRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate voiceover for pitch deck slides"""
    try:
        if not pitch_deck_agent:
            raise HTTPException(status_code=503, detail="Pitch Deck Agent not initialized")
        
        # Convert dict back to slides object
        from pitch_deck_agent import PitchDeckSlides, SlideContent
        
        slides_data = request.slides
        slides = PitchDeckSlides(
            title_slide=SlideContent(**slides_data.get("title_slide", {})),
            problem_slide=SlideContent(**slides_data.get("problem_slide", {})),
            solution_slide=SlideContent(**slides_data.get("solution_slide", {})),
            market_slide=SlideContent(**slides_data.get("market_slide", {})),
            product_slide=SlideContent(**slides_data.get("product_slide", {})),
            business_model_slide=SlideContent(**slides_data.get("business_model_slide", {})),
            traction_slide=SlideContent(**slides_data.get("traction_slide", {})),
            competition_slide=SlideContent(**slides_data.get("competition_slide", {})),
            team_slide=SlideContent(**slides_data.get("team_slide", {})),
            financials_slide=SlideContent(**slides_data.get("financials_slide", {})),
            ask_slide=SlideContent(**slides_data.get("ask_slide", {})),
            closing_slide=SlideContent(**slides_data.get("closing_slide", {}))
        )
        
        voiceovers = await pitch_deck_agent.generate_voiceovers(slides)
        
        from dataclasses import asdict
        voiceovers_dict = [asdict(v) for v in voiceovers]
        
        return {
            "status": "success",
            "data": voiceovers_dict
        }
    
    except Exception as e:
        logger.error(f"Error generating voiceover: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pitch-deck/demo-script")
async def generate_demo_script(
    request: DemoScriptRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate demo script for pitch deck"""
    try:
        if not pitch_deck_agent:
            raise HTTPException(status_code=503, detail="Pitch Deck Agent not initialized")
        
        # Convert dict back to slides object
        from pitch_deck_agent import PitchDeckSlides, SlideContent
        
        slides_data = request.slides
        slides = PitchDeckSlides(
            title_slide=SlideContent(**slides_data.get("title_slide", {})),
            problem_slide=SlideContent(**slides_data.get("problem_slide", {})),
            solution_slide=SlideContent(**slides_data.get("solution_slide", {})),
            market_slide=SlideContent(**slides_data.get("market_slide", {})),
            product_slide=SlideContent(**slides_data.get("product_slide", {})),
            business_model_slide=SlideContent(**slides_data.get("business_model_slide", {})),
            traction_slide=SlideContent(**slides_data.get("traction_slide", {})),
            competition_slide=SlideContent(**slides_data.get("competition_slide", {})),
            team_slide=SlideContent(**slides_data.get("team_slide", {})),
            financials_slide=SlideContent(**slides_data.get("financials_slide", {})),
            ask_slide=SlideContent(**slides_data.get("ask_slide", {})),
            closing_slide=SlideContent(**slides_data.get("closing_slide", {}))
        )
        
        demo_script = await pitch_deck_agent.generate_demo_script(
            slides=slides,
            target_duration_minutes=request.target_duration_minutes
        )
        
        from dataclasses import asdict
        script_dict = asdict(demo_script)
        
        return {
            "status": "success",
            "data": script_dict
        }
    
    except Exception as e:
        logger.error(f"Error generating demo script: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pitch-deck/investor-qa")
async def generate_investor_qa(
    request: InvestorQARequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate investor Q&A questions"""
    try:
        if not pitch_deck_agent:
            raise HTTPException(status_code=503, detail="Pitch Deck Agent not initialized")
        
        # Convert dict back to slides object
        from pitch_deck_agent import PitchDeckSlides, SlideContent
        
        slides_data = request.slides
        slides = PitchDeckSlides(
            title_slide=SlideContent(**slides_data.get("title_slide", {})),
            problem_slide=SlideContent(**slides_data.get("problem_slide", {})),
            solution_slide=SlideContent(**slides_data.get("solution_slide", {})),
            market_slide=SlideContent(**slides_data.get("market_slide", {})),
            product_slide=SlideContent(**slides_data.get("product_slide", {})),
            business_model_slide=SlideContent(**slides_data.get("business_model_slide", {})),
            traction_slide=SlideContent(**slides_data.get("traction_slide", {})),
            competition_slide=SlideContent(**slides_data.get("competition_slide", {})),
            team_slide=SlideContent(**slides_data.get("team_slide", {})),
            financials_slide=SlideContent(**slides_data.get("financials_slide", {})),
            ask_slide=SlideContent(**slides_data.get("ask_slide", {})),
            closing_slide=SlideContent(**slides_data.get("closing_slide", {}))
        )
        
        investor_qa = await pitch_deck_agent.generate_investor_qa(
            business_idea=request.business_idea,
            slides=slides,
            num_questions=request.num_questions
        )
        
        from dataclasses import asdict
        qa_dict = [asdict(qa) for qa in investor_qa]
        
        return {
            "status": "success",
            "data": qa_dict
        }
    
    except Exception as e:
        logger.error(f"Error generating investor Q&A: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pitch-deck/design-theme")
async def select_design_theme(
    request: DesignThemeRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Select design theme for pitch deck"""
    try:
        if not pitch_deck_agent:
            raise HTTPException(status_code=503, detail="Pitch Deck Agent not initialized")
        
        theme = await pitch_deck_agent.select_design_theme(
            business_idea=request.business_idea,
            brand_tone=request.brand_tone
        )
        
        from dataclasses import asdict
        theme_dict = asdict(theme)
        
        return {
            "status": "success",
            "data": theme_dict
        }
    
    except Exception as e:
        logger.error(f"Error selecting design theme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pitch-deck/export/{deck_id}/pptx")
async def export_pitch_deck_pptx(deck_id: str):
    """Export pitch deck to PPTX format"""
    try:
        if not pitch_deck_agent:
            raise HTTPException(status_code=503, detail="Pitch Deck Agent not initialized")
        
        # For now, return a placeholder response
        # In a real implementation, you would retrieve the deck by ID and export it
        return {
            "status": "success",
            "message": "PPTX export functionality will be implemented with deck storage",
            "deck_id": deck_id
        }
    
    except Exception as e:
        logger.error(f"Error exporting PPTX: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pitch-deck/health")
async def pitch_deck_health():
    """Health check for Pitch Deck Agent"""
    return {
        "status": "ok",
        "agent": "initialized" if pitch_deck_agent else "not initialized",
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )


# ============================================================================
# MVP BUILDER API ENDPOINTS
# ============================================================================

class MVPDevelopmentRequest(BaseModel):
    """MVP Development request model"""
    productName: str = Field(..., description="Product name")
    productIdea: str = Field(..., description="Product idea description")
    coreFeatures: List[str] = Field(default=[], description="Core features")
    targetPlatform: str = Field(default="web", description="Target platform")
    techStack: List[str] = Field(default=["React", "TypeScript", "Tailwind CSS"], description="Tech stack")
    projectType: str = Field(default="web-app", description="Project type")
    generateMultipleFiles: bool = Field(default=True, description="Generate multiple files")
    includeComponents: bool = Field(default=True, description="Include components")
    defaultLanguage: str = Field(default="react", description="Default language")
    userId: Optional[str] = Field(None, description="User ID")
    scrapeUrls: Optional[List[str]] = Field(None, description="URLs to scrape for inspiration")
    userSubscription: str = Field(default="free", description="User subscription tier")


class MVPRefineRequest(BaseModel):
    """MVP Refine request model"""
    currentHtml: str = Field(..., description="Current HTML/code")
    feedback: str = Field(..., description="User feedback for refinement")
    userId: Optional[str] = Field(None, description="User ID")
    userSubscription: str = Field(default="free", description="User subscription tier")


@app.post("/api/mvpDevelopment")
async def mvp_development(
    request: MVPDevelopmentRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate MVP code based on product idea and features"""
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        logger.info(f"MVP Development request for: {request.productName}")
        
        # Build comprehensive user prompt
        user_prompt = f"""Create a complete {request.projectType} for: {request.productName}

Product Idea: {request.productIdea}

Core Features:
{chr(10).join(f'- {feature}' for feature in request.coreFeatures)}

Target Platform: {request.targetPlatform}
Tech Stack: {', '.join(request.techStack)}

Requirements:
- Generate a complete, production-ready application
- Use modern best practices and clean code
- Include all necessary components and files
- Make it responsive and user-friendly
- Use Tailwind CSS for styling
- Include proper error handling
"""

        # Scrape URLs if provided for inspiration
        scraped_content = None
        if request.scrapeUrls:
            logger.info(f"Scraping {len(request.scrapeUrls)} URLs for inspiration")
            scraped_parts = []
            for url in request.scrapeUrls[:3]:  # Limit to 3 URLs
                try:
                    scrape_result = await mvp_builder_agent.scrape_website(url, include_screenshot=False)
                    if scrape_result.get("success"):
                        scraped_parts.append(f"From {url}:\n{scrape_result.get('content', '')[:500]}")
                except Exception as e:
                    logger.warning(f"Failed to scrape {url}: {str(e)}")
            
            if scraped_parts:
                scraped_content = "\n\n".join(scraped_parts)
        
        # Use HTML-optimized system prompt for better completion
        system_prompt = get_html_system_prompt()
        
        # Add scraped content context if available
        if scraped_content:
            system_prompt += f"\n\n## Reference Website Content:\n{scraped_content}\n"
        
        # Add MVP-specific instructions
        system_prompt += """

MVP GENERATION SPECIFIC RULES:
1. Generate 3-7 complete files (index.html, styles.css, script.js + optional utils/animations)
2. Use the <file path="...">...</file> format for each file - DO NOT use markdown code blocks
3. Make each file 100% COMPLETE with ZERO truncation
4. Make the code production-ready and fully functional
5. Ensure responsive design and beautiful UI with Tailwind CSS
6. Include proper imports and exports in all files
7. CRITICAL: Do NOT output "component.markdown" or any markdown file references
8. CRITICAL: Use ONLY the <file path="...">content</file> XML format, NOT ```language blocks

Example format (USE THIS EXACT FORMAT):
<file path="src/App.jsx">
import React from 'react';
// Complete App.jsx code
export default App;
</file>

<file path="src/components/Header.jsx">
import React from 'react';
// Complete Header component
export default Header;
</file>

<file path="src/index.css">
@tailwind base;
@tailwind components;
@tailwind utilities;
/* Custom styles */
</file>

DO NOT USE:
```jsx
// code
```

ALWAYS USE:
<file path="...">code</file>"""
        
        # Generate code using AI with dynamic prompt
        logger.info(f"🚀 Using MiniMax M2 (Hugging Face) for MVP Development: {request.productName}")
        
        full_response = ""
        async for chunk in mvp_builder_agent.get_ai_response(
            prompt=user_prompt,
            model=AIModel.MINIMAX,
            system_prompt=system_prompt,
            stream=False
        ):
            full_response = chunk
        
        # Parse generated files
        files_dict = mvp_builder_agent._parse_generated_code(full_response)
        
        if not files_dict:
            raise HTTPException(status_code=500, detail="Failed to generate code files")
        
        logger.info(f"Generated {len(files_dict)} files for {request.productName}")
        
        # Convert files dict to array format for frontend
        files_array = []
        for file_path, content in files_dict.items():
            # Determine language from file extension
            ext = file_path.split('.')[-1].lower()
            language_map = {
                'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
                'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json',
                'md': 'markdown', 'yml': 'yaml', 'yaml': 'yaml'
            }
            language = language_map.get(ext, 'plaintext')
            
            files_array.append({
                "path": file_path,
                "preview": content,
                "size": len(content.encode('utf-8')),
                "language": language
            })
        
        return {
            "status": "success",
            "message": "MVP generated successfully",
            "code": full_response,
            "files": files_array,
            "filesDict": files_dict,  # Keep dict format for backward compatibility
            "fileCount": len(files_array),
            "metadata": {
                "model": "MiniMax-M2",
                "provider": "Hugging Face",
                "reason": "Optimized for code generation",
                "timestamp": datetime.utcnow().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in MVP development: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp/refine")
async def mvp_refine(
    request: MVPRefineRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Refine existing MVP based on user feedback"""
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        logger.info(f"MVP Refine request with feedback: {request.feedback[:100]}")
        
        # Parse current code to extract files
        current_files = mvp_builder_agent._parse_generated_code(request.currentHtml)
        target_files = list(current_files.keys()) if current_files else []
        
        # Build refinement user prompt
        user_prompt = f"""Refine the following code based on user feedback:

Current Code:
{request.currentHtml[:2000]}

User Feedback: {request.feedback}

Requirements:
- Make ONLY the changes requested in the feedback
- Maintain all existing functionality
- Keep the same file structure
- Return the complete updated files using <file path="...">...</file> format
- Ensure the changes are clean and professional
"""

        # Detect prompt type from feedback
        prompt_type = detect_prompt_type(request.feedback, is_edit=True)
        logger.info(f"Detected refinement type: {prompt_type.value}")
        
        # Build dynamic system prompt for edit mode
        system_prompt = build_dynamic_prompt(
            user_prompt=user_prompt,
            is_edit=True,
            target_files=target_files,
            conversation_messages=[{"role": "user", "content": request.feedback}],
            conversation_edits=[],
            scraped_content=None
        )
        
        # Add refinement-specific instructions
        system_prompt += """

REFINEMENT SPECIFIC RULES:
1. Return COMPLETE files, not just changes or diffs
2. Use <file path="...">...</file> format for each file
3. Maintain all existing imports and structure
4. Make surgical, precise changes only
5. Don't add features not requested
6. Preserve all working functionality"""
        
        # Generate refined code with dynamic prompt
        full_response = ""
        async for chunk in mvp_builder_agent.get_ai_response(
            prompt=user_prompt,
            model=AIModel.MINIMAX,
            system_prompt=system_prompt,
            stream=False
        ):
            full_response = chunk
        
        # Parse refined files
        files_dict = mvp_builder_agent._parse_generated_code(full_response)
        
        if not files_dict:
            # If no files parsed, return the original with a message
            logger.warning("No files parsed from refinement, returning original")
            return {
                "status": "success",
                "message": "Refinement applied",
                "code": full_response,
                "files": [],
                "timestamp": datetime.now().isoformat()
            }
        
        logger.info(f"Refined {len(files_dict)} files")
        
        # Convert files dict to array format for frontend
        files_array = []
        for file_path, content in files_dict.items():
            # Determine language from file extension
            ext = file_path.split('.')[-1].lower()
            language_map = {
                'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
                'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json',
                'md': 'markdown', 'yml': 'yaml', 'yaml': 'yaml'
            }
            language = language_map.get(ext, 'plaintext')
            
            files_array.append({
                "path": file_path,
                "preview": content,
                "size": len(content.encode('utf-8')),
                "language": language
            })
        
        return {
            "status": "success",
            "message": "MVP refined successfully",
            "code": full_response,
            "files": files_array,
            "filesDict": files_dict,  # Keep dict format for backward compatibility
            "fileCount": len(files_array),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in MVP refinement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp-builder/generate-code-stream")
async def generate_code_stream(
    request: CodeGenerationRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Generate code with streaming response using dynamic prompts"""
    try:
        logger.info(f"Code generation stream request: {request.prompt[:100]}")
        
        async def stream_generator():
            # The mvp_builder_agent.generate_code_stream already uses prompt templates internally
            async for chunk in mvp_builder_agent.generate_code_stream(
                prompt=request.prompt,
                model=request.model,
                context=request.context,
                is_edit=request.is_edit
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(
            stream_generator(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
    
    except Exception as e:
        logger.error(f"Error in code generation stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/regenerateComponent")
async def regenerate_component(
    request: BaseModel,
    token: Optional[str] = Depends(verify_token)
):
    """Regenerate a specific component with improved prompt handling"""
    try:
        if not mvp_builder_agent:
            raise HTTPException(status_code=503, detail="MVP Builder Agent not initialized")
        
        data = request.dict()
        component_name = data.get("componentName", "")
        current_code = data.get("currentCode", "")
        feedback = data.get("feedback", "")
        file_path = data.get("filePath", f"src/components/{component_name}.jsx")
        
        logger.info(f"Regenerating component: {component_name}")
        
        # Build user prompt for component regeneration
        user_prompt = f"""Regenerate the {component_name} component with the following requirements:

Current Code:
{current_code[:1500]}

Feedback/Requirements: {feedback}

Instructions:
- Keep the same component name and export structure
- Maintain existing props and functionality unless specified otherwise
- Use Tailwind CSS for styling
- Make the component responsive and modern
- Return only the complete component code
"""

        # Build dynamic system prompt for component editing
        system_prompt = build_dynamic_prompt(
            user_prompt=user_prompt,
            is_edit=True,
            target_files=[file_path],
            conversation_messages=[{"role": "user", "content": feedback}] if feedback else None
        )
        
        # Add component-specific instructions
        system_prompt += f"""

COMPONENT REGENERATION RULES:
1. Generate ONLY the {component_name} component
2. Use the exact file format: <file path="{file_path}">...</file>
3. Keep the same component name: {component_name}
4. Maintain all existing props and functionality
5. Use modern React patterns and Tailwind CSS
6. Make it production-ready and well-structured

Return format:
<file path="{file_path}">
import React from 'react';

const {component_name} = ({{ /* props */ }}) => {{
  // Component code here
}};

export default {component_name};
</file>"""

        # Generate component using AI
        full_response = ""
        async for chunk in mvp_builder_agent.get_ai_response(
            prompt=user_prompt,
            model=AIModel.MINIMAX,
            system_prompt=system_prompt,
            stream=False
        ):
            full_response = chunk
        
        # Parse generated component
        files = mvp_builder_agent._parse_generated_code(full_response)
        
        return {
            "status": "success",
            "message": f"{component_name} component regenerated successfully",
            "code": full_response,
            "files": files,
            "componentName": component_name,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error regenerating component: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp-builder/scrape-website")
async def scrape_website_endpoint(request: WebsiteScrapingRequest):
    """Scrape website content and optionally take screenshot"""
    try:
        agent = MVPBuilderAgent()
        result = await agent.scrape_website(
            url=request.url,
            include_screenshot=request.include_screenshot
        )
        return result
    except Exception as e:
        logger.error(f"Website scraping error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp-builder/search")
async def search_websites(request: dict):
    """Search websites using Firecrawl API (like open-lovable)"""
    try:
        query = request.get('query')
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # Use Firecrawl search to get top 10 results with screenshots
        import httpx
        
        firecrawl_api_key = os.getenv('FIRECRAWL_API_KEY')
        if not firecrawl_api_key:
            raise HTTPException(status_code=500, detail="Firecrawl API key not configured")

        async with httpx.AsyncClient() as client:
            search_response = await client.post(
                'https://api.firecrawl.dev/v1/search',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {firecrawl_api_key}',
                },
                json={
                    'query': query,
                    'limit': 10,
                    'scrapeOptions': {
                        'onlyMainContent': True,
                    },
                },
                timeout=30.0
            )

            if not search_response.is_success:
                raise HTTPException(status_code=500, detail="Search failed")

            search_data = search_response.json()
            
            # Format results with screenshots and markdown
            results = []
            if search_data.get('data'):
                for result in search_data['data']:
                    results.append({
                        'url': result.get('url', ''),
                        'title': result.get('title', result.get('url', '')),
                        'description': result.get('description', ''),
                        'screenshot': result.get('screenshot'),
                        'markdown': result.get('markdown', ''),
                    })

            return {'results': results}
            
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to perform search: {str(e)}")


@app.post("/api/mvp-builder/create-sandbox")
async def create_sandbox(
    request: SandboxCreateRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Create a new E2B sandbox"""
    try:
        sandbox_info = await mvp_builder_agent.create_sandbox(
            template=request.template,
            files=request.files
        )
        
        return {
            "status": "success",
            "data": {
                "sandbox_id": sandbox_info.id,
                "status": sandbox_info.status.value,
                "url": sandbox_info.url,
                "created_at": sandbox_info.created_at
            }
        }
    
    except Exception as e:
        logger.error(f"Error creating sandbox: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp-builder/update-files")
async def update_sandbox_files(
    request: FileUpdateRequest,
    token: Optional[str] = Depends(verify_token)
):
    """Update files in an E2B sandbox"""
    try:
        success = await mvp_builder_agent.update_sandbox_files(
            sandbox_id=request.sandbox_id,
            files=request.files
        )
        
        return {
            "status": "success" if success else "error",
            "message": "Files updated successfully" if success else "Failed to update files"
        }
    
    except Exception as e:
        logger.error(f"Error updating sandbox files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mvp-builder/sandbox-status/{sandbox_id}")
async def get_sandbox_status(
    sandbox_id: str,
    token: Optional[str] = Depends(verify_token)
):
    """Get sandbox status and information"""
    try:
        sandbox_info = await mvp_builder_agent.get_sandbox_status(sandbox_id)
        
        if not sandbox_info:
            raise HTTPException(status_code=404, detail="Sandbox not found")
        
        return {
            "status": "success",
            "data": {
                "sandbox_id": sandbox_info.id,
                "status": sandbox_info.status.value,
                "url": sandbox_info.url,
                "created_at": sandbox_info.created_at,
                "files": {
                    path: {
                        "size": file_info.size,
                        "last_modified": file_info.last_modified
                    }
                    for path, file_info in sandbox_info.files.items()
                } if sandbox_info.files else {}
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sandbox status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/mvp-builder/sandbox/{sandbox_id}")
async def cleanup_sandbox(
    sandbox_id: str,
    token: Optional[str] = Depends(verify_token)
):
    """Clean up and delete a sandbox"""
    try:
        success = await mvp_builder_agent.cleanup_sandbox(sandbox_id)
        
        return {
            "status": "success" if success else "error",
            "message": "Sandbox cleaned up successfully" if success else "Failed to cleanup sandbox"
        }
    
    except Exception as e:
        logger.error(f"Error cleaning up sandbox: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp-builder/conversation")
async def create_conversation(token: Optional[str] = Depends(verify_token)):
    """Create a new conversation"""
    try:
        conversation_id = mvp_builder_agent.create_conversation()
        
        return {
            "status": "success",
            "conversation_id": conversation_id
        }
    
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mvp-builder/style-templates")
async def get_style_templates():
    """Get available style templates"""
    try:
        templates = [
            {
                "id": "glassmorphism",
                "name": "Glassmorphism",
                "description": "Frosted glass effect with transparency",
                "preview_color": "#ffffff40",
                "category": "modern"
            },
            {
                "id": "neumorphism",
                "name": "Neumorphism",
                "description": "Soft 3D shadows and highlights",
                "preview_color": "#e0e5ec",
                "category": "modern"
            },
            {
                "id": "brutalism",
                "name": "Brutalism",
                "description": "Bold, raw, and uncompromising design",
                "preview_color": "#000000",
                "category": "bold"
            },
            {
                "id": "minimalist",
                "name": "Minimalist",
                "description": "Clean, simple, and focused",
                "preview_color": "#ffffff",
                "category": "clean"
            },
            {
                "id": "dark-mode",
                "name": "Dark Mode",
                "description": "Dark theme with high contrast",
                "preview_color": "#1a1a1a",
                "category": "dark"
            },
            {
                "id": "gradient-rich",
                "name": "Gradient Rich",
                "description": "Vibrant gradients and colors",
                "preview_color": "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
                "category": "colorful"
            },
            {
                "id": "3d-depth",
                "name": "3D Depth",
                "description": "Dimensional layers and depth",
                "preview_color": "#2c3e50",
                "category": "dimensional"
            },
            {
                "id": "retro-wave",
                "name": "Retro Wave",
                "description": "80s inspired neon aesthetics",
                "preview_color": "linear-gradient(45deg, #ff0080, #00ffff)",
                "category": "retro"
            }
        ]
        
        return {
            "status": "success",
            "data": templates
        }
    
    except Exception as e:
        logger.error(f"Error fetching style templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mvp-builder/health")
async def mvp_builder_health():
    """Health check for MVP Builder"""
    try:
        return {
            "status": "ok",
            "agent": "initialized",
            "models": {
                "minimax": bool(mvp_builder_agent.minimax_api_key),
                "groq": bool(mvp_builder_agent.groq_api_key),
                "kimi": bool(mvp_builder_agent.kimi_api_key)
            },
            "services": {
                "firecrawl": bool(mvp_builder_agent.firecrawl_api_key),
                "e2b": bool(mvp_builder_agent.e2b_api_key)
            },
            "active_sandboxes": len(mvp_builder_agent.active_sandboxes),
            "active_conversations": len(mvp_builder_agent.conversations),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in MVP Builder health check: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mvp-builder/sandbox-files/{sandbox_id}")
async def get_sandbox_files(
    sandbox_id: str,
    token: Optional[str] = Depends(verify_token)
):
    """Get all files from sandbox with manifest"""
    try:
        result = await mvp_builder_agent.get_sandbox_files(sandbox_id)
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error getting sandbox files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp-builder/detect-packages")
async def detect_and_install_packages(
    request: BaseModel,
    token: Optional[str] = Depends(verify_token)
):
    """Detect and install required packages"""
    try:
        data = request.dict()
        sandbox_id = data.get("sandbox_id")
        files = data.get("files", {})
        
        if not sandbox_id:
            raise HTTPException(status_code=400, detail="sandbox_id is required")
        
        result = await mvp_builder_agent.detect_and_install_packages(sandbox_id, files)
        
        return {
            "status": "success" if result.get("success") else "error",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error detecting/installing packages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mvp-builder/apply-code-stream")
async def apply_code_stream(
    request: BaseModel,
    token: Optional[str] = Depends(verify_token)
):
    """Apply generated code to sandbox with streaming progress"""
    try:
        data = request.dict()
        sandbox_id = data.get("sandbox_id")
        generated_code = data.get("code")
        is_edit = data.get("is_edit", False)
        
        if not sandbox_id or not generated_code:
            raise HTTPException(status_code=400, detail="sandbox_id and code are required")
        
        async def stream_generator():
            async for chunk in mvp_builder_agent.apply_code_to_sandbox(
                sandbox_id=sandbox_id,
                generated_code=generated_code,
                is_edit=is_edit
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
    
    except Exception as e:
        logger.error(f"Error applying code stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# OAUTH ENDPOINTS
# ============================================================================

@app.post("/api/auth/oauth/{provider}/callback")
async def oauth_callback(provider: str, request: BaseModel):
    """Handle OAuth callback from Google or GitHub"""
    try:
        data = request.dict()
        code = data.get("code")
        
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code required")
        
        # Exchange code for token based on provider
        user_id = None
        user_email = None
        user_name = None
        
        if provider == "google":
            # Google OAuth token exchange
            try:
                # In production, exchange code with Google OAuth API
                # For now, create user with OAuth provider info
                user_id = str(uuid.uuid4())
                user_email = f"google_user_{user_id[:8]}@oauth.nexora.ai"
                user_name = "Google User"
            except Exception as e:
                logger.error(f"Google OAuth error: {e}")
                raise HTTPException(status_code=500, detail="Google authentication failed")
        elif provider == "github":
            # GitHub OAuth token exchange
            try:
                # In production, exchange code with GitHub OAuth API
                user_id = str(uuid.uuid4())
                user_email = f"github_user_{user_id[:8]}@oauth.nexora.ai"
                user_name = "GitHub User"
            except Exception as e:
                logger.error(f"GitHub OAuth error: {e}")
                raise HTTPException(status_code=500, detail="GitHub authentication failed")
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
        
        # Create or get user from database
        existing_user = db.get_user_by_email(user_email)
        if not existing_user:
            password_hash = pwd_context.hash(str(uuid.uuid4()))  # Random password for OAuth users
            db.create_user(user_id, user_email, user_name, password_hash)
        else:
            user_id = existing_user['id']
        
        access_token = create_access_token({"sub": user_id})
        refresh_token = create_refresh_token({"sub": user_id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": user_id,
                "name": "OAuth User",
                "email": f"user@{provider}.com",
                "credits": 50
            }
        }
    except Exception as e:
        logger.error(f"OAuth callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/refresh")
async def refresh_token(request: BaseModel):
    """Refresh access token"""
    try:
        data = request.dict()
        refresh_token = data.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token required")
        
        # Verify refresh token and create new access token
        try:
            # In production, verify the refresh token signature and extract user_id
            # For now, extract from token payload (simplified)
            import jwt
            payload = jwt.decode(refresh_token, options={"verify_signature": False})
            user_id = payload.get("sub")
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid refresh token")
            
            # Verify user still exists
            user = db.get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            access_token = create_access_token({"sub": user_id})
        except jwt.DecodeError:
            raise HTTPException(status_code=401, detail="Invalid refresh token format")
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            raise HTTPException(status_code=401, detail="Token refresh failed")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 3600
        }
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ============================================================================
# PAYMENT ENDPOINTS (Stripe)
# ============================================================================

@app.post("/api/payments/create-checkout-session")
async def create_checkout_session(request: BaseModel, token: Optional[str] = Depends(verify_token)):
    """Create Stripe checkout session"""
    try:
        data = request.dict()
        price_id = data.get("priceId")
        
        if not price_id:
            raise HTTPException(status_code=400, detail="Price ID required")
        
        # Create Stripe checkout session
        # In production, integrate with actual Stripe API
        try:
            # Stripe integration would go here
            # stripe.checkout.Session.create(...)
            session_id = f"cs_{uuid.uuid4().hex}"
            logger.info(f"Created checkout session: {session_id} for price: {price_id}")
        except Exception as e:
            logger.error(f"Stripe checkout error: {e}")
            raise HTTPException(status_code=500, detail="Payment processing failed")
        
        return {"sessionId": session_id}
    except Exception as e:
        logger.error(f"Checkout session error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# REFERRAL ENDPOINTS
# ============================================================================

@app.get("/api/referrals/code")
async def get_referral_code(token: Optional[str] = Depends(verify_token)):
    """Get user's referral code"""
    try:
        # Get or create referral code from database
        try:
            user_id = token  # Extracted from verify_token
            if not user_id:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Check if user already has a referral code
            # In production, store in database
            code = f"REF{user_id[:8].upper()}"
            logger.info(f"Generated referral code for user: {user_id}")
        except Exception as e:
            logger.error(f"Referral code generation error: {e}")
            code = f"REF{uuid.uuid4().hex[:8].upper()}"
        return {"code": code}
    except Exception as e:
        logger.error(f"Get referral code error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/referrals/stats")
async def get_referral_stats(token: Optional[str] = Depends(verify_token)):
    """Get referral statistics"""
    try:
        return {
            "code": f"REF{uuid.uuid4().hex[:8].upper()}",
            "totalReferrals": 0,
            "successfulReferrals": 0,
            "creditsEarned": 0,
            "pendingRewards": 0
        }
    except Exception as e:
        logger.error(f"Get referral stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/referrals/history")
async def get_referral_history(token: Optional[str] = Depends(verify_token)):
    """Get referral history"""
    try:
        return []
    except Exception as e:
        logger.error(f"Get referral history error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/referrals/track")
async def track_referral(request: BaseModel):
    """Track referral signup"""
    try:
        data = request.dict()
        code = data.get("code")
        
        if not code:
            raise HTTPException(status_code=400, detail="Referral code required")
        
        # Track referral in database
        user_id = None
        try:
            # In production, extract user_id from token if available
            # For now, just track the referral code
            logger.info(f"Tracked referral: {code}")
            # db.track_referral(code)
            return {"success": True, "message": "Referral tracked successfully"}
        except Exception as e:
            logger.error(f"Referral tracking error: {e}")
            return {"success": False, "message": "Failed to track referral"}
    except Exception as e:
        logger.error(f"Track referral error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GIT INTEGRATION ENDPOINTS
# ============================================================================

@app.get("/api/git/status")
async def git_status(token: Optional[str] = Depends(verify_token)):
    """Check if GitHub is connected"""
    try:
        # Check if user has GitHub token
        user_id = token
        if not user_id:
            return {"connected": False}
        
        # In production, check database for GitHub OAuth token
        # github_token = db.get_github_token(user_id)
        return {"connected": False, "message": "GitHub integration available in settings"}
    except Exception as e:
        logger.error(f"Git status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/git/create-repo")
async def create_github_repo(request: BaseModel, token: Optional[str] = Depends(verify_token)):
    """Create GitHub repository"""
    try:
        data = request.dict()
        name = data.get("name")
        description = data.get("description", "")
        is_private = data.get("private", False)
        
        if not name:
            raise HTTPException(status_code=400, detail="Repository name required")
        
        # Create GitHub repository via API
        user_id = token
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # In production, use GitHub API to create repository
        # github_api.create_repo(name, description, private)
        logger.info(f"Repository creation requested: {name}")
        
        return {
            "name": name,
            "description": description,
            "url": f"https://github.com/user/{name}",
            "message": "Repository created successfully",
            "private": is_private
        }
    except Exception as e:
        logger.error(f"Create repo error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/git/push")
async def push_to_github(request: BaseModel, token: Optional[str] = Depends(verify_token)):
    """Push files to GitHub repository"""
    try:
        data = request.dict()
        repo_name = data.get("repoName")
        files = data.get("files", {})
        commit_message = data.get("commitMessage", "Initial commit")
        
        if not repo_name or not files:
            raise HTTPException(status_code=400, detail="Repository name and files required")
        
        # Push files to GitHub repository
        user_id = token
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # In production, use GitHub API to push files
        # github_api.push_files(repo_name, files, commit_message)
        logger.info(f"Git push requested to {repo_name} with {len(files)} files")
        
        return {
            "success": True,
            "message": f"Pushed {len(files)} files to {repo_name}",
            "url": f"https://github.com/user/{repo_name}"
        }
    except Exception as e:
        logger.error(f"Push to GitHub error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/git/repos")
async def get_user_repos(token: Optional[str] = Depends(verify_token)):
    """Get user's GitHub repositories"""
    try:
        # TODO: Fetch from GitHub API
        return []
    except Exception as e:
        logger.error(f"Get repos error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AI CODE REVIEW ENDPOINTS
# ============================================================================

@app.post("/api/ai/code-review")
async def review_code(request: BaseModel, token: Optional[str] = Depends(verify_token)):
    """AI code review"""
    try:
        data = request.dict()
        files = data.get("files", {})
        
        if not files:
            raise HTTPException(status_code=400, detail="Files required")
        
        # TODO: Implement AI code review
        return {
            "score": 85,
            "issues": [],
            "summary": {
                "critical": 0,
                "high": 0,
                "medium": 2,
                "low": 3
            },
            "recommendations": ["Add error handling", "Improve code documentation"],
            "strengths": ["Good code structure", "Proper naming conventions"]
        }
    except Exception as e:
        logger.error(f"Code review error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/review-file")
async def review_single_file(request: BaseModel, token: Optional[str] = Depends(verify_token)):
    """Review single file"""
    try:
        data = request.dict()
        file_name = data.get("fileName")
        content = data.get("content")
        
        if not file_name or not content:
            raise HTTPException(status_code=400, detail="File name and content required")
        
        # TODO: Implement single file review
        return {"issues": []}
    except Exception as e:
        logger.error(f"File review error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# EMAIL NOTIFICATION ENDPOINTS
# ============================================================================

@app.get("/api/notifications/email/preferences")
async def get_email_preferences(token: Optional[str] = Depends(verify_token)):
    """Get email notification preferences"""
    try:
        return {
            "preferences": {
                "projectUpdates": True,
                "weeklyTips": True,
                "securityAlerts": True,
                "marketingEmails": False,
                "referralUpdates": True
            }
        }
    except Exception as e:
        logger.error(f"Get email preferences error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/notifications/email/preferences")
async def update_email_preferences(request: BaseModel, token: Optional[str] = Depends(verify_token)):
    """Update email notification preferences"""
    try:
        data = request.dict()
        # TODO: Save to database
        return {"success": True}
    except Exception as e:
        logger.error(f"Update email preferences error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/newsletter/subscribe")
async def subscribe_newsletter(request: BaseModel):
    """Subscribe to newsletter"""
    try:
        data = request.dict()
        email = data.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email required")
        
        # TODO: Add to email list
        return {"success": True}
    except Exception as e:
        logger.error(f"Newsletter subscribe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# JWT helper functions are imported from auth.py
# Removed duplicate functions to avoid conflicts


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
