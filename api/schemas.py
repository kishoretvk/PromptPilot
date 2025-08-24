from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union, Generic, TypeVar
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator

# Enums
class PromptStatusEnum(str, Enum):
    DRAFT = "draft"
    STAGING = "staging"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"

class PipelineStatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"

class ExecutionStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        use_enum_values = True

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

# Authentication schemas
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class TokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserResponse(BaseSchema):
    id: str
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

# Message schemas
class MessageSchema(BaseSchema):
    role: str = Field(..., pattern="^(system|developer|user|assistant)$")
    content: str = Field(..., min_length=1)
    priority: int = Field(default=1, ge=1, le=10)

class TestCaseSchema(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    inputs: Dict[str, Any]
    expected_outputs: Optional[str]
    test_type: str = Field(default="functional")
    evaluation_metrics: Dict[str, Any] = Field(default_factory=dict)

# Prompt schemas
class CreatePromptRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    task_type: str = Field(..., min_length=1, max_length=100)
    tags: List[str] = Field(default_factory=list)
    developer_notes: Optional[str]
    messages: List[MessageSchema] = Field(..., min_items=1)
    input_variables: Dict[str, Any] = Field(default_factory=dict)
    model_provider: str = Field(..., min_length=1)
    model_name: str = Field(..., min_length=1)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    test_cases: List[TestCaseSchema] = Field(default_factory=list)

    @validator('tags')
    def validate_tags(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 tags allowed')
        return v

class UpdatePromptRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    task_type: Optional[str] = Field(None, min_length=1, max_length=100)
    tags: Optional[List[str]]
    developer_notes: Optional[str]
    messages: Optional[List[MessageSchema]]
    input_variables: Optional[Dict[str, Any]]
    model_provider: Optional[str]
    model_name: Optional[str]
    parameters: Optional[Dict[str, Any]]
    status: Optional[PromptStatusEnum]

class PromptResponse(BaseSchema):
    id: str
    name: str
    description: Optional[str]
    task_type: str
    tags: List[str]
    developer_notes: Optional[str]
    messages: List[MessageSchema]
    input_variables: Dict[str, Any]
    model_provider: str
    model_name: str
    parameters: Dict[str, Any]
    status: PromptStatusEnum
    version: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    execution_count: int
    avg_execution_time: float
    success_rate: float
    total_cost: float

class TestPromptRequest(BaseModel):
    input_variables: Dict[str, Any]
    test_case_id: Optional[str]
    model_parameters: Optional[Dict[str, Any]]

class TestResultResponse(BaseSchema):
    id: str
    output: str
    execution_time: float
    cost: float
    success: bool
    error_message: Optional[str]
    tokens_used: Optional[int]
    created_at: datetime

# Pipeline schemas
class PipelineStepSchema(BaseSchema):
    id: Optional[str]
    name: str = Field(..., min_length=1, max_length=255)
    step_type: str = Field(..., pattern="^(prompt|transform|condition|loop|parallel)$")
    order: int = Field(..., ge=0)
    prompt_id: Optional[str]
    configuration: Dict[str, Any] = Field(default_factory=dict)
    input_mapping: Dict[str, str] = Field(default_factory=dict)
    output_mapping: Dict[str, str] = Field(default_factory=dict)
    condition: Optional[str]
    position_x: float = Field(default=0)
    position_y: float = Field(default=0)

class CreatePipelineRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    error_strategy: str = Field(default="fail_fast", pattern="^(fail_fast|continue|retry)$")
    steps: List[PipelineStepSchema] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    configuration: Dict[str, Any] = Field(default_factory=dict)

class UpdatePipelineRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str]
    error_strategy: Optional[str] = Field(None, pattern="^(fail_fast|continue|retry)$")
    steps: Optional[List[PipelineStepSchema]]
    tags: Optional[List[str]]
    status: Optional[PipelineStatusEnum]
    configuration: Optional[Dict[str, Any]]

class PipelineResponse(BaseSchema):
    id: str
    name: str
    description: Optional[str]
    version: str
    status: PipelineStatusEnum
    error_strategy: str
    steps: List[PipelineStepSchema]
    tags: List[str]
    configuration: Dict[str, Any]
    owner_id: str
    created_at: datetime
    updated_at: datetime
    execution_count: int
    avg_execution_time: float
    success_rate: float
    total_cost: float

class ExecutePipelineRequest(BaseModel):
    input_data: Dict[str, Any]
    override_config: Optional[Dict[str, Any]]

# Prompt Version schemas
class PromptVersionSchema(BaseSchema):
    id: str
    prompt_id: str
    version: str
    changelog: Optional[str]
    content_snapshot: Dict[str, Any]
    created_at: datetime
    created_by: Optional[str]
    is_active: bool

class CreatePromptVersionRequest(BaseModel):
    version: str
    changelog: Optional[str]
    content_snapshot: Dict[str, Any]
    created_by: Optional[str]

class UpdatePromptVersionRequest(BaseModel):
    changelog: Optional[str]
    is_active: Optional[bool]

class PipelineExecutionResponse(BaseSchema):
    id: str
    pipeline_id: str
    status: ExecutionStatusEnum
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    execution_time: Optional[float]
    total_cost: float

# Analytics schemas
class AnalyticsFilters(BaseModel):
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    prompt_ids: Optional[List[str]]
    pipeline_ids: Optional[List[str]]
    user_ids: Optional[List[str]]
    providers: Optional[List[str]]
    tags: Optional[List[str]]

class UsageMetricsResponse(BaseSchema):
    total_prompts: int
    total_pipelines: int
    total_executions: int
    active_users: int
    period: str
    growth_rate: float
    usage_by_day: List[Dict[str, Any]]
    top_prompts: List[Dict[str, Any]]
    top_providers: List[Dict[str, Any]]

class PerformanceMetricsResponse(BaseSchema):
    avg_execution_time: float
    success_rate: float
    error_rate: float
    total_cost: float
    cost_per_execution: float
    prompt_performance: List[Dict[str, Any]]
    provider_performance: List[Dict[str, Any]]

class CostAnalysisResponse(BaseSchema):
    total_cost: float
    cost_by_provider: List[Dict[str, Any]]
    cost_by_prompt: List[Dict[str, Any]]
    cost_trend: List[Dict[str, Any]]
    projected_monthly_cost: float

# Settings schemas
class CreateAPIKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    expires_days: Optional[int] = Field(None, ge=1, le=365)
    rate_limit: int = Field(default=1000, ge=1, le=10000)

class APIKeyResponse(BaseSchema):
    id: str
    name: str
    key: str  # Only returned on creation
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime
    last_used: Optional[datetime]
    usage_count: int
    rate_limit: int

class LLMProviderSchema(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=255)
    base_url: Optional[str]
    is_active: bool = Field(default=True)
    supported_models: List[str] = Field(default_factory=list)
    default_parameters: Dict[str, Any] = Field(default_factory=dict)
    configuration: Dict[str, Any] = Field(default_factory=dict)

class SettingSchema(BaseSchema):
    key: str
    value: Any
    description: Optional[str]
    category: str
    is_public: bool

class UpdateSettingRequest(BaseModel):
    value: Any
    description: Optional[str]

# System schemas
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0"
    database: str = "unknown"
    uptime: float = 0.0
    dependencies: Dict[str, str] = {}

class SystemStatsResponse(BaseModel):
    total_users: int
    total_prompts: int
    total_pipelines: int
    total_executions: int
    active_sessions: int
    memory_usage: float
    cpu_usage: float
    disk_usage: float

# Error schemas
class ErrorResponse(BaseModel):
    error: str
    message: str
    timestamp: datetime
    details: Optional[Dict[str, Any]]

class ValidationErrorResponse(BaseModel):
    error: str = "Validation Error"
    message: str
    errors: List[Dict[str, Any]]
    timestamp: datetime