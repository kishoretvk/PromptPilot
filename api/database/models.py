# SQLAlchemy Database Models
# Defines the database schema for PromptPilot application

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, JSON, 
    ForeignKey, Float, Enum, UniqueConstraint, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum

Base = declarative_base()

# Enums for status fields
class PromptStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DEPRECATED = "DEPRECATED"

class PipelineStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    VIEWER = "VIEWER"

# User Management
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    prompts = relationship("Prompt", back_populates="creator", cascade="all, delete-orphan")
    pipelines = relationship("Pipeline", back_populates="creator", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

# Session Management
class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    refresh_token = Column(String(255), unique=True, nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    last_used = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="sessions")

# API Key Management
class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), unique=True, nullable=False, index=True)
    key_prefix = Column(String(10), nullable=False)  # First few chars for display
    permissions = Column(JSONB, nullable=False, default=[])
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    usage_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="api_keys")

# LLM Provider Configuration
class LLMProvider(Base):
    __tablename__ = "llm_providers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    provider_type = Column(String(50), nullable=False)  # openai, anthropic, ollama, etc.
    base_url = Column(String(500), nullable=True)
    api_key_encrypted = Column(Text, nullable=True)  # Encrypted API key
    models = Column(JSONB, nullable=False, default=[])
    configuration = Column(JSONB, nullable=False, default={})
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    prompts = relationship("Prompt", back_populates="provider")
    
    __table_args__ = (
        Index('idx_llm_provider_type', 'provider_type'),
        Index('idx_llm_provider_active', 'is_active'),
    )

# Prompt Management
class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(100), nullable=False, index=True)
    tags = Column(JSONB, nullable=False, default=[])
    developer_notes = Column(Text, nullable=True)
    
    # Version information
    version = Column(String(50), nullable=False, default="1.0.0")
    status = Column(Enum(PromptStatus), default=PromptStatus.DRAFT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Content
    messages = Column(JSONB, nullable=False, default=[])
    input_variables = Column(JSONB, nullable=False, default={})
    
    # Model configuration
    provider_id = Column(UUID(as_uuid=True), ForeignKey("llm_providers.id"), nullable=True)
    model_name = Column(String(100), nullable=True)
    parameters = Column(JSONB, nullable=False, default={})
    
    # Testing and evaluation
    test_cases = Column(JSONB, nullable=False, default=[])
    evaluation_metrics = Column(JSONB, nullable=False, default={})
    
    # Metadata
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    creator = relationship("User", back_populates="prompts")
    provider = relationship("LLMProvider", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan")
    pipeline_steps = relationship("PipelineStep", back_populates="prompt")
    executions = relationship("PromptExecution", back_populates="prompt", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_prompt_task_type', 'task_type'),
        Index('idx_prompt_status', 'status'),
        Index('idx_prompt_creator', 'creator_id'),
        Index('idx_prompt_provider', 'provider_id'),
        Index('idx_prompt_created', 'created_at'),
    )

# Prompt Version History
class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False)
    version = Column(String(50), nullable=False)
    commit_message = Column(Text, nullable=True)
    changes_summary = Column(Text, nullable=True)
    
    # Snapshot of prompt at this version
    content_snapshot = Column(JSONB, nullable=False)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    created_by_user = relationship("User", foreign_keys=[created_by])
    
    __table_args__ = (
        UniqueConstraint('prompt_id', 'version', name='uq_prompt_version'),
        Index('idx_prompt_version_prompt', 'prompt_id'),
        Index('idx_prompt_version_created', 'created_at'),
    )

# Pipeline Management
class Pipeline(Base):
    __tablename__ = "pipelines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(PipelineStatus), default=PipelineStatus.DRAFT, nullable=False)
    
    # Configuration
    error_strategy = Column(String(50), default="fail_fast", nullable=False)  # fail_fast, continue, retry
    max_retries = Column(Integer, default=3, nullable=False)
    timeout_minutes = Column(Integer, default=30, nullable=False)
    
    # Metadata
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    creator = relationship("User", back_populates="pipelines")
    steps = relationship("PipelineStep", back_populates="pipeline", cascade="all, delete-orphan", order_by="PipelineStep.order")
    connections = relationship("PipelineConnection", back_populates="pipeline", cascade="all, delete-orphan")
    executions = relationship("PipelineExecution", back_populates="pipeline", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_pipeline_status', 'status'),
        Index('idx_pipeline_creator', 'creator_id'),
        Index('idx_pipeline_created', 'created_at'),
    )

# Pipeline Steps
class PipelineStep(Base):
    __tablename__ = "pipeline_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("pipelines.id"), nullable=False)
    name = Column(String(255), nullable=False)
    step_type = Column(String(50), nullable=False)  # prompt, aggregator, condition, etc.
    order = Column(Integer, nullable=False)
    
    # Step configuration
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=True)
    configuration = Column(JSONB, nullable=False, default={})
    position = Column(JSONB, nullable=False, default={})  # UI position
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="steps")
    prompt = relationship("Prompt", back_populates="pipeline_steps")
    source_connections = relationship("PipelineConnection", foreign_keys="PipelineConnection.source_step_id", back_populates="source_step")
    target_connections = relationship("PipelineConnection", foreign_keys="PipelineConnection.target_step_id", back_populates="target_step")
    
    __table_args__ = (
        UniqueConstraint('pipeline_id', 'order', name='uq_pipeline_step_order'),
        Index('idx_pipeline_step_pipeline', 'pipeline_id'),
        Index('idx_pipeline_step_prompt', 'prompt_id'),
    )

