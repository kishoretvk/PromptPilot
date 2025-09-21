# SQLAlchemy Database Models
# Defines the database schema for PromptPilot application

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, JSON,
    ForeignKey, Float, Enum, UniqueConstraint, Index
)
from sqlalchemy.orm import declarative_base, relationship, Session
from sqlalchemy.dialects.postgresql import UUID
# Use JSON for SQLite compatibility instead of JSONB
from sqlalchemy import JSON
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
    permissions = Column(JSON, nullable=False, default=[])
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
    models = Column(JSON, nullable=False, default=[])
    configuration = Column(JSON, nullable=False, default={})
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
    tags = Column(JSON, nullable=False, default=[])
    developer_notes = Column(Text, nullable=True)

    # Version information
    version = Column(String(50), nullable=False, default="1.0.0")
    status = Column(Enum(PromptStatus), default=PromptStatus.DRAFT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Content
    messages = Column(JSON, nullable=False, default=[])
    input_variables = Column(JSON, nullable=False, default={})

    # Model configuration
    provider_id = Column(UUID(as_uuid=True), ForeignKey("llm_providers.id"), nullable=True)
    model_name = Column(String(100), nullable=True)
    parameters = Column(JSON, nullable=False, default={})

    # Testing and evaluation
    test_cases = Column(JSON, nullable=False, default=[])
    evaluation_metrics = Column(JSON, nullable=False, default={})
    
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
    quality_scores = relationship("QualityScore", back_populates="prompt", cascade="all, delete-orphan")
    ai_suggestions = relationship("AISuggestion", back_populates="prompt", cascade="all, delete-orphan")
    refinement_results = relationship("RefinementResult", back_populates="prompt", cascade="all, delete-orphan")
    
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
    content_snapshot = Column(JSON, nullable=False)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Version relationships
    parent_version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"), nullable=True)
    is_active = Column(Boolean, default=False)
    tags = Column(JSON, nullable=False, default=[])
    
    # Merge tracking
    merged_from_version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"), nullable=True)
    is_merge = Column(Boolean, default=False)
    
    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    created_by_user = relationship("User", foreign_keys=[created_by])
    parent_version = relationship("PromptVersion", remote_side=[id], back_populates="child_versions", foreign_keys=[parent_version_id])
    child_versions = relationship("PromptVersion", back_populates="parent_version", foreign_keys=[parent_version_id])
    merged_from_version = relationship("PromptVersion", remote_side=[id], back_populates="merged_to_versions", foreign_keys=[merged_from_version_id])
    merged_to_versions = relationship("PromptVersion", back_populates="merged_from_version", foreign_keys=[merged_from_version_id])
    
    __table_args__ = (
        UniqueConstraint('prompt_id', 'version', name='uq_prompt_version'),
        Index('idx_prompt_version_prompt', 'prompt_id'),
        Index('idx_prompt_version_created', 'created_at'),
        Index('idx_prompt_version_active', 'is_active'),
        Index('idx_prompt_version_parent', 'parent_version_id'),
        Index('idx_prompt_version_merge', 'merged_from_version_id'),
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
    configuration = Column(JSON, nullable=False, default={})
    position = Column(JSON, nullable=False, default={})  # UI position
    
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
    configuration = Column(JSON, nullable=False, default={})
    
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
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
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
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
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
    input_variables = Column(JSON, nullable=False, default={})
    response = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="completed")  # completed, failed, timeout
    error_message = Column(Text, nullable=True)
    
    # Model information
    model_name = Column(String(100), nullable=True)
    model_parameters = Column(JSON, nullable=False, default={})
    
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
    value = Column(JSON, nullable=True)
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
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    audit_metadata = Column(JSON, nullable=True)  # Renamed from 'metadata'
    
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
    dimensions = Column(JSON, nullable=False, default={})  # provider, model, etc.
    
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

# AI Refinement Models
class QualityScore(Base):
    __tablename__ = "quality_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    clarity = Column(Float, nullable=False)
    specificity = Column(Float, nullable=False)
    context_usage = Column(Float, nullable=False)
    task_alignment = Column(Float, nullable=False)
    safety_score = Column(Float, nullable=False)
    issues = Column(JSON, default=list)
    suggestions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    prompt = relationship("Prompt", back_populates="quality_scores")

    __table_args__ = (
        Index('ix_quality_scores_prompt_created', 'prompt_id', 'created_at'),
    )

class AISuggestion(Base):
    __tablename__ = "ai_suggestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False)
    suggestion_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    impact_score = Column(Float, nullable=False)
    applied = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    prompt = relationship("Prompt", back_populates="ai_suggestions")

    __table_args__ = (
        Index('ix_ai_suggestions_prompt_type', 'prompt_id', 'suggestion_type'),
    )

class RefinementResult(Base):
    __tablename__ = "refinement_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False)
    original_prompt_data = Column(JSON, nullable=False)
    refined_prompt_data = Column(JSON, nullable=False)
    iterations = Column(Integer, nullable=False)
    quality_improvement = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)
    processing_time = Column(Float, nullable=False)
    ab_test_triggered = Column(Boolean, default=False)
    examples_generated = Column(Boolean, default=False)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    prompt = relationship("Prompt", back_populates="refinement_results")
    ab_tests = relationship("ABTest", back_populates="refinement_result")
    examples = relationship("RefinementExample", back_populates="refinement_result")

    __table_args__ = (
        Index('ix_refinement_results_prompt_created', 'prompt_id', 'created_at'),
    )

