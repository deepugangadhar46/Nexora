"""
Custom Exception Classes for Nexora
====================================

Structured exception hierarchy for better error handling and debugging.
"""


class NexoraException(Exception):
    """Base exception for all Nexora-specific errors"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class AIServiceException(NexoraException):
    """AI service related errors (MiniMax, Groq, Kimi)"""
    pass


class DatabaseException(NexoraException):
    """Database related errors"""
    pass


class AuthenticationException(NexoraException):
    """Authentication and authorization errors"""
    pass


class ValidationException(NexoraException):
    """Input validation errors"""
    pass


class PaymentException(NexoraException):
    """Payment processing errors"""
    pass


class RateLimitException(NexoraException):
    """Rate limit exceeded errors"""
    pass


class ResourceNotFoundException(NexoraException):
    """Resource not found errors"""
    pass


class InsufficientCreditsException(NexoraException):
    """Insufficient credits for operation"""
    pass