# Pipeline Connections
class PipelineConnection(Base):
    __tablename__ = "pipeline_connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("pipelines.id"), nullable=False)
    source_step_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_steps.id"), nullable=False)
    target_step_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_steps.id"), nullable=False)
    connection_type = Column(String(50), default="data_flow", nullable=False)
    
    # Connection configuration
    configuration = Column(JSONB, nullable=False, default={})
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="connections")
    source_step = relationship("PipelineStep", foreign_keys=[source_step_id], back_populates="source_connections")
    target_step = relationship("PipelineStep", foreign_keys=[target_step_id], back_populates="target_connections")
    
    __table_args__ = (
        UniqueConstraint('source_step_id', 'target_step_id', name='uq_pipeline_connection'),
        Index('idx_pipeline_connection_pipeline', 'pipeline_id'),
    )

# Execution Tracking
class PipelineExecution(Base):
    __tablename__ = "pipeline_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("pipelines.id"), nullable=False)
    executor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Execution details
    status = Column(Enum(PipelineStatus), default=PipelineStatus.RUNNING, nullable=False)
    input_data = Column(JSONB, nullable=True)
    output_data = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    # Metrics
    total_steps = Column(Integer, nullable=False, default=0)
    completed_steps = Column(Integer, nullable=False, default=0)
    failed_steps = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    total_cost = Column(Float, nullable=False, default=0.0)
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="executions")
    executor = relationship("User", foreign_keys=[executor_id])
    step_executions = relationship("StepExecution", back_populates="pipeline_execution", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_pipeline_execution_pipeline', 'pipeline_id'),
        Index('idx_pipeline_execution_executor', 'executor_id'),
        Index('idx_pipeline_execution_status', 'status'),
        Index('idx_pipeline_execution_started', 'started_at'),
    )

# Step Execution Details
class StepExecution(Base):
    __tablename__ = "step_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_execution_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_executions.id"), nullable=False)
    step_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_steps.id"), nullable=False)
    
    # Execution details
    status = Column(String(50), nullable=False, default="pending")  # pending, running, completed, failed
    input_data = Column(JSONB, nullable=True)
    output_data = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    # Metrics
    tokens_used = Column(Integer, nullable=False, default=0)
    cost = Column(Float, nullable=False, default=0.0)
    retry_count = Column(Integer, nullable=False, default=0)
    
    # Relationships
    pipeline_execution = relationship("PipelineExecution", back_populates="step_executions")
    step = relationship("PipelineStep", foreign_keys=[step_id])
    
    __table_args__ = (
        Index('idx_step_execution_pipeline', 'pipeline_execution_id'),
        Index('idx_step_execution_step', 'step_id'),
        Index('idx_step_execution_status', 'status'),
    )

# Prompt Execution History
class PromptExecution(Base):
    __tablename__ = "prompt_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False)
    executor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Execution details
    input_variables = Column(JSONB, nullable=False, default={})
    response = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="completed")  # completed, failed, timeout
    error_message = Column(Text, nullable=True)
    
    # Model information
    model_name = Column(String(100), nullable=True)
    model_parameters = Column(JSONB, nullable=False, default={})
    
    # Metrics
    tokens_used = Column(Integer, nullable=False, default=0)
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    cost = Column(Float, nullable=False, default=0.0)
    duration_seconds = Column(Float, nullable=True)
    
    # Timing
    executed_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    prompt = relationship("Prompt", back_populates="executions")
    executor = relationship("User", foreign_keys=[executor_id])
    
    __table_args__ = (
        Index('idx_prompt_execution_prompt', 'prompt_id'),
        Index('idx_prompt_execution_executor', 'executor_id'),
        Index('idx_prompt_execution_executed', 'executed_at'),
        Index('idx_prompt_execution_status', 'status'),
    )

# System Settings
class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(100), nullable=False, index=True)
    key = Column(String(255), nullable=False)
    value = Column(JSONB, nullable=True)
    description = Column(Text, nullable=True)
    is_sensitive = Column(Boolean, default=False, nullable=False)  # For passwords, API keys
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    updated_by_user = relationship("User", foreign_keys=[updated_by])
    
    __table_args__ = (
        UniqueConstraint('category', 'key', name='uq_setting_category_key'),
        Index('idx_setting_category', 'category'),
    )

# Audit Log
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # CREATE, UPDATE, DELETE, EXECUTE
    resource_type = Column(String(100), nullable=False, index=True)  # prompt, pipeline, user, etc.
    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Request details
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_id = Column(String(100), nullable=True, index=True)
    
    # Change details
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    metadata = Column(JSONB, nullable=True)
    
    # Timing
    timestamp = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_timestamp', 'timestamp'),
    )

# Usage Analytics
class UsageMetric(Base):
    __tablename__ = "usage_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    metric_type = Column(String(100), nullable=False, index=True)  # prompt_execution, pipeline_run, api_call
    metric_name = Column(String(255), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)  # tokens, seconds, requests, etc.
    
    # Dimensions
    dimensions = Column(JSONB, nullable=False, default={})  # provider, model, etc.
    
    # Timing (for aggregation)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    hour = Column(Integer, nullable=False, index=True)  # 0-23
    
    # Metadata
    recorded_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    
    __table_args__ = (
        Index('idx_usage_metric_type_date', 'metric_type', 'date'),
        Index('idx_usage_metric_user_date', 'user_id', 'date'),
        Index('idx_usage_metric_date_hour', 'date', 'hour'),
    )