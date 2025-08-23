from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, JSON, 
    ForeignKey, Float, Enum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from .database import Base

# Enums
class PromptStatus(str, enum.Enum):
    DRAFT = "draft"
    STAGING = "staging"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"

class PipelineStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"

class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SUPERUSER = "superuser"

# User and Authentication Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    prompts = relationship("Prompt", back_populates="owner")
    pipelines = relationship("Pipeline", back_populates="owner")
    executions = relationship("Execution", back_populates="user")
    api_keys = relationship("APIKey", back_populates="user")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False, unique=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime)
    usage_count = Column(Integer, default=0)
    rate_limit = Column(Integer, default=1000)  # requests per hour
    
    # Relationships
    user = relationship("User", back_populates="api_keys")

# Core Prompt Models
class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    task_type = Column(String(100), nullable=False)
    tags = Column(JSON, default=list)
    developer_notes = Column(Text)
    
    # Content
    messages = Column(JSON, nullable=False)  # List of message objects
    input_variables = Column(JSON, default=dict)
    
    # LLM Configuration
    model_provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    parameters = Column(JSON, default=dict)
    
    # Metadata
    status = Column(Enum(PromptStatus), default=PromptStatus.DRAFT)
    version = Column(String(50), default="1.0.0")
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Analytics
    execution_count = Column(Integer, default=0)
    avg_execution_time = Column(Float, default=0.0)
    success_rate = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    
    # Relationships
    owner = relationship("User", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt")
    test_cases = relationship("TestCase", back_populates="prompt")
    executions = relationship("Execution", back_populates="prompt")
    pipeline_steps = relationship("PipelineStep", back_populates="prompt")
    
    # Indexes
    __table_args__ = (
        Index('ix_prompts_owner_status', 'owner_id', 'status'),
        Index('ix_prompts_task_type', 'task_type'),
        Index('ix_prompts_created_at', 'created_at'),
    )

class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_id = Column(String, ForeignKey("prompts.id"), nullable=False)
    version = Column(String(50), nullable=False)
    changelog = Column(Text)
    content_snapshot = Column(JSON, nullable=False)  # Full prompt content
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey("users.id"))
    is_active = Column(Boolean, default=False)
    
    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('prompt_id', 'version'),
        Index('ix_prompt_versions_prompt_id', 'prompt_id'),
    )

class TestCase(Base):
    __tablename__ = "test_cases"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_id = Column(String, ForeignKey("prompts.id"), nullable=False)
    name = Column(String(255), nullable=False)
    input_data = Column(JSON, nullable=False)
    expected_output = Column(Text)
    test_type = Column(String(50), default="functional")
    evaluation_metrics = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    prompt = relationship("Prompt", back_populates="test_cases")
    results = relationship("TestResult", back_populates="test_case")

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=False)
    execution_id = Column(String, ForeignKey("executions.id"))
    actual_output = Column(Text)
    passed = Column(Boolean, nullable=False)
    execution_time = Column(Float)
    cost = Column(Float)
    error_message = Column(Text)
    metrics = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    test_case = relationship("TestCase", back_populates="results")
    execution = relationship("Execution", back_populates="test_results")

# Pipeline Models
class Pipeline(Base):
    __tablename__ = "pipelines"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    version = Column(String(50), default="1.0.0")
    status = Column(Enum(PipelineStatus), default=PipelineStatus.DRAFT)
    error_strategy = Column(String(50), default="fail_fast")
    
    # Configuration
    configuration = Column(JSON, default=dict)
    tags = Column(JSON, default=list)
    
    # Metadata
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Analytics
    execution_count = Column(Integer, default=0)
    avg_execution_time = Column(Float, default=0.0)
    success_rate = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    
    # Relationships
    owner = relationship("User", back_populates="pipelines")
    steps = relationship("PipelineStep", back_populates="pipeline", order_by="PipelineStep.order")
    executions = relationship("PipelineExecution", back_populates="pipeline")
    
    # Indexes
    __table_args__ = (
        Index('ix_pipelines_owner_status', 'owner_id', 'status'),
        Index('ix_pipelines_created_at', 'created_at'),
    )

