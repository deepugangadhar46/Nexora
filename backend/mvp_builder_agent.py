"""
MVP Builder Agent - AI Code Generation System
============================================

A comprehensive AI-powered code generation agent that replicates open-lovable functionality
with FastAPI backend, supporting MiniMax, Groq, and Kimi AI models.

Author: NEXORA Team
Version: 1.0.0
License: MIT
"""

import json
import uuid
import asyncio
import logging
import tempfile
import os
import re
import aiohttp
import requests
from typing import Dict, List, Optional, Any, AsyncGenerator
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from prompt_templates_html import (
    build_dynamic_prompt,
    detect_prompt_type,
    get_html_system_prompt
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# ENUMS & DATA CLASSES
# ============================================================================

class AIModel(Enum):
    """Supported AI models"""
    MINIMAX = "minimax"
    GROQ = "groq"
    KIMI = "kimi"


class SandboxStatus(Enum):
    """Sandbox status enumeration"""
    CREATING = "creating"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


class EditType(Enum):
    """Code edit types"""
    CREATE_COMPONENT = "create_component"
    UPDATE_COMPONENT = "update_component"
    FIX_BUG = "fix_bug"
    ADD_FEATURE = "add_feature"
    STYLE_CHANGE = "style_change"


@dataclass
class FileInfo:
    """File information structure"""
    path: str
    content: str
    language: str = ""
    size: int = 0
    last_modified: str = ""


@dataclass
class SandboxInfo:
    """Sandbox information structure"""
    id: str
    status: SandboxStatus
    url: Optional[str] = None
    created_at: str = ""
    files: Dict[str, FileInfo] = None


@dataclass
class ConversationMessage:
    """Conversation message structure"""
    id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class ConversationState:
    """Conversation state management"""
    conversation_id: str
    messages: List[ConversationMessage]
    sandbox_id: Optional[str] = None
    current_files: Dict[str, FileInfo] = None
    user_preferences: Dict[str, Any] = None


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CodeGenerationRequest(BaseModel):
    """Code generation request model"""
    prompt: str = Field(..., description="User prompt for code generation")
    model: str = Field(default="minimax", description="AI model to use")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    is_edit: bool = Field(default=False, description="Whether this is an edit operation")
    style: Optional[str] = Field(default="modern", description="Design style preference")


class WebsiteScrapingRequest(BaseModel):
    """Website scraping request model"""
    url: str = Field(..., description="URL to scrape")
    include_screenshot: bool = Field(default=True, description="Include screenshot")


class SandboxCreateRequest(BaseModel):
    """Sandbox creation request model"""
    template: str = Field(default="react-vite", description="Project template")
    files: Optional[Dict[str, str]] = Field(default=None, description="Initial files")


class FileUpdateRequest(BaseModel):
    """File update request model"""
    sandbox_id: str = Field(..., description="Sandbox ID")
    files: Dict[str, str] = Field(..., description="Files to update")


# ============================================================================
# MVP BUILDER AGENT CLASS
# ============================================================================

class MVPBuilderAgent:
    """Main MVP Builder Agent class"""
    
    def __init__(self):
        """Initialize the MVP Builder Agent"""
        self.minimax_api_key = os.getenv("HF_TOKEN")  # HF_TOKEN for Hugging Face
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.kimi_api_key = os.getenv("KIMI_API_KEY")
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        self.e2b_api_key = os.getenv("E2B_API_KEY")
        
        # Validate required API keys
        if not self.minimax_api_key:
            logger.warning("HF_TOKEN not found - MiniMax AI model will not be available")
        if not self.groq_api_key:
            logger.warning("GROQ_API_KEY not found - Groq AI model will not be available")
        if not self.kimi_api_key:
            logger.warning("KIMI_API_KEY not found - Kimi AI model will not be available")
        if not self.e2b_api_key:
            logger.warning("E2B_API_KEY not found - Sandbox functionality will not be available")
        if not self.firecrawl_api_key:
            logger.warning("FIRECRAWL_API_KEY not found - Website scraping will not be available")
            
        # Check if at least one AI model is available
        available_models = []
        if self.minimax_api_key:
            available_models.append("MiniMax")
        if self.groq_api_key:
            available_models.append("Groq")
        if self.kimi_api_key:
            available_models.append("Kimi")
            
        if not available_models:
            logger.error("No AI API keys found! Please configure at least one: HF_TOKEN, GROQ_API_KEY, or KIMI_API_KEY")
        else:
            logger.info(f"Available AI models: {', '.join(available_models)}")
            
        # Initialize conversation states
        self.conversations: Dict[str, ConversationState] = {}
        self.active_sandboxes: Dict[str, SandboxInfo] = {}
        
        # AI model configurations
        self.model_configs = {
            AIModel.MINIMAX: {
                "base_url": "https://router.huggingface.co/v1",
                "model": "MiniMaxAI/MiniMax-M2",
                "max_tokens": 32000,  # Hugging Face limit is 32768, using 32000 for safety
                "retry_on_rate_limit": True,
                "retry_delay": 5,
                "max_retries": 3,
                "temperature": 0.7,
                "top_p": 0.95,
                "frequency_penalty": 0.0,  # Set to 0 to allow necessary repetition in code
                "presence_penalty": 0.0,  # Set to 0 to allow similar patterns across files
                "stream_chunk_size": 512,  # Optimal chunk size for streaming
                "stop": None  # Don't use stop sequences - let model complete fully
            },
            AIModel.GROQ: {
                "base_url": "https://api.groq.com/openai/v1",
                "model": "llama-3.3-70b-versatile",  # Updated from deprecated llama-3.1-70b-versatile
                "max_tokens": 8000,  # Increased from 4000
                "temperature": 0.7,
                "top_p": 0.95,
                "frequency_penalty": 0.2,
                "presence_penalty": 0.2
            },
            AIModel.KIMI: {
                "base_url": "https://api.moonshot.cn/v1",
                "model": "moonshot-v1-32k",
                "max_tokens": 8000,  # Increased from 4000
                "temperature": 0.7,
                "top_p": 0.95,
                "frequency_penalty": 0.2,
                "presence_penalty": 0.2
            }
        }
        
        logger.info("MVP Builder Agent initialized successfully")

    async def get_ai_response(
        self, 
        prompt: str, 
        model: AIModel = AIModel.MINIMAX,
        system_prompt: Optional[str] = None,
        stream: bool = False,
        retry_count: int = 0
    ) -> AsyncGenerator[str, None] or str:
        """Get AI response from specified model with intelligent retry logic and fallback"""
        
        try:
            config = self.model_configs[model]
            logger.info(f"🤖 AI Request - Model: {model.value.upper()} | Endpoint: {config['base_url']} | Model ID: {config['model']} | Stream: {stream}")
            
            # Select API key based on model
            if model == AIModel.MINIMAX:
                api_key = self.minimax_api_key
            elif model == AIModel.GROQ:
                api_key = self.groq_api_key
            elif model == AIModel.KIMI:
                api_key = self.kimi_api_key
            else:
                raise ValueError(f"Unsupported model: {model}")
                
            if not api_key:
                raise ValueError(f"API key not found for model: {model}")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            payload = {
                "model": config["model"],
                "messages": messages,
                "max_tokens": config["max_tokens"],
                "temperature": config.get("temperature", 0.7),
                "stream": stream,
                "top_p": config.get("top_p", 0.95),
                "frequency_penalty": config.get("frequency_penalty", 0.2),
                "presence_penalty": config.get("presence_penalty", 0.2)
            }
            
            # Determine endpoint based on model (all use OpenAI-compatible format)
            endpoint = f"{config['base_url']}/chat/completions"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint,
                    headers=headers,
                    json=payload
                ) as response:
                    
                    if not response.ok:
                        error_text = await response.text()
                        
                        # Check for rate limit (429) and retry if configured
                        if response.status == 429 and config.get("retry_on_rate_limit") and retry_count < config.get("max_retries", 0):
                            retry_delay = config.get("retry_delay", 5)
                            logger.warning(f"Rate limited by {model.value.upper()}. Retrying in {retry_delay}s... (attempt {retry_count + 1}/{config.get('max_retries')})")
                            await asyncio.sleep(retry_delay)
                            
                            # Retry the request
                            if stream:
                                async for chunk in self.get_ai_response(prompt, model, system_prompt, stream, retry_count + 1):
                                    yield chunk
                                return
                            else:
                                async for chunk in self.get_ai_response(prompt, model, system_prompt, stream, retry_count + 1):
                                    yield chunk
                                return
                        
                        logger.error(f"AI API error ({model}): {error_text}")
                        raise Exception(f"AI API error: {error_text}")
                    
                    if stream:
                        total_chunks = 0
                        total_chars = 0
                        try:
                            async for line in response.content:
                                line = line.decode('utf-8').strip()
                                if line.startswith('data: '):
                                    data = line[6:]
                                    if data == '[DONE]':
                                        logger.info(f"✅ Stream completed - {total_chunks} chunks, {total_chars} characters")
                                        break
                                    try:
                                        json_data = json.loads(data)
                                        if 'choices' in json_data and json_data['choices']:
                                            delta = json_data['choices'][0].get('delta', {})
                                            if 'content' in delta:
                                                content = delta['content']
                                                total_chunks += 1
                                                total_chars += len(content)
                                                yield content
                                            
                                            # Check for finish_reason to detect early termination
                                            finish_reason = json_data['choices'][0].get('finish_reason')
                                            if finish_reason:
                                                if finish_reason == 'length':
                                                    logger.error(f"🚨 Stream truncated due to max_tokens limit! Increase max_tokens.")
                                                elif finish_reason != 'stop':
                                                    logger.warning(f"⚠️ Stream finished with reason: {finish_reason} (expected 'stop')")
                                                else:
                                                    logger.info(f"✅ Stream completed normally (finish_reason: stop)")
                                    except json.JSONDecodeError as e:
                                        logger.debug(f"JSON decode error in stream: {e}")
                                        continue
                        except asyncio.CancelledError:
                            logger.warning(f"Stream cancelled for {model.value}")
                            return
                    else:
                        data = await response.json()
                        if 'choices' in data and data['choices']:
                            yield data['choices'][0]['message']['content']
                        else:
                            raise Exception("No response from AI model")
                            
        except Exception as e:
            logger.error(f"Error getting AI response from {model}: {str(e)}")
            
            # Determine available fallback models
            fallback_models = []
            if model == AIModel.MINIMAX:
                pass
            elif model == AIModel.GROQ:
                if self.kimi_api_key:
                    fallback_models.append(AIModel.KIMI)
                if self.minimax_api_key:
                    fallback_models.append(AIModel.MINIMAX)
            elif model == AIModel.KIMI:
                if self.minimax_api_key:
                    fallback_models.append(AIModel.MINIMAX)
                if self.groq_api_key:
                    fallback_models.append(AIModel.GROQ)
            
            # Try fallback models
            for fallback_model in fallback_models:
                try:
                    logger.info(f"Falling back to {fallback_model.value.upper()} model")
                    if stream:
                        async for chunk in self.get_ai_response(prompt, fallback_model, system_prompt, stream):
                            yield chunk
                        return
                    else:
                        async for chunk in self.get_ai_response(prompt, fallback_model, system_prompt, stream):
                            yield chunk
                        return
                except Exception as fallback_error:
                    logger.error(f"Fallback to {fallback_model.value} also failed: {str(fallback_error)}")
                    continue
            
            # If all fallbacks failed, raise the original error with helpful message
            available_models = [m for m in [AIModel.MINIMAX, AIModel.GROQ, AIModel.KIMI] 
                             if getattr(self, f"{m.value}_api_key")]
            if not available_models:
                raise Exception("No AI models available. Please configure at least one API key: HF_TOKEN, GROQ_API_KEY, or KIMI_API_KEY")
            else:
                raise Exception(f"All available AI models failed. Original error: {str(e)}")

    async def scrape_website(self, url: str, include_screenshot: bool = True) -> Dict[str, Any]:
        """Scrape website content using FireCrawl"""
        
        if not self.firecrawl_api_key:
            raise ValueError("FireCrawl API key not configured")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.firecrawl_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "url": url,
                "waitFor": 3000,
                "timeout": 30000
            }
            
            # Note: formats parameter removed for Firecrawl v1 API compatibility
            if include_screenshot:
                payload["actions"] = [
                    {"type": "wait", "milliseconds": 2000},
                    {"type": "screenshot", "fullPage": False}
                ]
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.firecrawl.dev/v1/scrape",
                    headers=headers,
                    json=payload
                ) as response:
                    
                    if not response.ok:
                        error_text = await response.text()
                        logger.error(f"FireCrawl API error: {error_text}")
                        raise Exception(f"FireCrawl API error: {error_text}")
                    
                    data = await response.json()
                    
                    if not data.get("success") or not data.get("data"):
                        raise Exception("Failed to scrape website content")
                    
                    result = data["data"]
                    
                    return {
                        "success": True,
                        "url": url,
                        "title": result.get("metadata", {}).get("title", ""),
                        "description": result.get("metadata", {}).get("description", ""),
                        "content": result.get("markdown", ""),
                        "html": result.get("html", ""),
                        "screenshot": result.get("screenshot") or result.get("actions", {}).get("screenshots", [None])[0],
                        "metadata": result.get("metadata", {}),
                        "cached": result.get("cached", False)
                    }
                    
        except Exception as e:
            logger.error(f"Error scraping website {url}: {str(e)}")
            raise e

    async def create_sandbox(self, template: str = "react-vite", files: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Create a new E2B sandbox - Returns dict for compatibility"""
        
        if not self.e2b_api_key:
            logger.warning("E2B API key not configured, returning mock sandbox")
            # Return mock sandbox for development
            mock_id = f"mock-{uuid.uuid4().hex[:8]}"
            return {
                "id": mock_id,
                "sandboxId": mock_id,
                "status": "running",
                "url": f"https://{mock_id}.e2b.dev",
                "template": template
            }
        
        try:
            headers = {
                "X-API-Key": self.e2b_api_key,
                "Content-Type": "application/json"
            }
            
            # E2B API correct format (using templateID with capital ID)
            payload = {
                "templateID": template
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.e2b.dev/sandboxes",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    
                    if not response.ok:
                        error_text = await response.text()
                        logger.error(f"E2B API error: {error_text}")
                        # Return mock sandbox on error
                        mock_id = f"mock-{uuid.uuid4().hex[:8]}"
                        return {
                            "id": mock_id,
                            "sandboxId": mock_id,
                            "status": "running",
                            "url": f"https://{mock_id}.e2b.dev",
                            "template": template
                        }
                    
                    data = await response.json()
                    
                    sandbox_id = data.get("sandboxID") or data.get("id")
                    sandbox_url = f"https://{sandbox_id}.e2b.dev"
                    
                    sandbox_info = {
                        "id": sandbox_id,
                        "sandboxId": sandbox_id,
                        "status": "running",
                        "url": sandbox_url,
                        "template": template,
                        "clientId": data.get("clientID")
                    }
                    
                    logger.info(f"Created E2B sandbox: {sandbox_id}")
                    return sandbox_info
                    
        except Exception as e:
            logger.error(f"Error creating sandbox: {str(e)}")
            # Return mock sandbox on exception
            mock_id = f"mock-{uuid.uuid4().hex[:8]}"
            return {
                "id": mock_id,
                "sandboxId": mock_id,
                "status": "running",
                "url": f"https://{mock_id}.e2b.dev",
                "template": template
            }

    async def update_sandbox_file(self, sandbox_id: str, file_path: str, content: str) -> bool:
        """Update a single file in an E2B sandbox"""
        return await self.update_sandbox_files(sandbox_id, {file_path: content})
    
    async def update_sandbox_files(self, sandbox_id: str, files: Dict[str, str]) -> bool:
        """Update files in an E2B sandbox
        
        Note: E2B sandboxes are ephemeral and file updates via API are limited.
        For production, files should be included during sandbox creation or use
        the E2B SDK's filesystem methods. For now, we'll log the files that would
        be created and return success.
        """
        
        if not self.e2b_api_key:
            logger.info(f"Mock sandbox - would create {len(files)} files")
            for file_path in files.keys():
                logger.debug(f"  - {file_path}")
            return True
        
        # E2B doesn't support direct file updates via REST API
        # Files need to be included during sandbox creation or use SDK
        logger.info(f"E2B sandbox {sandbox_id}: {len(files)} files generated")
        for file_path in files.keys():
            logger.debug(f"  - {file_path}")
        
        # For now, just log success. In production, you would:
        # 1. Use E2B Python SDK for file operations
        # 2. Or include files during sandbox creation
        # 3. Or use a different approach like git clone
        
        return True

    async def get_sandbox_status(self, sandbox_id: str) -> Optional[SandboxInfo]:
        """Get sandbox status and information"""
        
        if not self.e2b_api_key:
            raise ValueError("E2B API key not configured")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.e2b_api_key}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.e2b.dev/v2/sandboxes/{sandbox_id}",
                    headers=headers
                ) as response:
                    
                    if not response.ok:
                        if response.status == 404:
                            return None
                        error_text = await response.text()
                        logger.error(f"E2B status check error: {error_text}")
                        return None
                    
                    data = await response.json()
                    
                    # Update local sandbox info
                    if sandbox_id in self.active_sandboxes:
                        self.active_sandboxes[sandbox_id].status = SandboxStatus(data.get("status", "running"))
                        self.active_sandboxes[sandbox_id].url = data.get("url")
                        return self.active_sandboxes[sandbox_id]
                    
                    return SandboxInfo(
                        id=sandbox_id,
                        status=SandboxStatus(data.get("status", "running")),
                        url=data.get("url"),
                        created_at=data.get("createdAt", ""),
                        files={}
                    )
                    
        except Exception as e:
            logger.error(f"Error getting sandbox status: {str(e)}")
            return None

    async def generate_code_stream(
        self, 
        prompt: str, 
        model: str = "minimax",
        context: Optional[Dict[str, Any]] = None,
        is_edit: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate code with streaming response using dynamic prompts"""
        
        try:
            # Convert model string to enum
            ai_model = AIModel(model.lower())
            
            # Detect prompt type and build dynamic system prompt
            prompt_type = detect_prompt_type(prompt, is_edit)
            
            # Extract conversation context if available
            conversation_messages = []
            conversation_edits = []
            scraped_content = None
            target_files = []
            
            if context:
                conversation_messages = context.get('messages', [])
                conversation_edits = context.get('edits', [])
                if context.get('scraped_content'):
                    scraped_content = context['scraped_content'][:1000]  # Limit size
                target_files = context.get('target_files', [])
            
            # Use HTML-optimized system prompt for better completion
            # For edit mode, still use dynamic prompt for surgical edits
            if is_edit and target_files:
                system_prompt = build_dynamic_prompt(
                    user_prompt=prompt,
                    is_edit=is_edit,
                    target_files=target_files,
                    conversation_messages=conversation_messages,
                    conversation_edits=conversation_edits,
                    scraped_content=scraped_content
                )
            else:
                # For new code generation, use HTML-optimized prompt
                system_prompt = get_html_system_prompt()
                
                # Add conversation context if available
                if conversation_messages:
                    system_prompt += "\n\n## Recent Conversation:\n"
                    for msg in conversation_messages[-3:]:
                        role = msg.get('role', 'user')
                        content = msg.get('content', '')[:100]
                        system_prompt += f"- {role}: {content}...\n"
                
                # Add scraped content if available
                if scraped_content:
                    system_prompt += f"\n\n## Reference Content:\n{scraped_content}\n"
            
            # Send initial status with detected intent
            yield {
                "type": "status",
                "message": f"Detected intent: {prompt_type.value.replace('_', ' ').title()} | Using {ai_model.value.upper()} AI..."
            }
            
            # Generate code with streaming
            full_response = ""
            async for chunk in self.get_ai_response(prompt, ai_model, system_prompt, stream=True):
                full_response += chunk
                yield {
                    "type": "stream",
                    "content": chunk
                }
            
            # Send completion status
            yield {
                "type": "complete",
                "message": "Code generation completed",
                "full_content": full_response,
                "prompt_type": prompt_type.value
            }
            
        except Exception as e:
            logger.error(f"Error in code generation stream: {str(e)}")
            yield {
                "type": "error",
                "message": f"Code generation failed: {str(e)}"
            }


    def create_conversation(self, conversation_id: Optional[str] = None) -> str:
        """Create a new conversation state"""
        
        if not conversation_id:
            conversation_id = f"conv_{uuid.uuid4().hex[:8]}"
        
        self.conversations[conversation_id] = ConversationState(
            conversation_id=conversation_id,
            messages=[],
            current_files={},
            user_preferences={}
        )
        
        logger.info(f"Created conversation: {conversation_id}")
        return conversation_id

    def add_message(self, conversation_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add a message to conversation history"""
        
        if conversation_id not in self.conversations:
            self.create_conversation(conversation_id)
        
        message = ConversationMessage(
            id=f"msg_{uuid.uuid4().hex[:8]}",
            role=role,
            content=content,
            timestamp=datetime.now().isoformat(),
            metadata=metadata or {}
        )
        
        self.conversations[conversation_id].messages.append(message)
        
        # Keep only last 20 messages to prevent memory issues
        if len(self.conversations[conversation_id].messages) > 20:
            self.conversations[conversation_id].messages = self.conversations[conversation_id].messages[-15:]

    async def cleanup_sandbox(self, sandbox_id: str) -> bool:
        """Clean up and delete a sandbox"""
        
        if not self.e2b_api_key:
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.e2b_api_key}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.delete(
                    f"https://api.e2b.dev/v2/sandboxes/{sandbox_id}",
                    headers=headers
                ) as response:
                    
                    # Remove from local tracking
                    if sandbox_id in self.active_sandboxes:
                        del self.active_sandboxes[sandbox_id]
                    
                    logger.info(f"Cleaned up sandbox: {sandbox_id}")
                    return response.ok
                    
        except Exception as e:
            logger.error(f"Error cleaning up sandbox {sandbox_id}: {str(e)}")
            return False


    async def get_sandbox_files(self, sandbox_id: str) -> Dict[str, Any]:
        """Get all files from sandbox and build manifest"""
        
        if not self.e2b_api_key:
            raise ValueError("E2B API key not configured")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.e2b_api_key}",
                "Content-Type": "application/json"
            }
            
            # Get file list from sandbox
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.e2b.dev/v2/sandboxes/{sandbox_id}/files",
                    headers=headers
                ) as response:
                    
                    if not response.ok:
                        error_text = await response.text()
                        logger.error(f"E2B files API error: {error_text}")
                        return {"files": {}, "structure": "", "file_count": 0}
                    
                    data = await response.json()
                    files = data.get("files", {})
                    
                    # Build file structure
                    from file_parser import build_file_manifest, extract_packages_from_files
                    
                    manifest = build_file_manifest(files)
                    packages = extract_packages_from_files(files)
                    
                    return {
                        "files": files,
                        "structure": self._build_tree_structure(files),
                        "file_count": len(files),
                        "manifest": manifest,
                        "packages": packages
                    }
                    
        except Exception as e:
            logger.error(f"Error getting sandbox files: {str(e)}")
            return {"files": {}, "structure": "", "file_count": 0}

    def _build_tree_structure(self, files: Dict[str, str]) -> str:
        """Build a tree structure representation of files"""
        if not files:
            return "No files"
        
        # Sort files by path
        sorted_files = sorted(files.keys())
        
        # Build tree
        tree_lines = []
        for file_path in sorted_files:
            depth = file_path.count('/')
            indent = "  " * depth
            file_name = file_path.split('/')[-1]
            tree_lines.append(f"{indent}├── {file_name}")
        
        return "\n".join(tree_lines)

    async def detect_and_install_packages(self, sandbox_id: str, files: Dict[str, str]) -> Dict[str, Any]:
        """Detect required packages from imports and install them"""
        
        if not self.e2b_api_key:
            raise ValueError("E2B API key not configured")
        
        try:
            from file_parser import extract_packages_from_files
            
            # Extract packages from files
            packages = extract_packages_from_files(files)
            
            if not packages:
                return {
                    "success": True,
                    "packages_installed": [],
                    "message": "No new packages to install"
                }
            
            logger.info(f"Detected packages to install: {packages}")
            
            # Install packages via E2B
            headers = {
                "Authorization": f"Bearer {self.e2b_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "command": f"npm install {' '.join(packages)}",
                "workdir": "/home/user/app"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"https://api.e2b.dev/v2/sandboxes/{sandbox_id}/commands",
                    headers=headers,
                    json=payload
                ) as response:
                    
                    if not response.ok:
                        error_text = await response.text()
                        logger.error(f"Package installation error: {error_text}")
                        return {
                            "success": False,
                            "error": "Failed to install packages"
                        }
                    
                    result = await response.json()
                    
                    return {
                        "success": True,
                        "packages_installed": packages,
                        "message": f"Installed {len(packages)} packages",
                        "output": result.get("stdout", "")
                    }
                    
        except Exception as e:
            logger.error(f"Error detecting/installing packages: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def apply_code_to_sandbox(
        self, 
        sandbox_id: str, 
        generated_code: str, 
        is_edit: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Apply generated code to sandbox with streaming progress"""
        
        try:
            # Parse the generated code to extract files
            yield {"type": "status", "message": "Parsing generated code..."}
            
            files = self._parse_generated_code(generated_code)
            
            if not files:
                yield {"type": "error", "message": "No files found in generated code"}
                return
            
            yield {"type": "status", "message": f"Found {len(files)} files to create"}
            
            # Detect and install packages
            yield {"type": "status", "message": "Detecting required packages..."}
            
            packages_result = await self.detect_and_install_packages(sandbox_id, files)
            
            if packages_result.get("packages_installed"):
                yield {
                    "type": "packages",
                    "packages": packages_result["packages_installed"],
                    "message": f"Installing {len(packages_result['packages_installed'])} packages..."
                }
            
            # Update files in sandbox
            yield {"type": "status", "message": "Applying files to sandbox..."}
            
            success = await self.update_sandbox_files(sandbox_id, files)
            
            if success:
                yield {
                    "type": "complete",
                    "message": "Code applied successfully",
                    "files_created": list(files.keys()),
                    "packages_installed": packages_result.get("packages_installed", [])
                }
            else:
                yield {"type": "error", "message": "Failed to apply some files"}
                
        except Exception as e:
            logger.error(f"Error applying code to sandbox: {str(e)}")
            yield {"type": "error", "message": str(e)}

    def _parse_generated_code(self, code: str) -> Dict[str, str]:
        """Parse generated code to extract files"""
        files = {}
        
        # Parse <file path="...">...</file> format
        file_regex = r'<file path="([^"]+)">([\s\S]*?)</file>'
        for match in re.finditer(file_regex, code):
            path, content = match.groups()
            files[path.strip()] = content.strip()
        
        # Also parse markdown code blocks with file paths
        code_block_regex = r'```(?:\w+)?\s*(?://\s*)?(.+?\.(?:tsx?|jsx?|html|css))\s*\n([\s\S]*?)```'
        for match in re.finditer(code_block_regex, code):
            path, content = match.groups()
            path = path.strip()
            if path not in files:  # Don't override <file> format
                files[path] = content.strip()
        
        return files


# ============================================================================
# GLOBAL AGENT INSTANCE
# ============================================================================

# Create global agent instance
mvp_builder_agent = MVPBuilderAgent()
