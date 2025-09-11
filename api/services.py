import json
import difflib
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from uuid import uuid4, UUID
import uuid
from sqlalchemy import or_, desc, func, select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from pydantic import BaseModel
from api.database.models import Prompt, PromptVersion, User, PromptExecution, PipelineExecution, Pipeline
from api.schemas import CreatePromptRequest, UpdatePromptRequest, PromptResponse, TestPromptRequest, TestResultResponse

# Define missing Pydantic models inline
from pydantic import BaseModel
from typing import Optional, List

class PromptCreate(BaseModel):
    name: str
    description: Optional[str] = None
    messages: List[dict]
    parameters: Optional[dict] = None
    model_name: Optional[str] = None
    model_provider: Optional[str] = None
    tags: Optional[List[str]] = None
    task_type: Optional[str] = None

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    messages: Optional[List[dict]] = None
    parameters: Optional[dict] = None
    model_name: Optional[str] = None
    model_provider: Optional[str] = None
    tags: Optional[List[str]] = None
    task_type: Optional[str] = None

class PaginatedResponse(BaseModel):
    items: List[PromptResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

class Execution(BaseModel):
    id: str
    prompt_id: str
    input_data: dict
    status: str
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    model_parameters: Optional[dict] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    execution_time: Optional[float] = None
    cost: Optional[float] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    error_message: Optional[str] = None

class BaseService:
    """Base service class"""
    pass

class Setting(BaseModel):
    id: str
    key: str
    value: Any
    description: Optional[str] = None
    category: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
from api.database.config import get_db
from api.config import settings
import logging

def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('[%(asctime)s] %(levelname)s %(name)s: %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger

logger = get_logger(__name__)
# Define exception classes inline
class PromptNotFoundError(Exception):
    """Raised when a prompt is not found"""
    pass

class UserNotFoundError(Exception):
    """Raised when a user is not found"""
    pass

class ValidationError(Exception):
    """Raised when validation fails"""
    pass

class LLMProviderError(Exception):
    """Raised when LLM provider encounters an error"""
    pass

# Define security functions inline
import bcrypt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

logger = get_logger(__name__)

# Define LLMService class inline before PromptService
class LLMService:
    """Service for LLM provider integrations"""

    def __init__(self):
        self.providers = {}

    async def execute_prompt(self, prompt, variables: Dict[str, Any], parameters: Dict[str, Any]):
        """Execute prompt with LLM provider"""

        # Compile prompt with variables
        compiled_messages = []
        for msg in prompt.messages:
            content = msg['content']
            for var, value in variables.items():
                content = content.replace(f"{{{var}}}", str(value))
            compiled_messages.append({
                'role': msg['role'],
                'content': content
            })

        # Get provider
        provider = self.get_provider(prompt.model_provider)
        if not provider:
            raise LLMProviderError(f"Provider {prompt.model_provider} not available")

        # Execute with provider
        result = await provider.execute(
            model=prompt.model_name,
            messages=compiled_messages,
            parameters=parameters
        )

        return result

    def get_provider(self, provider_name: str):
        """Get LLM provider instance"""
        # Implementation would return appropriate provider
        # (OpenAI, Anthropic, etc.)
        return None

class PromptService:
    """Service for prompt management operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_prompt(self, prompt_data: PromptCreate, user_id: str) -> PromptResponse:
        """Create a new prompt with initial version"""
        # Implementation here...
        pass
    
    async def get_prompt(self, prompt_id: str) -> Optional[PromptResponse]:
        """Get prompt by ID"""
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return None
        return PromptResponse.from_orm(prompt)
    
    async def get_prompts(self, page: int = 1, limit: int = 10, search: str = None, 
                         tags: List[str] = None, task_type: str = None) -> PaginatedResponse:
        """Get paginated list of prompts with filtering"""
        
        query = self.db.query(Prompt)
        
        # Apply filters
        if search:
            search_filter = or_(
                Prompt.name.ilike(f"%{search}%"),
                Prompt.description.ilike(f"%{search}%")
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
    
    async def update_prompt(self, prompt_id: str, prompt_data: PromptUpdate, user_id: str) -> Optional[PromptResponse]:
        """Update existing prompt"""
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return None
        
        # Check ownership or admin rights
        if prompt.owner_id != user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or user.role not in ["admin", "superuser"]:
                raise ValidationError("Not authorized to update this prompt")
        
        # Store old values for change tracking
        old_values = {
            "name": prompt.name,
            "version": prompt.version
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
            await self.create_version(prompt.id, new_version, "Updated prompt", user_id)
            prompt.version = new_version
            self.db.commit()
        
        # Log action
        self.log_action(user_id, "update", "prompt", prompt.id, {
            "old_values": old_values,
            "updated_fields": list(update_data.keys())
        })
        
        logger.info(f"Updated prompt {prompt.id} by user {user_id}")
        
        return PromptResponse.from_orm(prompt)
    
    async def delete_prompt(self, prompt_id: str, user_id: str) -> bool:
        """Delete prompt"""
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return False
        
        # Check ownership or admin rights
        if prompt.owner_id != user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or user.role not in ["admin", "superuser"]:
                raise ValidationError("Not authorized to delete this prompt")
        
        # Soft delete - mark as archived
        prompt.status = "archived"
        prompt.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        # Log action
        self.log_action(user_id, "delete", "prompt", prompt.id, {
            "name": prompt.name
        })
        
        logger.info(f"Deleted prompt {prompt.id} by user {user_id}")
        
        return True
    
    async def test_prompt(self, prompt_id: str, test_data: TestPromptRequest, llm_service: LLMService) -> TestResultResponse:
        """Test prompt execution"""
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            raise PromptNotFoundError(f"Prompt {prompt_id} not found")
        
        # Create execution record
        execution = Execution(
            id=str(uuid.uuid4()),
            prompt_id=prompt.id,
            input_data=test_data.input_variables,
            status="running",
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
            execution.output_data = {"response": result.response}
            execution.status = "completed"
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
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            execution.execution_time = (execution.completed_at - execution.started_at).total_seconds()
            
            self.db.commit()
            
            logger.error(f"Prompt execution failed: {e}")
            
            return TestResultResponse(
                id=execution.id,
                output="",
                execution_time=execution.execution_time,
                cost=0.0,
                success=False,
                error_message=str(e),
                created_at=execution.completed_at
            )
    
    async def create_version(self, prompt_id: str, version: str, changelog: str, user_id: str, parent_version_id: str = None) -> PromptVersion:
        """Create new prompt version with optional parent for branching"""
        
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            raise PromptNotFoundError(f"Prompt {prompt_id} not found")
        
        # Deactivate previous versions if this is not a branch
        if not parent_version_id:
            self.db.query(PromptVersion).filter(
                PromptVersion.prompt_id == prompt_id,
                PromptVersion.is_active == True
            ).update({"is_active": False})
        
        # Create new version
        version_obj = PromptVersion(
            id=str(uuid.uuid4()),
            prompt_id=prompt_id,
            version=version,
            changelog=changelog,
            content_snapshot=prompt.to_dict(),
            created_by=user_id,
            is_active=True if not parent_version_id else False,  # Only main branch versions are active
            created_at=datetime.utcnow(),
            parent_version_id=parent_version_id
        )
        
        self.db.add(version_obj)
        self.db.commit()
        
        return version_obj

    async def create_branch(self, prompt_id: str, branch_name: str, source_version_id: str, user_id: str) -> PromptVersion:
        """Create a new branch from a specific version"""
        # Get the source version
        source_version = self.db.query(PromptVersion).filter(
            PromptVersion.id == source_version_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        if not source_version:
            raise ValueError("Source version not found")
        
        # Create branch version
        branch_version = PromptVersion(
            id=str(uuid.uuid4()),
            prompt_id=prompt_id,
            version=f"branch-{branch_name}-{uuid.uuid4().hex[:8]}",
            changelog=f"Created branch '{branch_name}' from version {source_version.version}",
            content_snapshot=source_version.content_snapshot,
            created_by=user_id,
            is_active=False,  # Branches are not active by default
            created_at=datetime.utcnow(),
            parent_version_id=source_version_id
        )
        
        self.db.add(branch_version)
        self.db.commit()
        
        return branch_version

    async def merge_versions(self, prompt_id: str, source_version_id: str, target_version_id: str, user_id: str, merge_message: str = None) -> PromptVersion:
        """Merge one version into another"""
        # Get source and target versions
        source_version = self.db.query(PromptVersion).filter(
            PromptVersion.id == source_version_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        target_version = self.db.query(PromptVersion).filter(
            PromptVersion.id == target_version_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        if not source_version or not target_version:
            raise ValueError("Source or target version not found")
        
        # Create merge version
        merge_version = PromptVersion(
            id=str(uuid.uuid4()),
            prompt_id=prompt_id,
            version=self.increment_version(target_version.version),
            changelog=merge_message or f"Merged branch from version {source_version.version}",
            content_snapshot=source_version.content_snapshot,  # Use source content as merged result
            created_by=user_id,
            is_active=True,
            created_at=datetime.utcnow(),
            parent_version_id=target_version_id,
            merged_from_version_id=source_version_id,
            is_merge=True
        )
        
        # Deactivate previous active versions
        self.db.query(PromptVersion).filter(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.is_active == True
        ).update({"is_active": False})
        
        self.db.add(merge_version)
        self.db.commit()
        
        return merge_version

    async def get_prompt_versions(self, prompt_id: str, include_branches: bool = True, limit: int = 50) -> List[PromptVersion]:
        """Get all versions of a prompt with optional filtering"""
        query = self.db.query(PromptVersion).filter(
            PromptVersion.prompt_id == prompt_id
        )
        
        if not include_branches:
            # Only get main branch versions (those without a parent or with a parent that is active)
            query = query.filter(
                or_(
                    PromptVersion.parent_version_id.is_(None),
                    PromptVersion.parent_version_id.in_(
                        self.db.query(PromptVersion.id).filter(
                            PromptVersion.prompt_id == prompt_id,
                            PromptVersion.is_active == True
                        )
                    )
                )
            )
        
        prompt_versions = query.order_by(PromptVersion.created_at.desc()).limit(limit).all()
        
        return [PromptVersion.from_orm(version) for version in prompt_versions]

    async def tag_version(self, prompt_id: str, version_id: str, tag: str) -> PromptVersion:
        """Add a tag to a specific version"""
        version = self.db.query(PromptVersion).filter(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        if not version:
            raise ValueError("Version not found")
        
        # Add tag if it doesn't exist
        if tag not in version.tags:
            version.tags.append(tag)
            self.db.commit()
            self.db.refresh(version)
        
        return PromptVersion.from_orm(version)

    async def compare_prompt_versions(self, prompt_id: str, version1_id: str, version2_id: str) -> dict:
        """Compare two versions of a prompt with advanced diff capabilities"""
        version1 = self.db.query(PromptVersion).filter(
            PromptVersion.id == version1_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        version2 = self.db.query(PromptVersion).filter(
            PromptVersion.id == version2_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        if not version1 or not version2:
            raise ValueError("One or both versions not found")
        
        # Detailed comparison with diff
        differences = []
        
        snapshot1 = version1.content_snapshot
        snapshot2 = version2.content_snapshot
        
        # Compare top-level fields
        all_keys = set(snapshot1.keys()) | set(snapshot2.keys())
        for key in all_keys:
            val1 = snapshot1.get(key)
            val2 = snapshot2.get(key)
            
            if val1 != val2:
                diff_type = "modified"
                if val1 is None:
                    diff_type = "added"
                elif val2 is None:
                    diff_type = "removed"
                
                # For complex fields like messages, create detailed diff
                diff_content = None
                if key == "messages" and isinstance(val1, list) and isinstance(val2, list):
                    diff_content = self._diff_messages(val1, val2)
                elif key == "parameters" and isinstance(val1, dict) and isinstance(val2, dict):
                    diff_content = self._diff_parameters(val1, val2)
                elif key == "input_variables" and isinstance(val1, dict) and isinstance(val2, dict):
                    diff_content = self._diff_input_variables(val1, val2)
                elif isinstance(val1, str) and isinstance(val2, str):
                    diff_content = list(difflib.unified_diff(
                        val1.splitlines(keepends=True),
                        val2.splitlines(keepends=True),
                        fromfile=f'version-{version1.version}',
                        tofile=f'version-{version2.version}'
                    ))
                
                differences.append({
                    "field": key,
                    "version1": val1,
                    "version2": val2,
                    "type": diff_type,
                    "diff": diff_content
                })
        
        # Generate field-level statistics
        field_stats = self._generate_field_statistics(differences)
        
        return {
            "version_a": {
                "id": version1.id,
                "version": version1.version,
                "created_at": version1.created_at.isoformat(),
                "content": snapshot1,
                "tags": version1.tags
            },
            "version_b": {
                "id": version2.id,
                "version": version2.version,
                "created_at": version2.created_at.isoformat(),
                "content": snapshot2,
                "tags": version2.tags
            },
            "differences": differences,
            "summary": {
                "total_changes": len(differences),
                "added_fields": len([d for d in differences if d["type"] == "added"]),
                "removed_fields": len([d for d in differences if d["type"] == "removed"]),
                "modified_fields": len([d for d in differences if d["type"] == "modified"]),
                "field_statistics": field_stats
            }
        }
    
    def _diff_messages(self, messages1: List[Dict], messages2: List[Dict]) -> List[Dict]:
        """Create detailed diff for messages array with enhanced visualization"""
        diffs = []
        
        # Convert messages to comparable format
        msg1_dict = {f"{msg.get('role', '')}-{i}": msg for i, msg in enumerate(messages1)}
        msg2_dict = {f"{msg.get('role', '')}-{i}": msg for i, msg in enumerate(messages2)}
        
        all_keys = set(msg1_dict.keys()) | set(msg2_dict.keys())
        
        for key in all_keys:
            msg1 = msg1_dict.get(key)
            msg2 = msg2_dict.get(key)
            
            if msg1 != msg2:
                diff_type = "modified"
                if msg1 is None:
                    diff_type = "added"
                elif msg2 is None:
                    diff_type = "removed"
                
                # Create detailed diff for message content
                content_diff = None
                if msg1 and msg2 and msg1.get('content') and msg2.get('content'):
                    content_diff = list(difflib.unified_diff(
                        msg1['content'].splitlines(keepends=True),
                        msg2['content'].splitlines(keepends=True),
                        fromfile=f'message-{key}-version-{msg1.get("version", "1")}',
                        tofile=f'message-{key}-version-{msg2.get("version", "2")}'
                    ))
                
                diffs.append({
                    "index": key,
                    "version1": msg1,
                    "version2": msg2,
                    "type": diff_type,
                    "content_diff": content_diff
                })
        
        return diffs
    
    def _diff_parameters(self, params1: Dict, params2: Dict) -> List[Dict]:
        """Create detailed diff for parameters dictionary with enhanced visualization"""
        diffs = []
        
        all_keys = set(params1.keys()) | set(params2.keys())
        
        for key in all_keys:
            val1 = params1.get(key)
            val2 = params2.get(key)
            
            if val1 != val2:
                diff_type = "modified"
                if val1 is None:
                    diff_type = "added"
                elif val2 is None:
                    diff_type = "removed"
                
                diffs.append({
                    "key": key,
                    "version1": val1,
                    "version2": val2,
                    "type": diff_type
                })
        
        return diffs
    
    def _diff_input_variables(self, vars1: Dict, vars2: Dict) -> List[Dict]:
        """Create detailed diff for input variables dictionary with enhanced visualization"""
        diffs = []
        
        all_keys = set(vars1.keys()) | set(vars2.keys())
        
        for key in all_keys:
            val1 = vars1.get(key)
            val2 = vars2.get(key)
            
            if val1 != val2:
                diff_type = "modified"
                if val1 is None:
                    diff_type = "added"
                elif val2 is None:
                    diff_type = "removed"
                
                diffs.append({
                    "key": key,
                    "version1": val1,
                    "version2": val2,
                    "type": diff_type
                })
        
        return diffs
    
    def _generate_field_statistics(self, differences: List[Dict]) -> Dict[str, Any]:
        """Generate statistics about field changes"""
        stats = {
            "messages": {"added": 0, "modified": 0, "removed": 0},
            "parameters": {"added": 0, "modified": 0, "removed": 0},
            "input_variables": {"added": 0, "modified": 0, "removed": 0},
            "other_fields": {"added": 0, "modified": 0, "removed": 0}
        }
        
        for diff in differences:
            field = diff["field"]
            
            if field == "messages":
                stats["messages"][diff["type"]] += 1
            elif field == "parameters":
                stats["parameters"][diff["type"]] += 1
            elif field == "input_variables":
                stats["input_variables"][diff["type"]] += 1
            else:
                stats["other_fields"][diff["type"]] += 1
        
        return stats
    
    def increment_version(self, current_version: str) -> str:
        """Increment version number"""
        try:
            parts = current_version.split('.')
            if len(parts) >= 3:
                major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
                return f"{major}.{minor}.{patch + 1}"
            else:
                return f"{current_version}.1"
        except (ValueError, IndexError):
            return "1.0.1"
    
    async def get_prompt_version(self, prompt_id: str, version_id: str) -> Optional[PromptResponse]:
        """Get a specific version of a prompt"""
        version = self.db.query(PromptVersion).filter(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        if not version:
            return None
            
        # Return the prompt snapshot from this version
        return PromptResponse(**version.content_snapshot)
    
    async def restore_prompt_version(self, prompt_id: str, version_id: str, user_id: str) -> Optional[PromptResponse]:
        """Restore a prompt to a specific version"""
        version = self.db.query(PromptVersion).filter(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt_id
        ).first()
        
        if not version:
            return None
        
        # Get the current prompt
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return None
            
        # Store current version as a backup
        old_version = prompt.version
        await self.create_version(prompt_id, old_version, f"Backup before restoring version {version.version}", user_id)
        
        # Restore the prompt from the version snapshot
        snapshot = version.content_snapshot
        for key, value in snapshot.items():
            if hasattr(prompt, key) and key not in ['id', 'created_at']:
                setattr(prompt, key, value)
        
        prompt.updated_at = datetime.utcnow()
        prompt.version = version.version
        
        self.db.commit()
        self.db.refresh(prompt)
        
        # Log action
        self.log_action(user_id, "restore", "prompt_version", prompt_id, {
            "restored_version": version.version,
            "from_version": old_version
        })
        
        logger.info(f"Restored prompt {prompt_id} to version {version.version}")
        return PromptResponse.from_orm(prompt)

class PipelineService:
    """Service for pipeline management operations"""
    
    # Similar implementation pattern for pipelines...
    pass

class AnalyticsService(BaseService):
    """Service for analytics and metrics"""
    
    async def get_usage_metrics(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get usage metrics with filtering"""
        
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
    """Service for settings management"""
    
    async def get_setting(self, key: str) -> Optional[Dict[str, Any]]:
        """Get setting by key"""
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
        """Update or create setting"""
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
        self.log_action(user_id, "update_setting", "setting", setting.id, {
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
    """Service for LLM provider integrations"""

    def __init__(self):
        self.providers = {}

    async def execute_prompt(self, prompt, variables: Dict[str, Any], parameters: Dict[str, Any]):
        """Execute prompt with LLM provider"""

        # Compile prompt with variables
        compiled_messages = []
        for msg in prompt.messages:
            content = msg['content']
            for var, value in variables.items():
                content = content.replace(f"{{{var}}}", str(value))
            compiled_messages.append({
                'role': msg['role'],
                'content': content
            })

        # Get provider
        provider = self.get_provider(prompt.model_provider)
        if not provider:
            raise LLMProviderError(f"Provider {prompt.model_provider} not available")

        # Execute with provider
        result = await provider.execute(
            model=prompt.model_name,
            messages=compiled_messages,
            parameters=parameters
        )

        return result

    def get_provider(self, provider_name: str):
        """Get LLM provider instance"""
        # Implementation would return appropriate provider
        # (OpenAI, Anthropic, etc.)
        return None

# Define LLMService class inline
class LLMService:
    """Service for LLM provider integrations"""

    def __init__(self):
        self.providers = {}

    async def execute_prompt(self, prompt, variables: Dict[str, Any], parameters: Dict[str, Any]):
        """Execute prompt with LLM provider"""

        # Compile prompt with variables
        compiled_messages = []
        for msg in prompt.messages:
            content = msg['content']
            for var, value in variables.items():
                content = content.replace(f"{{{var}}}", str(value))
            compiled_messages.append({
                'role': msg['role'],
                'content': content
            })

        # Get provider
        provider = self.get_provider(prompt.model_provider)
        if not provider:
            raise LLMProviderError(f"Provider {prompt.model_provider} not available")

        # Execute with provider
        result = await provider.execute(
            model=prompt.model_name,
            messages=compiled_messages,
            parameters=parameters
        )

        return result

    def get_provider(self, provider_name: str):
        """Get LLM provider instance"""
        # Implementation would return appropriate provider
        # (OpenAI, Anthropic, etc.)
        return None

class StorageService:
    """Service for file storage operations"""
    
    def __init__(self):
        self.storage_backends = {}
    
    async def store_file(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Store file and return URL"""
        # Implementation for file storage
        pass
    
    async def get_file(self, file_id: str) -> bytes:
        """Retrieve file by ID"""
        # Implementation for file retrieval
        pass