class PipelineStep(Base):
    __tablename__ = "pipeline_steps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pipeline_id = Column(String, ForeignKey("pipelines.id"), nullable=False)
    name = Column(String(255), nullable=False)
    step_type = Column(String(50), nullable=False)  # prompt, transform, condition, etc.
    order = Column(Integer, nullable=False)
    
    # Configuration
    prompt_id = Column(String, ForeignKey("prompts.id"))
    configuration = Column(JSON, default=dict)
    input_mapping = Column(JSON, default=dict)
    output_mapping = Column(JSON, default=dict)
    condition = Column(Text)  # For conditional steps
    
    # UI Configuration
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="steps")
    prompt = relationship("Prompt", back_populates="pipeline_steps")
    
    # Indexes
    __table_args__ = (
        Index('ix_pipeline_steps_pipeline_order', 'pipeline_id', 'order'),
    )

class PipelineExecution(Base):
    __tablename__ = "pipeline_executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pipeline_id = Column(String, ForeignKey("pipelines.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.PENDING)
    
    # Execution data
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON)
    error_message = Column(Text)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    execution_time = Column(Float)
    
    # Cost tracking
    total_cost = Column(Float, default=0.0)
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="executions")
    user = relationship("User")
    step_executions = relationship("StepExecution", back_populates="pipeline_execution")

class StepExecution(Base):
    __tablename__ = "step_executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pipeline_execution_id = Column(String, ForeignKey("pipeline_executions.id"), nullable=False)
    step_id = Column(String, ForeignKey("pipeline_steps.id"), nullable=False)
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.PENDING)
    
    # Execution data
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    
    # Timing
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    execution_time = Column(Float)
    
    # Cost tracking
    cost = Column(Float, default=0.0)
    
    # Relationships
    pipeline_execution = relationship("PipelineExecution", back_populates="step_executions")

# Execution and Analytics Models
class Execution(Base):
    __tablename__ = "executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_id = Column(String, ForeignKey("prompts.id"))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Execution data
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON)
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.PENDING)
    error_message = Column(Text)
    
    # LLM details
    model_provider = Column(String(100))
    model_name = Column(String(100))
    model_parameters = Column(JSON)
    
    # Timing and cost
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    execution_time = Column(Float)
    cost = Column(Float, default=0.0)
    
    # Token usage
    input_tokens = Column(Integer)
    output_tokens = Column(Integer)
    total_tokens = Column(Integer)
    
    # Relationships
    prompt = relationship("Prompt", back_populates="executions")
    user = relationship("User", back_populates="executions")
    test_results = relationship("TestResult", back_populates="execution")
    
    # Indexes
    __table_args__ = (
        Index('ix_executions_prompt_user', 'prompt_id', 'user_id'),
        Index('ix_executions_created_at', 'started_at'),
        Index('ix_executions_status', 'status'),
    )

# Settings and Configuration Models
class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String(255), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(Text)
    category = Column(String(100), default="general")
    is_public = Column(Boolean, default=False)  # Can be read by non-admin users
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('ix_settings_category', 'category'),
    )

class LLMProvider(Base):
    __tablename__ = "llm_providers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    base_url = Column(String(500))
    api_key = Column(Text)  # Encrypted
    is_active = Column(Boolean, default=True)
    configuration = Column(JSON, default=dict)
    supported_models = Column(JSON, default=list)
    default_parameters = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Audit and Logging Models
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String)
    details = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('ix_audit_logs_user_action', 'user_id', 'action'),
        Index('ix_audit_logs_created_at', 'created_at'),
        Index('ix_audit_logs_resource', 'resource_type', 'resource_id'),
    )

# System monitoring
class SystemMetric(Base):
    __tablename__ = "system_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_name = Column(String(255), nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_type = Column(String(50), nullable=False)  # counter, gauge, histogram
    labels = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('ix_system_metrics_name_timestamp', 'metric_name', 'timestamp'),
    )