class RefinementExample(Base):
    __tablename__ = "refinement_examples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    refinement_result_id = Column(UUID(as_uuid=True), ForeignKey("refinement_results.id"), nullable=False)
    example_type = Column(String(100), nullable=False)
    original_text = Column(Text, nullable=False)
    refined_text = Column(Text, nullable=False)
    improvement_description = Column(Text, nullable=False)
    performance_impact = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    refinement_result = relationship("RefinementResult", back_populates="examples")

    __table_args__ = (
        Index('ix_refinement_examples_refinement_type', 'refinement_result_id', 'example_type'),
    )

# A/B Testing Models
class ABTest(Base):
    __tablename__ = "ab_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    refinement_result_id = Column(UUID(as_uuid=True), ForeignKey("refinement_results.id"))
    prompt_a_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"))
    prompt_b_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"))
    test_name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="pending")
    winner = Column(String(10))  # "A", "B", or "tie"
    confidence_level = Column(Float)
    effect_size = Column(Float)
    execution_time = Column(Float)
    statistical_analysis = Column(JSON)
    recommendations = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    refinement_result = relationship("RefinementResult", back_populates="ab_tests")
    prompt_a = relationship("Prompt", foreign_keys=[prompt_a_id])
    prompt_b = relationship("Prompt", foreign_keys=[prompt_b_id])
    test_cases = relationship("ABTestCase", back_populates="ab_test")
    results = relationship("ABTestResult", back_populates="ab_test")

    __table_args__ = (
        Index('ix_ab_tests_created_status', 'created_at', 'status'),
    )

class ABTestCase(Base):
    __tablename__ = "ab_test_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id"), nullable=False)
    input_text = Column(Text, nullable=False)
    expected_criteria = Column(JSON)
    category = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    ab_test = relationship("ABTest", back_populates="test_cases")

    __table_args__ = (
        Index('ix_ab_test_cases_ab_test_category', 'ab_test_id', 'category'),
    )

class ABTestResult(Base):
    __tablename__ = "ab_test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id"), nullable=False)
    test_case_id = Column(UUID(as_uuid=True), ForeignKey("ab_test_cases.id"), nullable=False)
    prompt_version = Column(String(10), nullable=False)  # "A" or "B"
    output = Column(Text, nullable=False)
    processing_time = Column(Float, nullable=False)
    quality_score = Column(Float)
    custom_metrics = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    ab_test = relationship("ABTest", back_populates="results")
    test_case = relationship("ABTestCase")

    __table_args__ = (
        Index('ix_ab_test_results_ab_test_version', 'ab_test_id', 'prompt_version'),
    )

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id"), nullable=False)
    is_significant_improvement = Column(Boolean, nullable=False)
    improvement_percentage = Column(Float, nullable=False)
    confidence_interval_lower = Column(Float, nullable=False)
    confidence_interval_upper = Column(Float, nullable=False)
    p_value = Column(Float, nullable=False)
    effect_size = Column(Float, nullable=False)
    sample_size = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationships
    ab_test = relationship("ABTest")

    __table_args__ = (
        Index('ix_validation_results_ab_test_created', 'ab_test_id', 'created_at'),
    )
