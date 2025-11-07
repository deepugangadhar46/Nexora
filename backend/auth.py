"""
Authentication and Authorization Module
========================================

Handles JWT token generation, verification, and OAuth integration.

Author: NEXORA Team
Version: 1.0.0
"""

import os
import jwt
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import logging
from pathlib import Path

# Load environment variables from root directory
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
JWT_REFRESH_EXPIRATION_DAYS = int(os.getenv("JWT_REFRESH_EXPIRATION_DAYS", "30"))

# Warn if JWT_SECRET is using default
if not os.getenv("JWT_SECRET"):
    logger.warning("⚠️ Using auto-generated JWT_SECRET. Set JWT_SECRET in .env for production!")

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/auth/google/callback")

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8080/auth/github/callback")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        bool: True if password matches
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False


def create_access_token(user_id: str, email: str, additional_claims: Optional[Dict[str, Any]] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        user_id: User's unique identifier
        email: User's email
        additional_claims: Optional additional claims to include
        
    Returns:
        str: JWT token
    """
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expiration,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    # Add additional claims if provided
    if additional_claims:
        payload.update(additional_claims)
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verify a JWT access token
    
    Args:
        token: JWT token string
        
    Returns:
        Dict: Decoded token payload
        
    Raises:
        jwt.ExpiredSignatureError: If token has expired
        jwt.InvalidTokenError: If token is invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "access":
            raise jwt.InvalidTokenError("Invalid token type")
        
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        raise


def create_refresh_token(user_id: str) -> str:
    """
    Create a JWT refresh token (longer expiration)
    
    Args:
        user_id: User's unique identifier
        
    Returns:
        str: JWT refresh token
    """
    expiration = datetime.utcnow() + timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)
    
    payload = {
        "user_id": user_id,
        "exp": expiration,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Dict containing token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        return None


def decode_token_without_verification(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a JWT token without verification (for debugging only)
    
    Args:
        token: JWT token string
        
    Returns:
        Dict containing token payload
    """
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except Exception as e:
        logger.error(f"Error decoding token: {str(e)}")
        return None


def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a token
    
    Args:
        token: JWT token string
        
    Returns:
        datetime: Expiration time or None if invalid
    """
    payload = decode_token_without_verification(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"])
    return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired
    
    Args:
        token: JWT token string
        
    Returns:
        bool: True if expired
    """
    expiration = get_token_expiration(token)
    if expiration:
        return datetime.utcnow() > expiration
    return True


def refresh_access_token(refresh_token: str) -> Optional[Dict[str, Any]]:
    """
    Generate a new access token from a refresh token
    
    Args:
        refresh_token: Valid refresh token
        
    Returns:
        Dict with access_token, refresh_token, and expires_in, or None if invalid
    """
    payload = verify_token(refresh_token)
    
    if not payload:
        return None
    
    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        logger.warning("Attempted to refresh with non-refresh token")
        return None
    
    # Create new access token
    user_id = payload.get("user_id")
    if not user_id:
        return None
    
    # Fetch user email from database
    try:
        from database import Database
        db = Database()
        user = db.get_user_by_id(user_id)
        email = user.get("email", "") if user else ""
    except Exception as e:
        logger.error(f"Error fetching user for refresh: {e}")
        email = ""
    
    # Create new tokens
    new_access_token = create_access_token(user_id, email)
    new_refresh_token = create_refresh_token(user_id)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "expires_in": JWT_EXPIRATION_HOURS * 3600  # Convert hours to seconds
    }


# OAuth Helper Functions

def get_google_oauth_url(state: Optional[str] = None) -> str:
    """
    Generate Google OAuth authorization URL
    
    Args:
        state: Optional state parameter for CSRF protection
        
    Returns:
        str: Google OAuth URL
    """
    if not GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID not configured")
    
    state = state or secrets.token_urlsafe(32)
    
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    from urllib.parse import urlencode
    return f"{base_url}?{urlencode(params)}"


def get_github_oauth_url(state: Optional[str] = None) -> str:
    """
    Generate GitHub OAuth authorization URL
    
    Args:
        state: Optional state parameter for CSRF protection
        
    Returns:
        str: GitHub OAuth URL
    """
    if not GITHUB_CLIENT_ID:
        raise ValueError("GITHUB_CLIENT_ID not configured")
    
    state = state or secrets.token_urlsafe(32)
    
    base_url = "https://github.com/login/oauth/authorize"
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "user:email",
        "state": state
    }
    
    from urllib.parse import urlencode
    return f"{base_url}?{urlencode(params)}"


async def exchange_google_code(code: str) -> Optional[Dict[str, Any]]:
    """
    Exchange Google OAuth code for user information
    
    Args:
        code: Authorization code from Google
        
    Returns:
        Dict with user info or None if failed
    """
    import aiohttp
    
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        logger.error("Google OAuth not configured")
        return None
    
    # Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(token_url, data=token_data) as response:
                if response.status != 200:
                    logger.error(f"Google token exchange failed: {response.status}")
                    return None
                
                token_response = await response.json()
                access_token = token_response.get("access_token")
                
                if not access_token:
                    return None
                
                # Get user info
                user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
                headers = {"Authorization": f"Bearer {access_token}"}
                
                async with session.get(user_info_url, headers=headers) as user_response:
                    if user_response.status != 200:
                        logger.error(f"Google user info fetch failed: {user_response.status}")
                        return None
                    
                    user_info = await user_response.json()
                    return {
                        "email": user_info.get("email"),
                        "name": user_info.get("name"),
                        "picture": user_info.get("picture"),
                        "google_id": user_info.get("id"),
                        "verified_email": user_info.get("verified_email", False)
                    }
    
    except Exception as e:
        logger.error(f"Error in Google OAuth: {str(e)}")
        return None


async def exchange_github_code(code: str) -> Optional[Dict[str, Any]]:
    """
    Exchange GitHub OAuth code for user information
    
    Args:
        code: Authorization code from GitHub
        
    Returns:
        Dict with user info or None if failed
    """
    import aiohttp
    
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        logger.error("GitHub OAuth not configured")
        return None
    
    # Exchange code for access token
    token_url = "https://github.com/login/oauth/access_token"
    token_data = {
        "code": code,
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "redirect_uri": GITHUB_REDIRECT_URI
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {"Accept": "application/json"}
            async with session.post(token_url, data=token_data, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"GitHub token exchange failed: {response.status}")
                    return None
                
                token_response = await response.json()
                access_token = token_response.get("access_token")
                
                if not access_token:
                    return None
                
                # Get user info
                user_info_url = "https://api.github.com/user"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
                
                async with session.get(user_info_url, headers=headers) as user_response:
                    if user_response.status != 200:
                        logger.error(f"GitHub user info fetch failed: {user_response.status}")
                        return None
                    
                    user_info = await user_response.json()
                    
                    # Get user email (separate endpoint)
                    email_url = "https://api.github.com/user/emails"
                    async with session.get(email_url, headers=headers) as email_response:
                        emails = await email_response.json() if email_response.status == 200 else []
                        primary_email = next(
                            (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                            user_info.get("email")
                        )
                    
                    return {
                        "email": primary_email,
                        "name": user_info.get("name") or user_info.get("login"),
                        "avatar": user_info.get("avatar_url"),
                        "github_id": user_info.get("id"),
                        "github_username": user_info.get("login")
                    }
    
    except Exception as e:
        logger.error(f"Error in GitHub OAuth: {str(e)}")
        return None
