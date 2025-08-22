from typing import List, Optional, Dict, Any, Union, Generic, TypeVar
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator

# TypeVar for Generic pagination
T = TypeVar('T')

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

class TokenResponse(BaseModel):
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
    developer_notes: Optional[str] = ""
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
    tags: Optional[List[str]] = None
    developer_notes: Optional[str] = None
    messages: Optional[List[MessageSchema]] = None
    input_variables: Optional[Dict[str, Any]] = None
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    status: Optional[PromptStatusEnum] = None

class PromptResponse(BaseSchema):
    id: str
    name: str
    description: Optional[str] = ""
    task_type: str
    tags: List[str] = []
    developer_notes: Optional[str] = ""
    messages: List[MessageSchema] = []
    input_variables: Dict[str, Any] = {}
    model_provider: str
    model_name: str
    parameters: Dict[str, Any] = {}
    status: PromptStatusEnum = PromptStatusEnum.DRAFT
    version: str = "1.0.0"
    owner_id: str
    created_at: datetime
    updated_at: datetime
    execution_count: int = 0
    avg_execution_time: float = 0.0
    success_rate: float = 0.0
    total_cost: float = 0.0

class TestPromptRequest(BaseModel):
    input_variables: Dict[str, Any]
    test_case_id: Optional[str] = None
    model_parameters: Optional[Dict[str, Any]] = None

class TestResultResponse(BaseSchema):
    id: str
    output: str
    execution_time: float
    cost: float
    success: bool
    error_message: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime

# Simple response for basic endpoints
class MessageResponse(BaseModel):
    message: str
    status: str = "success"

# Settings schemas
class SettingsResponse(BaseModel):
    theme: Dict[str, Any] = {}
    notifications: Dict[str, Any] = {}
    security: Dict[str, Any] = {}
    api_keys: List[Dict[str, Any]] = []
    integrations: List[Dict[str, Any]] = []