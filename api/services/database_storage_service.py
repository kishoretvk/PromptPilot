# Database Storage Service Implementation
# Replaces file-based storage with PostgreSQL database operations

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_, desc, asc, func, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import structlog
import json
import uuid

from ..database.config import db_manager
from ..database.models import (
    User, Prompt, PromptVersion, Pipeline, PipelineStep, PipelineConnection,
    PipelineExecution, StepExecution, PromptExecution, LLMProvider, 
    Setting, AuditLog, UsageMetric, Session as UserSession, APIKey
)

logger = structlog.get_logger()

class DatabaseStorageService:
    """Database-based storage service using PostgreSQL."""
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    # User Management
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user."""
        try:
            with db_manager.get_session_context() as session:
                user = User(**user_data)
                session.add(user)
                session.flush()
                
                # Log the action
                await self._log_audit(
                    session, None, "CREATE", "user", str(user.id), 
                    new_values={"username": user.username, "email": user.email}
                )
                
                return self._user_to_dict(user)
        except IntegrityError as e:
            self.logger.error("User creation failed - integrity error", error=str(e))
            raise ValueError("User with this username or email already exists")
        except Exception as e:
            self.logger.error("User creation failed", error=str(e))
            raise
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        try:
            with db_manager.get_session_context() as session:
                user = session.query(User).filter(User.id == user_id).first()
                return self._user_to_dict(user) if user else None
        except Exception as e:
            self.logger.error("Failed to get user by ID", user_id=user_id, error=str(e))
            raise
    
    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username."""
        try:
            with db_manager.get_session_context() as session:
                user = session.query(User).filter(User.username == username).first()
                return self._user_to_dict(user) if user else None
        except Exception as e:
            self.logger.error("Failed to get user by username", username=username, error=str(e))
            raise
    
    async def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user information."""
        try:
            with db_manager.get_session_context() as session:
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    raise ValueError("User not found")
                
                old_values = {"username": user.username, "email": user.email}
                
                # Update fields
                for key, value in user_data.items():
                    if hasattr(user, key):
                        setattr(user, key, value)
                
                user.updated_at = datetime.now(timezone.utc)
                session.flush()
                
                # Log the action
                await self._log_audit(
                    session, user_id, "UPDATE", "user", user_id,
                    old_values=old_values, new_values=user_data
                )
                
                return self._user_to_dict(user)
        except Exception as e:
            self.logger.error("User update failed", user_id=user_id, error=str(e))
            raise
    
    # Prompt Management
    async def create_prompt(self, prompt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new prompt."""
        try:
            with db_manager.get_session_context() as session:
                # Create prompt
                prompt = Prompt(**prompt_data)
                session.add(prompt)
                session.flush()
                
                # Create initial version
                version_data = {
                    "prompt_id": prompt.id,
                    "version": prompt_data.get("version", "1.0.0"),
                    "commit_message": "Initial version",
                    "content_snapshot": self._prompt_to_dict(prompt),
                    "created_by": prompt_data.get("creator_id")
                }
                version = PromptVersion(**version_data)
                session.add(version)
                session.flush()
                
                # Log the action
                await self._log_audit(
                    session, prompt_data.get("creator_id"), "CREATE", "prompt", str(prompt.id),
                    new_values={"name": prompt.name, "version": prompt.version}
                )
                
                return self._prompt_to_dict(prompt)
        except Exception as e:
            self.logger.error("Prompt creation failed", error=str(e))
            raise
    
    async def list_prompts(self, 
                         user_id: Optional[str] = None,
                         task_type: Optional[str] = None,
                         status: Optional[str] = None,
                         tags: Optional[List[str]] = None,
                         limit: int = 20,
                         offset: int = 0) -> List[Dict[str, Any]]:
        """List prompts with filtering and pagination."""
        try:
            with db_manager.get_session_context() as session:
                query = session.query(Prompt).options(
                    selectinload(Prompt.creator),
                    selectinload(Prompt.provider)
                )
                
                # Apply filters
                if user_id:
                    query = query.filter(Prompt.creator_id == user_id)
                if task_type:
                    query = query.filter(Prompt.task_type == task_type)
                if status:
                    query = query.filter(Prompt.status == status)
                if tags:
                    # Filter by tags (array contains any of the specified tags)
                    tag_conditions = [Prompt.tags.contains([tag]) for tag in tags]
                    query = query.filter(or_(*tag_conditions))
                
                # Apply ordering and pagination
                query = query.order_by(desc(Prompt.updated_at))
                query = query.offset(offset).limit(limit)
                
                prompts = query.all()
                return [self._prompt_to_dict(prompt) for prompt in prompts]
        except Exception as e:
            self.logger.error("Failed to list prompts", error=str(e))
            raise
    
    async def get_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get prompt by ID."""
        try:
            with db_manager.get_session_context() as session:
                prompt = session.query(Prompt).options(
                    selectinload(Prompt.creator),
                    selectinload(Prompt.provider),
                    selectinload(Prompt.versions)
                ).filter(Prompt.id == prompt_id).first()
                
                return self._prompt_to_dict(prompt) if prompt else None
        except Exception as e:
            self.logger.error("Failed to get prompt", prompt_id=prompt_id, error=str(e))
            raise
    
    async def update_prompt(self, prompt_id: str, prompt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update prompt and create new version."""
        try:
            with db_manager.get_session_context() as session:
                prompt = session.query(Prompt).filter(Prompt.id == prompt_id).first()
                if not prompt:
                    raise ValueError("Prompt not found")
                
                old_values = self._prompt_to_dict(prompt)
                
                # Update prompt fields
                for key, value in prompt_data.items():
                    if hasattr(prompt, key) and key not in ['id', 'created_at']:
                        setattr(prompt, key, value)
                
                prompt.updated_at = datetime.now(timezone.utc)
                
                # Create new version if content changed
                if any(key in prompt_data for key in ['messages', 'input_variables', 'parameters']):
                    version_data = {
                        "prompt_id": prompt.id,
                        "version": prompt_data.get("version", prompt.version),
                        "commit_message": prompt_data.get("commit_message", "Updated prompt"),
                        "content_snapshot": self._prompt_to_dict(prompt),
                        "created_by": prompt_data.get("updated_by", prompt.creator_id)
                    }
                    version = PromptVersion(**version_data)
                    session.add(version)
                
                session.flush()
                
                # Log the action
                await self._log_audit(
                    session, prompt_data.get("updated_by"), "UPDATE", "prompt", prompt_id,
                    old_values=old_values, new_values=prompt_data
                )
                
                return self._prompt_to_dict(prompt)
        except Exception as e:
            self.logger.error("Prompt update failed", prompt_id=prompt_id, error=str(e))
            raise
    
    async def delete_prompt(self, prompt_id: str, user_id: str) -> bool:
        """Delete prompt (soft delete by setting status)."""
        try:
            with db_manager.get_session_context() as session:
                prompt = session.query(Prompt).filter(Prompt.id == prompt_id).first()
                if not prompt:
                    return False
                
                old_values = {"status": prompt.status}
                prompt.status = "ARCHIVED"
                prompt.updated_at = datetime.now(timezone.utc)
                session.flush()
                
                # Log the action
                await self._log_audit(
                    session, user_id, "DELETE", "prompt", prompt_id,
                    old_values=old_values, new_values={"status": "ARCHIVED"}
                )
                
                return True
        except Exception as e:
            self.logger.error("Prompt deletion failed", prompt_id=prompt_id, error=str(e))
            raise
    
    # Pipeline Management
    async def create_pipeline(self, pipeline_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new pipeline."""
        try:
            with db_manager.get_session_context() as session:
                # Create pipeline
                pipeline = Pipeline(**{k: v for k, v in pipeline_data.items() if k != 'steps'})
                session.add(pipeline)
                session.flush()
                
                # Create steps
                if 'steps' in pipeline_data:
                    for i, step_data in enumerate(pipeline_data['steps']):
                        step_data.update({
                            'pipeline_id': pipeline.id,
                            'order': i
                        })
                        step = PipelineStep(**step_data)
                        session.add(step)
                
                session.flush()
                
                # Log the action
                await self._log_audit(
                    session, pipeline_data.get("creator_id"), "CREATE", "pipeline", str(pipeline.id),
                    new_values={"name": pipeline.name, "steps_count": len(pipeline_data.get('steps', []))}
                )
                
                return self._pipeline_to_dict(pipeline)
        except Exception as e:
            self.logger.error("Pipeline creation failed", error=str(e))
            raise
    
    async def list_pipelines(self, 
                           user_id: Optional[str] = None,
                           status: Optional[str] = None,
                           limit: int = 20,
                           offset: int = 0) -> List[Dict[str, Any]]:
        """List pipelines with filtering and pagination."""
        try:
            with db_manager.get_session_context() as session:
                query = session.query(Pipeline).options(
                    selectinload(Pipeline.creator),
                    selectinload(Pipeline.steps)
                )
                
                # Apply filters
                if user_id:
                    query = query.filter(Pipeline.creator_id == user_id)
                if status:
                    query = query.filter(Pipeline.status == status)
                
                # Apply ordering and pagination
                query = query.order_by(desc(Pipeline.updated_at))
                query = query.offset(offset).limit(limit)
                
                pipelines = query.all()
                return [self._pipeline_to_dict(pipeline) for pipeline in pipelines]
        except Exception as e:
            self.logger.error("Failed to list pipelines", error=str(e))
            raise
    
    # LLM Provider Management
    async def create_llm_provider(self, provider_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new LLM provider."""
        try:
            with db_manager.get_session_context() as session:
                provider = LLMProvider(**provider_data)
                session.add(provider)
                session.flush()
                
                return self._provider_to_dict(provider)
        except Exception as e:
            self.logger.error("LLM provider creation failed", error=str(e))
            raise
    
    async def list_llm_providers(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """List LLM providers."""
        try:
            with db_manager.get_session_context() as session:
                query = session.query(LLMProvider)
                
                if active_only:
                    query = query.filter(LLMProvider.is_active == True)
                
                query = query.order_by(LLMProvider.name)
                providers = query.all()
                
                return [self._provider_to_dict(provider) for provider in providers]
        except Exception as e:
            self.logger.error("Failed to list LLM providers", error=str(e))
            raise
    
    # Settings Management
    async def update_settings(self, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update system settings."""
        try:
            with db_manager.get_session_context() as session:
                for category, category_data in settings_data.items():
                    for key, value in category_data.items():
                        # Check if setting exists
                        setting = session.query(Setting).filter(
                            and_(Setting.category == category, Setting.key == key)
                        ).first()
                        
                        if setting:
                            setting.value = value
                            setting.updated_at = datetime.now(timezone.utc)
                        else:
                            setting = Setting(
                                category=category,
                                key=key,
                                value=value
                            )
                            session.add(setting)
                
                session.flush()
                return settings_data
        except Exception as e:
            self.logger.error("Settings update failed", error=str(e))
            raise
    
    async def get_settings(self) -> Optional[Dict[str, Any]]:
        """Get all system settings."""
        try:
            with db_manager.get_session_context() as session:
                settings = session.query(Setting).all()
                
                result = {}
                for setting in settings:
                    if setting.category not in result:
                        result[setting.category] = {}
                    result[setting.category][setting.key] = setting.value
                
                return result if result else None
        except Exception as e:
            self.logger.error("Failed to get settings", error=str(e))
            raise
    
    # Analytics and Usage Metrics
    async def record_usage_metric(self, metric_data: Dict[str, Any]) -> None:
        """Record a usage metric."""
        try:
            with db_manager.get_session_context() as session:
                metric = UsageMetric(**metric_data)
                session.add(metric)
                session.flush()
        except Exception as e:
            self.logger.error("Failed to record usage metric", error=str(e))
            # Don't raise - metrics recording should not break application flow
    
    async def get_usage_metrics(self, 
                              start_date: datetime,
                              end_date: datetime,
                              metric_types: Optional[List[str]] = None,
                              user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get usage metrics for analytics."""
        try:
            with db_manager.get_session_context() as session:
                query = session.query(UsageMetric).filter(
                    and_(
                        UsageMetric.date >= start_date,
                        UsageMetric.date <= end_date
                    )
                )
                
                if metric_types:
                    query = query.filter(UsageMetric.metric_type.in_(metric_types))
                
                if user_id:
                    query = query.filter(UsageMetric.user_id == user_id)
                
                metrics = query.all()
                return [self._metric_to_dict(metric) for metric in metrics]
        except Exception as e:
            self.logger.error("Failed to get usage metrics", error=str(e))
            raise
    
    # Helper methods for data conversion
    def _user_to_dict(self, user: User) -> Dict[str, Any]:
        """Convert User model to dictionary."""
        if not user:
            return None
        
        return {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if user.role else None,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
    
    def _prompt_to_dict(self, prompt: Prompt) -> Dict[str, Any]:
        """Convert Prompt model to dictionary."""
        if not prompt:
            return None
        
        return {
            "id": str(prompt.id),
            "name": prompt.name,
            "description": prompt.description,
            "task_type": prompt.task_type,
            "tags": prompt.tags or [],
            "developer_notes": prompt.developer_notes,
            "version_info": {
                "version": prompt.version,
                "status": prompt.status.value if prompt.status else None,
                "is_active": prompt.is_active,
                "created_at": prompt.created_at.isoformat() if prompt.created_at else None,
                "updated_at": prompt.updated_at.isoformat() if prompt.updated_at else None,
                "created_by": str(prompt.creator_id) if prompt.creator_id else None,
                "author": prompt.creator.full_name if prompt.creator else None,
            },
            "messages": prompt.messages or [],
            "input_variables": prompt.input_variables or {},
            "model_provider": prompt.provider.name if prompt.provider else None,
            "model_name": prompt.model_name,
            "parameters": prompt.parameters or {},
            "test_cases": prompt.test_cases or [],
            "evaluation_metrics": prompt.evaluation_metrics or {},
            "created_at": prompt.created_at.isoformat() if prompt.created_at else None,
            "updated_at": prompt.updated_at.isoformat() if prompt.updated_at else None,
        }
    
    def _pipeline_to_dict(self, pipeline: Pipeline) -> Dict[str, Any]:
        """Convert Pipeline model to dictionary."""
        if not pipeline:
            return None
        
        return {
            "id": str(pipeline.id),
            "name": pipeline.name,
            "description": pipeline.description,
            "status": pipeline.status.value if pipeline.status else None,
            "error_strategy": pipeline.error_strategy,
            "max_retries": pipeline.max_retries,
            "timeout_minutes": pipeline.timeout_minutes,
            "steps": [self._step_to_dict(step) for step in pipeline.steps] if pipeline.steps else [],
            "created_at": pipeline.created_at.isoformat() if pipeline.created_at else None,
            "updated_at": pipeline.updated_at.isoformat() if pipeline.updated_at else None,
        }
    
    def _step_to_dict(self, step: PipelineStep) -> Dict[str, Any]:
        """Convert PipelineStep model to dictionary."""
        if not step:
            return None
        
        return {
            "id": str(step.id),
            "name": step.name,
            "type": step.step_type,
            "order": step.order,
            "prompt_id": str(step.prompt_id) if step.prompt_id else None,
            "configuration": step.configuration or {},
            "position": step.position or {},
        }
    
    def _provider_to_dict(self, provider: LLMProvider) -> Dict[str, Any]:
        """Convert LLMProvider model to dictionary."""
        if not provider:
            return None
        
        return {
            "id": str(provider.id),
            "name": provider.name,
            "provider_type": provider.provider_type,
            "base_url": provider.base_url,
            "models": provider.models or [],
            "configuration": provider.configuration or {},
            "is_active": provider.is_active,
            "created_at": provider.created_at.isoformat() if provider.created_at else None,
            "updated_at": provider.updated_at.isoformat() if provider.updated_at else None,
        }
    
    def _metric_to_dict(self, metric: UsageMetric) -> Dict[str, Any]:
        """Convert UsageMetric model to dictionary."""
        if not metric:
            return None
        
        return {
            "id": str(metric.id),
            "metric_type": metric.metric_type,
            "metric_name": metric.metric_name,
            "value": metric.value,
            "unit": metric.unit,
            "dimensions": metric.dimensions or {},
            "date": metric.date.isoformat() if metric.date else None,
            "hour": metric.hour,
        }
    
    async def _log_audit(self, session: Session, user_id: Optional[str], action: str, 
                        resource_type: str, resource_id: str,
                        old_values: Optional[Dict] = None, 
                        new_values: Optional[Dict] = None) -> None:
        """Log audit trail."""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                old_values=old_values,
                new_values=new_values,
                timestamp=datetime.now(timezone.utc)
            )
            session.add(audit_log)
        except Exception as e:
            self.logger.error("Failed to log audit", error=str(e))
            # Don't raise - audit logging should not break application flow