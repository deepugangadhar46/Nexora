"""
AI Model Router
===============

Intelligent routing system for AI models based on task type and availability.
- MiniMax: Primary for MVP generation (high token limit, good for code)
- Groq: Primary for other tasks (fast inference, good for analysis)
- Kimi: Fallback for all tasks

Author: NEXORA Team
Version: 1.0.0
"""

import os
import logging
from enum import Enum
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class TaskType(Enum):
    """Types of tasks for AI model routing"""
    MVP_GENERATION = "mvp_generation"
    CODE_EDIT = "code_edit"
    IDEA_VALIDATION = "idea_validation"
    MARKET_RESEARCH = "market_research"
    BUSINESS_PLANNING = "business_planning"
    PITCH_DECK = "pitch_deck"
    CHAT = "chat"
    GENERAL = "general"


class AIModelType(Enum):
    """Available AI models"""
    MINIMAX = "minimax"
    GROQ = "groq"
    KIMI = "kimi"


class ModelRouter:
    """
    Intelligent AI model router that selects the best model for each task
    """
    
    def __init__(self):
        """Initialize model router with API keys and configuration"""
        # Load API keys (with support for multiple keys per model)
        self.minimax_keys = self._load_multiple_keys("HF_TOKEN")
        self.groq_keys = self._load_multiple_keys("GROQ_API_KEY")
        self.kimi_keys = self._load_multiple_keys("KIMI_API_KEY")
        
        # Track current key index for each model (for rotation)
        self.current_key_index = {
            "minimax": 0,
            "groq": 0,
            "kimi": 0
        }
        
        # Load configuration
        self.mvp_primary = os.getenv("MVP_PRIMARY_MODEL", "minimax").lower()
        self.general_primary = os.getenv("GENERAL_PRIMARY_MODEL", "groq").lower()
        self.fallback_model = os.getenv("FALLBACK_MODEL", "kimi").lower()
        
        # Check available models
        self.available_models = self._check_available_models()
        
        # Log key counts
        logger.info(f"API Keys loaded:")
        logger.info(f"  - MiniMax/HF: {len(self.minimax_keys)} key(s)")
        logger.info(f"  - Groq: {len(self.groq_keys)} key(s)")
        logger.info(f"  - Kimi: {len(self.kimi_keys)} key(s)")
        
        # Log configuration
        logger.info(f"Model Router initialized:")
        logger.info(f"  - Available models: {', '.join(self.available_models)}")
        logger.info(f"  - MVP primary: {self.mvp_primary}")
        logger.info(f"  - General primary: {self.general_primary}")
        logger.info(f"  - Fallback: {self.fallback_model}")
        
        if not self.available_models:
            logger.error("⚠️ No AI models available! Please configure at least one API key.")
    
    def _load_multiple_keys(self, env_var_prefix: str) -> List[str]:
        """Load multiple API keys from environment variables
        
        Supports two formats:
        1. Comma-separated: HF_TOKEN=key1,key2,key3
        2. Numbered variables: HF_TOKEN_1=key1, HF_TOKEN_2=key2, HF_TOKEN_3=key3
        """
        keys = []
        
        # Try comma-separated format first
        main_key = os.getenv(env_var_prefix)
        if main_key:
            # Split by comma and strip whitespace
            keys.extend([k.strip() for k in main_key.split(',') if k.strip()])
        
        # Try numbered format (HF_TOKEN_1, HF_TOKEN_2, etc.)
        i = 1
        while True:
            numbered_key = os.getenv(f"{env_var_prefix}_{i}")
            if numbered_key:
                keys.append(numbered_key.strip())
                i += 1
            else:
                break
        
        # Remove duplicates while preserving order
        seen = set()
        unique_keys = []
        for key in keys:
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)
        
        return unique_keys
    
    def _check_available_models(self) -> List[str]:
        """Check which AI models are available based on API keys"""
        available = []
        
        if self.minimax_keys:
            available.append("minimax")
        if self.groq_keys:
            available.append("groq")
        if self.kimi_keys:
            available.append("kimi")
        
        return available
    
    def get_model_for_task(
        self,
        task_type: TaskType,
        preferred_model: Optional[str] = None,
        exclude_models: Optional[List[str]] = None
    ) -> Optional[str]:
        """
        Get the best available model for a given task
        
        Args:
            task_type: Type of task to perform
            preferred_model: User's preferred model (optional)
            exclude_models: Models to exclude (e.g., after failure)
            
        Returns:
            str: Model name to use, or None if no models available
        """
        exclude_models = exclude_models or []
        
        # If user has a preference and it's available, use it
        if preferred_model and preferred_model in self.available_models:
            if preferred_model not in exclude_models:
                logger.info(f"Using preferred model: {preferred_model}")
                return preferred_model
        
        # Determine primary model based on task type
        if task_type in [TaskType.MVP_GENERATION, TaskType.CODE_EDIT]:
            # MVP and code tasks: Use MiniMax (high token limit)
            primary = self.mvp_primary
            secondary = self.general_primary
        else:
            # Other tasks: Use Groq (fast inference)
            primary = self.general_primary
            secondary = self.mvp_primary
        
        # Try primary model
        if primary in self.available_models and primary not in exclude_models:
            logger.info(f"Using primary model for {task_type.value}: {primary}")
            return primary
        
        # Try secondary model
        if secondary in self.available_models and secondary not in exclude_models:
            logger.info(f"Primary unavailable, using secondary model: {secondary}")
            return secondary
        
        # Try fallback model
        if self.fallback_model in self.available_models and self.fallback_model not in exclude_models:
            logger.info(f"Using fallback model: {self.fallback_model}")
            return self.fallback_model
        
        # Try any available model
        for model in self.available_models:
            if model not in exclude_models:
                logger.warning(f"Using any available model: {model}")
                return model
        
        logger.error("No AI models available!")
        return None
    
    def get_model_config(self, model_name: str) -> Dict[str, Any]:
        """
        Get configuration for a specific model
        
        Args:
            model_name: Name of the model
            
        Returns:
            Dict with model configuration
        """
        configs = {
            "minimax": {
                "base_url": "https://router.huggingface.co/v1",
                "model": "MiniMaxAI/MiniMax-M2",
                "api_key": self.get_api_key("minimax"),
                "all_keys": self.minimax_keys,
                "max_tokens": 16384,  # Optimized for single-file generation (reduced from 65536)
                "temperature": 0.7,
                "top_p": 0.95,
                "best_for": ["code_generation", "mvp_development", "long_responses"],
                "strengths": "High token limit, excellent for code generation"
            },
            "groq": {
                "base_url": "https://api.groq.com/openai/v1",
                "model": "llama-3.3-70b-versatile",
                "api_key": self.get_api_key("groq"),
                "all_keys": self.groq_keys,
                "max_tokens": 8000,
                "temperature": 0.7,
                "top_p": 0.95,
                "best_for": ["analysis", "validation", "planning", "fast_responses"],
                "strengths": "Very fast inference, great for analysis tasks"
            },
            "kimi": {
                "base_url": "https://api.moonshot.cn/v1",
                "model": "moonshot-v1-8k",
                "api_key": self.get_api_key("kimi"),
                "all_keys": self.kimi_keys,
                "max_tokens": 8000,
                "temperature": 0.7,
                "top_p": 0.95,
                "best_for": ["general", "fallback"],
                "strengths": "Reliable fallback option"
            }
        }
        
        return configs.get(model_name, {})
    
    def get_api_key(self, model_name: str, rotate: bool = False) -> Optional[str]:
        """Get API key for a specific model
        
        Args:
            model_name: Name of the model
            rotate: If True, rotate to next available key (useful after rate limit/failure)
            
        Returns:
            API key string or None if no keys available
        """
        key_lists = {
            "minimax": self.minimax_keys,
            "groq": self.groq_keys,
            "kimi": self.kimi_keys
        }
        
        keys = key_lists.get(model_name, [])
        if not keys:
            return None
        
        # Rotate to next key if requested
        if rotate and len(keys) > 1:
            self.current_key_index[model_name] = (self.current_key_index[model_name] + 1) % len(keys)
            logger.info(f"🔄 Rotating {model_name} API key to index {self.current_key_index[model_name]}")
        
        current_idx = self.current_key_index.get(model_name, 0)
        return keys[current_idx]
    
    def get_all_keys_for_model(self, model_name: str) -> List[str]:
        """Get all available API keys for a model
        
        Args:
            model_name: Name of the model
            
        Returns:
            List of API keys
        """
        key_lists = {
            "minimax": self.minimax_keys,
            "groq": self.groq_keys,
            "kimi": self.kimi_keys
        }
        return key_lists.get(model_name, [])
    
    def rotate_key(self, model_name: str) -> Optional[str]:
        """Rotate to the next API key for a model
        
        Args:
            model_name: Name of the model
            
        Returns:
            Next API key or None
        """
        return self.get_api_key(model_name, rotate=True)
    
    def is_model_available(self, model_name: str) -> bool:
        """Check if a specific model is available"""
        return model_name in self.available_models
    
    def get_task_type_from_context(self, context: Dict[str, Any]) -> TaskType:
        """
        Determine task type from context
        
        Args:
            context: Context dictionary with task information
            
        Returns:
            TaskType: Detected task type
        """
        # Check for explicit task type
        if "task_type" in context:
            task_str = context["task_type"].lower()
            for task_type in TaskType:
                if task_type.value == task_str:
                    return task_type
        
        # Check for agent type
        if "agent" in context:
            agent = context["agent"].lower()
            if "mvp" in agent or "builder" in agent:
                return TaskType.MVP_GENERATION
            elif "idea" in agent or "validation" in agent:
                return TaskType.IDEA_VALIDATION
            elif "market" in agent or "research" in agent:
                return TaskType.MARKET_RESEARCH
            elif "business" in agent or "planning" in agent:
                return TaskType.BUSINESS_PLANNING
            elif "pitch" in agent or "deck" in agent:
                return TaskType.PITCH_DECK
        
        # Check for operation type
        if "is_edit" in context and context["is_edit"]:
            return TaskType.CODE_EDIT
        
        # Default to general
        return TaskType.GENERAL
    
    def get_recommended_models_for_task(self, task_type: TaskType) -> List[str]:
        """
        Get list of recommended models for a task in priority order
        
        Args:
            task_type: Type of task
            
        Returns:
            List of model names in priority order
        """
        recommendations = {
            TaskType.MVP_GENERATION: ["minimax", "groq", "kimi"],
            TaskType.CODE_EDIT: ["minimax", "groq", "kimi"],
            TaskType.IDEA_VALIDATION: ["groq", "minimax", "kimi"],
            TaskType.MARKET_RESEARCH: ["groq", "kimi", "minimax"],
            TaskType.BUSINESS_PLANNING: ["groq", "minimax", "kimi"],
            TaskType.PITCH_DECK: ["groq", "minimax", "kimi"],
            TaskType.CHAT: ["groq", "kimi", "minimax"],
            TaskType.GENERAL: ["groq", "minimax", "kimi"]
        }
        
        # Filter to only available models
        recommended = recommendations.get(task_type, ["groq", "minimax", "kimi"])
        return [m for m in recommended if m in self.available_models]


# Global model router instance
model_router = ModelRouter()


# Convenience functions
def get_model_for_mvp() -> Optional[str]:
    """Get best model for MVP generation"""
    return model_router.get_model_for_task(TaskType.MVP_GENERATION)


def get_model_for_analysis() -> Optional[str]:
    """Get best model for analysis tasks"""
    return model_router.get_model_for_task(TaskType.GENERAL)


def get_model_config(model_name: str) -> Dict[str, Any]:
    """Get configuration for a model"""
    return model_router.get_model_config(model_name)


def is_model_available(model_name: str) -> bool:
    """Check if a model is available"""
    return model_router.is_model_available(model_name)
