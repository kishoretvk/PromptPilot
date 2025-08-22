from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import json
import logging

from .models import (
    Prompt, PromptVersion, TestCase, TestResult, Pipeline, PipelineStep,
    PipelineExecution, StepExecution, Execution, User, Setting, LLMProvider,
    AuditLog, SystemMetric
)
from .schemas import (
    CreatePromptRequest, UpdatePromptRequest, PromptResponse,
    CreatePipelineRequest, UpdatePipelineRequest, PipelineResponse,
    TestPromptRequest, TestResultResponse, PaginatedResponse
)
from .exceptions import (
    PromptNotFoundError, PipelineNotFoundError, ValidationError,
    LLMProviderError
)

logger = logging.getLogger(__name__)

class BaseService:
    \"\"\"Base service class with common functionality\"\"\"
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_action(self, user_id: str, action: str, resource_type: str, 
                   resource_id: str = None, details: Dict = None):
        \"\"\"Log user action for audit trail\"\"\"
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            created_at=datetime.utcnow()
        )
        self.db.add(audit_log)
        self.db.commit()

class PromptService(BaseService):
    \"\"\"Service for prompt management operations\"\"\"
    
    async def get_prompts(
        self,
        page: int = 1,
        limit: int = 10,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
        task_type: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> PaginatedResponse:
        \"\"\"Get paginated list of prompts with filtering\"\"\"
        
        query = self.db.query(Prompt)
        
        # Apply filters
        if user_id:
            query = query.filter(Prompt.owner_id == user_id)
        
        if search:
            search_filter = or_(
                Prompt.name.ilike(f\"%{search}%\"),
                Prompt.description.ilike(f\"%{search}%\")
            )
            query = query.filter(search_filter)
        
        if task_type:
            query = query.filter(Prompt.task_type == task_type)
        
        if tags:
            # Filter by tags (JSON contains)
            for tag in tags:
                query = query.filter(Prompt.tags.contains([tag]))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        prompts = query.order_by(desc(Prompt.created_at)).offset(offset).limit(limit).all()
        
        # Calculate pagination info
        total_pages = (total + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        return PaginatedResponse(
            items=[PromptResponse.from_orm(prompt) for prompt in prompts],
            total=total,
            page=page,
            per_page=limit,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )
    
    async def get_prompt(self, prompt_id: str) -> Optional[PromptResponse]:
        \"\"\"Get prompt by ID\"\"\"
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return None
        return PromptResponse.from_orm(prompt)
    
    async def create_prompt(self, prompt_data: CreatePromptRequest, user_id: str) -> PromptResponse:
        \"\"\"Create new prompt\"\"\"
        
        # Create prompt
        prompt = Prompt(
            id=str(uuid.uuid4()),
            name=prompt_data.name,
            description=prompt_data.description,
            task_type=prompt_data.task_type,
            tags=prompt_data.tags,
            developer_notes=prompt_data.developer_notes,
            messages=[msg.dict() for msg in prompt_data.messages],
            input_variables=prompt_data.input_variables,
            model_provider=prompt_data.model_provider,
            model_name=prompt_data.model_name,
            parameters=prompt_data.parameters,
            owner_id=user_id,
            created_at=datetime.utcnow()
        )
        
        self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        
        # Create initial version
        await self.create_version(prompt.id, \"1.0.0\", \"Initial version\", user_id)
        
        # Create test cases if provided
        for test_case_data in prompt_data.test_cases:
            test_case = TestCase(
                id=str(uuid.uuid4()),
                prompt_id=prompt.id,
                name=test_case_data.name,
                input_data=test_case_data.inputs,
                expected_output=test_case_data.expected_outputs,
                test_type=test_case_data.test_type,
                evaluation_metrics=test_case_data.evaluation_metrics
            )
            self.db.add(test_case)
        
        self.db.commit()
        
        # Log action
        self.log_action(user_id, \"create\", \"prompt\", prompt.id, {
            \"name\": prompt.name,
            \"task_type\": prompt.task_type
        })
        
        logger.info(f\"Created prompt {prompt.id} for user {user_id}\")
        
        return PromptResponse.from_orm(prompt)
    
    async def update_prompt(self, prompt_id: str, prompt_data: UpdatePromptRequest, user_id: str) -> Optional[PromptResponse]:
        \"\"\"Update existing prompt\"\"\"
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return None
        
        # Check ownership or admin rights
        if prompt.owner_id != user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or user.role not in [\"admin\", \"superuser\"]:
                raise ValidationError(\"Not authorized to update this prompt\")
        
        # Store old values for change tracking
        old_values = {
            \"name\": prompt.name,
            \"version\": prompt.version
        }
        
        # Update fields
        update_data = prompt_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(prompt, field):
                setattr(prompt, field, value)
        
        prompt.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(prompt)
        
        # Create new version if significant changes
        if any(field in update_data for field in ['messages', 'parameters', 'model_name']):
            new_version = self.increment_version(prompt.version)
            await self.create_version(prompt.id, new_version, \"Updated prompt\", user_id)
            prompt.version = new_version
            self.db.commit()
        
        # Log action
        self.log_action(user_id, \"update\", \"prompt\", prompt.id, {
            \"old_values\": old_values,
            \"updated_fields\": list(update_data.keys())
        })
        
        logger.info(f\"Updated prompt {prompt.id} by user {user_id}\")
        
        return PromptResponse.from_orm(prompt)
    
    async def delete_prompt(self, prompt_id: str, user_id: str) -> bool:
        \"\"\"Delete prompt\"\"\"
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return False
        
        # Check ownership or admin rights
        if prompt.owner_id != user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or user.role not in [\"admin\", \"superuser\"]:
                raise ValidationError(\"Not authorized to delete this prompt\")
        
        # Soft delete - mark as archived
        prompt.status = \"archived\"
        prompt.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        # Log action
        self.log_action(user_id, \"delete\", \"prompt\", prompt.id, {
            \"name\": prompt.name
        })
        
        logger.info(f\"Deleted prompt {prompt.id} by user {user_id}\")
        
        return True
    
    async def test_prompt(self, prompt_id: str, test_data: TestPromptRequest, llm_service) -> TestResultResponse:
        \"\"\"Test prompt execution\"\"\"
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            raise PromptNotFoundError(f\"Prompt {prompt_id} not found\")
        
        # Create execution record
        execution = Execution(
            id=str(uuid.uuid4()),
            prompt_id=prompt.id,
            input_data=test_data.input_variables,
            status=\"running\",
            model_provider=prompt.model_provider,
            model_name=prompt.model_name,
            model_parameters=test_data.model_parameters or prompt.parameters,
            started_at=datetime.utcnow()
        )
        
        self.db.add(execution)
        self.db.commit()
        
        try:
            # Execute prompt with LLM service
            result = await llm_service.execute_prompt(
                prompt=prompt,
                variables=test_data.input_variables,
                parameters=test_data.model_parameters or prompt.parameters
            )
            
            # Update execution with results
            execution.output_data = {\"response\": result.response}
            execution.status = \"completed\"
            execution.completed_at = datetime.utcnow()
            execution.execution_time = (execution.completed_at - execution.started_at).total_seconds()
            execution.cost = result.cost
            execution.input_tokens = result.input_tokens
            execution.output_tokens = result.output_tokens
            execution.total_tokens = result.total_tokens
            
            # Update prompt analytics
            prompt.execution_count += 1
            prompt.total_cost += result.cost
            
            # Update average execution time
            if prompt.avg_execution_time == 0:
                prompt.avg_execution_time = execution.execution_time
            else:
                prompt.avg_execution_time = (
                    (prompt.avg_execution_time * (prompt.execution_count - 1) + execution.execution_time) / 
                    prompt.execution_count
                )
            
            self.db.commit()
            
            return TestResultResponse(
                id=execution.id,
                output=result.response,
                execution_time=execution.execution_time,
                cost=result.cost,
                success=True,
                tokens_used=result.total_tokens,
                created_at=execution.completed_at
            )
            
        except Exception as e:
            # Update execution with error
            execution.status = \"failed\"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            execution.execution_time = (execution.completed_at - execution.started_at).total_seconds()
            
            self.db.commit()
            
            logger.error(f\"Prompt execution failed: {e}\")
            
            return TestResultResponse(
                id=execution.id,
                output=\"\",
                execution_time=execution.execution_time,
                cost=0.0,
                success=False,
                error_message=str(e),
                created_at=execution.completed_at
            )
    
    async def create_version(self, prompt_id: str, version: str, changelog: str, user_id: str) -> PromptVersion:
        \"\"\"Create new prompt version\"\"\"
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            raise PromptNotFoundError(f\"Prompt {prompt_id} not found\")
        
        # Deactivate previous versions
        self.db.query(PromptVersion).filter(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.is_active == True
        ).update({\"is_active\": False})
        
        # Create new version
        version_obj = PromptVersion(
            id=str(uuid.uuid4()),
            prompt_id=prompt_id,
            version=version,
            changelog=changelog,
            content_snapshot=prompt.to_dict(),
            created_by=user_id,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        self.db.add(version_obj)
        self.db.commit()
        
        return version_obj
    
    def increment_version(self, current_version: str) -> str:
        \"\"\"Increment version number\"\"\"
        try:
            parts = current_version.split('.')
            if len(parts) >= 3:
                major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
                return f\"{major}.{minor}.{patch + 1}\"
            else:
                return f\"{current_version}.1\"
        except (ValueError, IndexError):
            return \"1.0.1\"

class PipelineService(BaseService):
    \"\"\"Service for pipeline management operations\"\"\"
    
    # Similar implementation pattern for pipelines...
    pass

class AnalyticsService(BaseService):
    \"\"\"Service for analytics and metrics\"\"\"
    
    async def get_usage_metrics(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        \"\"\"Get usage metrics with filtering\"\"\"
        
        # Base query for executions
        query = self.db.query(Execution)
        
        # Apply date filters
        if 'start_date' in filters:
            query = query.filter(Execution.started_at >= filters['start_date'])
        if 'end_date' in filters:
            query = query.filter(Execution.started_at <= filters['end_date'])
        
        # Get total counts
        total_executions = query.count()
        total_prompts = self.db.query(Prompt).count()
        total_pipelines = self.db.query(Pipeline).count()
        active_users = self.db.query(User).filter(User.is_active == True).count()
        
        # Get usage by day
        daily_usage = self.db.query(
            func.date(Execution.started_at).label('date'),
            func.count(Execution.id).label('executions'),
            func.sum(Execution.cost).label('cost')
        ).group_by(func.date(Execution.started_at)).all()
        
        # Get top prompts
        top_prompts = self.db.query(
            Prompt.id,
            Prompt.name,
            func.count(Execution.id).label('executions'),
            func.avg(Execution.execution_time).label('avg_time')
        ).join(Execution).group_by(Prompt.id, Prompt.name).order_by(
            desc('executions')
        ).limit(10).all()
        
        return {
            'total_prompts': total_prompts,
            'total_pipelines': total_pipelines,
            'total_executions': total_executions,
            'active_users': active_users,
            'usage_by_day': [{
                'date': day.date.isoformat(),
                'executions': day.executions,
                'cost': float(day.cost or 0)
            } for day in daily_usage],
            'top_prompts': [{
                'prompt_id': prompt.id,
                'name': prompt.name,
                'executions': prompt.executions,
                'avg_execution_time': float(prompt.avg_time or 0)
            } for prompt in top_prompts]
        }

class SettingsService(BaseService):
    \"\"\"Service for settings management\"\"\"
    
    async def get_setting(self, key: str) -> Optional[Dict[str, Any]]:
        \"\"\"Get setting by key\"\"\"
        setting = self.db.query(Setting).filter(Setting.key == key).first()
        if not setting:
            return None
        
        return {
            'key': setting.key,
            'value': setting.value,
            'description': setting.description,
            'category': setting.category
        }
    
    async def update_setting(self, key: str, value: Any, user_id: str) -> Dict[str, Any]:
        \"\"\"Update or create setting\"\"\"
        setting = self.db.query(Setting).filter(Setting.key == key).first()
        
        if setting:
            old_value = setting.value
            setting.value = value
            setting.updated_at = datetime.utcnow()
        else:
            setting = Setting(
                id=str(uuid.uuid4()),
                key=key,
                value=value,
                created_at=datetime.utcnow()
            )
            self.db.add(setting)
            old_value = None
        
        self.db.commit()
        
        # Log action
        self.log_action(user_id, \"update_setting\", \"setting\", setting.id, {
            'key': key,
            'old_value': old_value,
            'new_value': value
        })
        
        return {
            'key': setting.key,
            'value': setting.value,
            'description': setting.description,
            'category': setting.category
        }

class LLMService:
    \"\"\"Service for LLM provider integrations\"\"\"
    
    def __init__(self):
        self.providers = {}
    
    async def execute_prompt(self, prompt, variables: Dict[str, Any], parameters: Dict[str, Any]):
        \"\"\"Execute prompt with LLM provider\"\"\"
        
        # Compile prompt with variables
        compiled_messages = []
        for msg in prompt.messages:
            content = msg['content']
            for var, value in variables.items():
                content = content.replace(f\"{{{var}}}\", str(value))
            compiled_messages.append({
                'role': msg['role'],
                'content': content
            })
        
        # Get provider
        provider = self.get_provider(prompt.model_provider)
        if not provider:
            raise LLMProviderError(f\"Provider {prompt.model_provider} not available\")
        
        # Execute with provider
        result = await provider.execute(
            model=prompt.model_name,
            messages=compiled_messages,
            parameters=parameters
        )
        
        return result
    
    def get_provider(self, provider_name: str):
        \"\"\"Get LLM provider instance\"\"\"
        # Implementation would return appropriate provider
        # (OpenAI, Anthropic, etc.)
        return None

class StorageService:
    \"\"\"Service for file storage operations\"\"\"
    
    def __init__(self):
        self.storage_backends = {}
    
    async def store_file(self, file_data: bytes, filename: str, content_type: str) -> str:
        \"\"\"Store file and return URL\"\"\"
        # Implementation for file storage
        pass
    
    async def get_file(self, file_id: str) -> bytes:
        \"\"\"Retrieve file by ID\"\"\"
        # Implementation for file retrieval
        pass