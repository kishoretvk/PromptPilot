from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
import re
import uuid

# Custom validation exceptions
class ValidationError(Exception):
    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"{field}: {message}")

# Enums for better validation
class PromptStatus(str, Enum):
    DRAFT = "draft"
    TESTING = "testing"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"

class TaskType(str, Enum):
    TEXT_GENERATION = "text-generation"
    TEXT_CLASSIFICATION = "text-classification"
    TEXT_SUMMARIZATION = "text-summarization"
    QUESTION_ANSWERING = "question-answering"
    CODE_GENERATION = "code-generation"
    TRANSLATION = "translation"
    CONVERSATION = "conversation"
    CUSTOM = "custom"

class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    FUNCTION = "function"

class ModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    AZURE = "azure"
    LOCAL = "local"
    CUSTOM = "custom"

class PipelineStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Base schemas with validation
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class IDMixin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier")
    
    @field_validator('id')
    @classmethod
    def validate_id(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError("Invalid UUID format")

# Message schemas
class PromptMessage(BaseModel):
    role: MessageRole = Field(..., description="Message role")
    content: str = Field(..., min_length=1, max_length=50000, description="Message content")
    priority: int = Field(default=1, ge=1, le=100, description="Message priority for ordering")
    variables: Optional[Dict[str, str]] = Field(default_factory=dict, description="Template variables")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Message content cannot be empty or whitespace only")
        # Check for potential security issues
        if re.search(r'<script[^>]*>.*?</script>', v, re.IGNORECASE):
            raise ValueError("Script tags are not allowed in message content")
        return v.strip()

# Input validation schemas
class CreatePromptRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Prompt name")
    description: Optional[str] = Field(None, max_length=2000, description="Prompt description")
    task_type: TaskType = Field(..., description="Type of task this prompt is designed for")
    tags: List[str] = Field(default_factory=list, max_items=20, description="Tags for categorization")
    developer_notes: Optional[str] = Field(None, max_length=5000, description="Internal developer notes")
    messages: List[PromptMessage] = Field(..., min_items=1, max_items=50, description="Prompt messages")
    input_variables: Dict[str, str] = Field(default_factory=dict, max_items=50, description="Input variable definitions")
    model_provider: ModelProvider = Field(..., description="LLM provider")
    model_name: str = Field(..., min_length=1, max_length=100, description="Specific model name")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Model parameters")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError("Prompt name cannot be empty")
        # Check for invalid characters
        if re.search(r'[<>"/\\|?*\x00-\x1f]', v):
            raise ValueError("Prompt name contains invalid characters")
        return v.strip()
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if not v:
            return v
        
        validated_tags = []
        for tag in v:
            if not isinstance(tag, str):
                raise ValueError("All tags must be strings")
            tag = tag.strip().lower()
            if not tag:
                continue
            if len(tag) > 50:
                raise ValueError("Tag length cannot exceed 50 characters")
            if re.search(r'[<>"/\\|?*\x00-\x1f]', tag):
                raise ValueError("Tag contains invalid characters")
            validated_tags.append(tag)
        
        # Remove duplicates while preserving order
        return list(dict.fromkeys(validated_tags))
    
    @field_validator('parameters')
    @classmethod
    def validate_parameters(cls, v):
        if not v:
            return v
        
        # Validate common LLM parameters
        if 'temperature' in v:
            temp = v['temperature']
            if not isinstance(temp, (int, float)) or temp < 0 or temp > 2:
                raise ValueError("Temperature must be a number between 0 and 2")
        
        if 'max_tokens' in v:
            max_tokens = v['max_tokens']
            if not isinstance(max_tokens, int) or max_tokens < 1 or max_tokens > 100000:
                raise ValueError("Max tokens must be an integer between 1 and 100000")
        
        if 'top_p' in v:
            top_p = v['top_p']
            if not isinstance(top_p, (int, float)) or top_p < 0 or top_p > 1:
                raise ValueError("Top_p must be a number between 0 and 1")
        
        return v
    
    @model_validator(mode='after')
    def validate_messages_consistency(self):
        messages = self.messages
        if not messages:
            raise ValueError("At least one message is required")
        
        # Check for duplicate priorities
        priorities = [msg.priority for msg in messages]
        if len(priorities) != len(set(priorities)):
            raise ValueError("Message priorities must be unique")
        
        # Ensure system message comes first if present
        system_messages = [msg for msg in messages if msg.role == MessageRole.SYSTEM]
        if system_messages and messages[0].role != MessageRole.SYSTEM:
            raise ValueError("System message must be the first message if present")
        
        return self

class UpdatePromptRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    task_type: Optional[TaskType] = None
    tags: Optional[List[str]] = Field(None, max_items=20)
    developer_notes: Optional[str] = Field(None, max_length=5000)
    messages: Optional[List[PromptMessage]] = Field(None, min_items=1, max_items=50)
    input_variables: Optional[Dict[str, str]] = Field(None, max_items=50)
    model_provider: Optional[ModelProvider] = None
    model_name: Optional[str] = Field(None, min_length=1, max_length=100)
    parameters: Optional[Dict[str, Any]] = None
    status: Optional[PromptStatus] = None
    
    # Apply same validators as CreatePromptRequest
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        return CreatePromptRequest.validate_name(v)
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        return CreatePromptRequest.validate_tags(v)
    
    @field_validator('parameters')
    @classmethod
    def validate_parameters(cls, v):
        return CreatePromptRequest.validate_parameters(v)

class TestPromptRequest(BaseModel):
    input_variables: Dict[str, Any] = Field(default_factory=dict, description="Variables to test with")
    model_overrides: Optional[Dict[str, Any]] = Field(None, description="Override model parameters for this test")
    
    @field_validator('input_variables')
    @classmethod
    def validate_input_variables(cls, v):
        if not isinstance(v, dict):
            raise ValueError("Input variables must be a dictionary")
        
        # Check for reasonable limits
        if len(v) > 100:
            raise ValueError("Too many input variables (max 100)")
        
        for key, value in v.items():
            if not isinstance(key, str):
                raise ValueError("Variable names must be strings")
            if len(key) > 100:
                raise ValueError("Variable name too long (max 100 characters)")
            # Convert value to string if it's not already
            if not isinstance(value, str):
                v[key] = str(value)
            if len(str(value)) > 10000:
                raise ValueError("Variable value too long (max 10000 characters)")
        
        return v

# Response schemas
class PromptResponse(IDMixin, TimestampMixin):
    name: str
    description: Optional[str]
    task_type: TaskType
    tags: List[str]
    developer_notes: Optional[str]
    messages: List[PromptMessage]
    input_variables: Dict[str, str]
    model_provider: ModelProvider
    model_name: str
    parameters: Dict[str, Any]
    status: PromptStatus
    version: str
    owner_id: str
    execution_count: int = 0
    avg_execution_time: float = 0.0
    success_rate: float = 0.0
    total_cost: float = 0.0

class TestResultResponse(IDMixin, TimestampMixin):
    output: str
    execution_time: float
    cost: float
    success: bool
    error_message: Optional[str]
    tokens_used: int
    model_info: Optional[Dict[str, Any]] = None

# Error response schemas
class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    code: Optional[str] = None
    value: Optional[Any] = None

class ErrorResponse(BaseModel):
    detail: str
    errors: Optional[List[ErrorDetail]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None

# Pagination schemas
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, le=10000, description="Page number")
    limit: int = Field(10, ge=1, le=100, description="Items per page")
    
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total_pages: int = Field(ge=0)
    has_next: bool
    has_prev: bool
    
    @model_validator(mode='after')
    def validate_pagination(self):
        page = self.page
        per_page = self.per_page
        total = self.total
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        self.total_pages = total_pages
        self.has_next = page < total_pages
        self.has_prev = page > 1
        
        return self

# Settings schemas
class ThemeSettings(BaseModel):
    mode: str = Field(..., pattern="^(light|dark|auto)$")
    primary_color: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
    secondary_color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    font_family: Optional[str] = Field(None, max_length=100)
    font_size: str = Field(default="medium", pattern="^(small|medium|large)$")
    compact_mode: bool = False

class NotificationSettings(BaseModel):
    email_notifications: bool = True
    slack_notifications: bool = False
    webhook_url: Optional[str] = Field(None, max_length=500)
    notification_types: Dict[str, bool] = Field(default_factory=dict)
    
    @field_validator('webhook_url')
    @classmethod
    def validate_webhook_url(cls, v):
        if v and not re.match(r'^https?://', v):
            raise ValueError("Webhook URL must start with http:// or https://")
        return v

class SecuritySettings(BaseModel):
    require_api_key: bool = False
    api_key_expiry_days: int = Field(365, ge=1, le=3650)
    max_requests_per_minute: int = Field(100, ge=1, le=10000)
    allowed_domains: List[str] = Field(default_factory=list, max_items=100)
    cors_enabled: bool = True
    
    @field_validator('allowed_domains')
    @classmethod
    def validate_domains(cls, v):
        domain_pattern = r'^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
        for domain in v:
            if not re.match(domain_pattern, domain) and domain != "localhost":
                raise ValueError(f"Invalid domain format: {domain}")
        return v

class SettingsResponse(BaseModel):
    theme: ThemeSettings
    notifications: NotificationSettings
    security: SecuritySettings
    api_keys: List[Dict[str, Any]] = Field(default_factory=list)
    integrations: List[Dict[str, Any]] = Field(default_factory=list)

# Pipeline schemas
class PipelineStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=100)
    prompt_id: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    position: Dict[str, float] = Field(default_factory=dict)  # For visual editor
    
    @field_validator('name')
    @classmethod
    def validate_step_name(cls, v):
        if not v.strip():
            raise ValueError("Step name cannot be empty")
        return v.strip()

class CreatePipelineRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    steps: List[PipelineStep] = Field(..., min_items=1, max_items=100)
    
    @field_validator('name')
    @classmethod
    def validate_pipeline_name(cls, v):
        if not v.strip():
            raise ValueError("Pipeline name cannot be empty")
        return v.strip()
    
    @model_validator(mode='after')
    def validate_pipeline_steps(self):
        steps = self.steps
        if not steps:
            raise ValueError("Pipeline must have at least one step")
        
        # Check for duplicate step IDs
        step_ids = [step.id for step in steps]
        if len(step_ids) != len(set(step_ids)):
            raise ValueError("Step IDs must be unique")
        
        return self

class PipelineResponse(IDMixin, TimestampMixin):
    name: str
    description: Optional[str]
    steps: List[PipelineStep]
    status: PipelineStatus
    owner_id: str
    execution_count: int = 0
    avg_execution_time: float = 0.0
    success_rate: float = 0.0

# Analytics schemas
class UsageMetrics(BaseModel):
    total_prompts: int = Field(ge=0)
    total_executions: int = Field(ge=0)
    total_users: int = Field(ge=0)
    execution_trend: List[Dict[str, Any]] = Field(default_factory=list)

class PerformanceMetrics(BaseModel):
    avg_response_time: float = Field(ge=0)
    success_rate: float = Field(ge=0, le=100)
    error_rate: float = Field(ge=0, le=100)
    throughput: float = Field(ge=0)

class CostAnalysis(BaseModel):
    total_cost: float = Field(ge=0)
    cost_by_provider: Dict[str, float] = Field(default_factory=dict)
    cost_trend: List[Dict[str, Any]] = Field(default_factory=list)

# Health check schema
class HealthResponse(BaseModel):
    status: str = Field(..., pattern="^(healthy|degraded|unhealthy)$")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str
    uptime_seconds: float = Field(ge=0)
    components: Dict[str, str] = Field(default_factory=dict)
    security: Optional[Dict[str, Any]] = None