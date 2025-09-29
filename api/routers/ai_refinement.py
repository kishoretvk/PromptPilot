from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, List, Any
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from typing import Dict, List, Any
from pydantic import BaseModel, Field

from api.services.ai_refinement_service import AutomatedRefinementService
from api.database.config import DatabaseManager
from api.database.models import Prompt
from api import get_db
from sqlalchemy.orm import Session
from api.tasks import run_refinement_task

router = APIRouter(
    prefix="/api/v1",
    tags=["AI Refinement"]
)

class OptimizeRequest(BaseModel):
    task_description: str = Field(..., max_length=1000, description="User's task description for context")
    max_iterations: Optional[int] = Field(3, ge=1, le=5, description="Number of refinement iterations")

@router.post("/prompts/{prompt_id}/optimize")
async def optimize_prompt(
    prompt_id: str,
    request_data: OptimizeRequest,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None,
    refinement_service = Depends(lambda: AutomatedRefinementService(
        model_provider_service=None,  # Placeholder, inject properly if available
        validation_service=None,  # Placeholder
        testing_service=None,  # Placeholder
        max_iterations=request_data.max_iterations
    ))
):
    """Optimize a prompt using AI refinement service (async)"""
    # Fetch prompt from DB
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # Get prompt data for refinement
    prompt_data = {
        "id": str(prompt.id),
        "name": prompt.name,
        "content": "\n".join([m.content for m in prompt.messages]) if prompt.messages else request_data.task_description,
        # Add other fields as needed
    }
    
    # Queue async refinement task
    background_tasks.add_task(run_refinement_task.delay, str(prompt_id), request_data.task_description, request_data.max_iterations)
    
    # Return immediate response
    return {
        "status": "accepted",
        "message": "Optimization task queued for processing",
        "data": {
            "task_id": f"refine-{prompt_id}-{uuid.uuid4().hex[:8]}",
            "estimated_time": "30-60 seconds"
        }
    }


from api.services.ai_refinement_service import auto_refine_prompt, run_ab_test
import uuid


@router.post("/optimize")
async def optimize(body: dict):
    return auto_refine_prompt(body['task_description'])


@router.post("/ab-test")
def ab_test(body: dict):
    return run_ab_test(body['original'], body['refined'])
