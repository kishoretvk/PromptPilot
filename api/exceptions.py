\"\"\"Custom exceptions for PromptPilot API\"\"\"

class PromptPilotError(Exception):
    \"\"\"Base exception for PromptPilot\"\"\"
    
    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(PromptPilotError):
    \"\"\"Raised when input validation fails\"\"\"
    pass

class AuthenticationError(PromptPilotError):
    \"\"\"Raised when authentication fails\"\"\"
    pass

class AuthorizationError(PromptPilotError):
    \"\"\"Raised when user lacks required permissions\"\"\"
    pass

class PromptNotFoundError(PromptPilotError):
    \"\"\"Raised when prompt is not found\"\"\"
    pass

class PipelineNotFoundError(PromptPilotError):
    \"\"\"Raised when pipeline is not found\"\"\"
    pass

class ExecutionError(PromptPilotError):
    \"\"\"Raised when prompt/pipeline execution fails\"\"\"
    pass

class LLMProviderError(PromptPilotError):
    \"\"\"Raised when LLM provider operations fail\"\"\"
    pass

class StorageError(PromptPilotError):
    \"\"\"Raised when storage operations fail\"\"\"
    pass

class RateLimitError(PromptPilotError):
    \"\"\"Raised when rate limit is exceeded\"\"\"
    pass

class ConfigurationError(PromptPilotError):
    \"\"\"Raised when configuration is invalid\"\"\"
    pass

class DatabaseError(PromptPilotError):
    \"\"\"Raised when database operations fail\"\"\"
    pass

class ExternalServiceError(PromptPilotError):
    \"\"\"Raised when external service calls fail\"\"\"
    pass