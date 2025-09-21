"""
Validation API Router

REST endpoints for automated prompt validation and quality checking.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel, Field

from api.services.validation_service import ValidationService

router = APIRouter(prefix="/api/validation", tags=["validation"])

# Dependency injection
def get_validation_service() -> ValidationService:
    return ValidationService()

class ValidationRequest(BaseModel):
    """Request model for prompt validation"""
    content: str = Field(..., description="Prompt content to validate")
    prompt_type: str = Field(default="general", description="Type of prompt (general, creative, analytical, etc.)")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context for validation")

class ValidationResponse(BaseModel):
    """Response model for validation results"""
    is_valid: bool = Field(..., description="Whether the prompt passes validation")
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Overall validation score")
    issues: List[Dict[str, Any]] = Field(default_factory=list, description="List of validation issues")
    passed_checks: List[str] = Field(default_factory=list, description="Checks that passed")
    failed_checks: List[str] = Field(default_factory=list, description="Checks that failed")
    recommendations: List[str] = Field(default_factory=list, description="Improvement recommendations")
    processing_time: float = Field(..., description="Time taken to validate")

class ValidationStats(BaseModel):
    """Validation statistics"""
    total_validations: int = Field(..., description="Total validations performed")
    average_score: float = Field(..., description="Average validation score")
    common_issues: List[Dict[str, Any]] = Field(default_factory=list, description="Most common validation issues")
    validation_types: Dict[str, int] = Field(default_factory=dict, description="Validation counts by type")

@router.post("/validate", response_model=ValidationResponse)
async def validate_prompt(
    request: ValidationRequest,
    validation_service: ValidationService = Depends(get_validation_service)
) -> ValidationResponse:
    """
    Validate a prompt for quality, clarity, and best practices.

    Performs comprehensive automated checking including:
    - Clarity and specificity analysis
    - Safety and bias detection
    - Best practice compliance
    - Potential issue identification
    """
    try:
        import time
        start_time = time.time()

        # Prepare prompt data for validation
        prompt_data = {
            "content": request.content,
            "type": request.prompt_type,
            "context": request.context
        }

        # Perform validation
        result = await validation_service.validate_prompt(prompt_data)

        processing_time = time.time() - start_time

        # Convert ValidationResult to response format
        return ValidationResponse(
            is_valid=result.is_valid,
            overall_score=result.overall_score,
            issues=[issue.dict() for issue in result.issues],
            passed_checks=result.passed_checks,
            failed_checks=result.failed_checks,
            recommendations=result.recommendations,
            processing_time=processing_time
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.post("/validate/batch", response_model=List[ValidationResponse])
async def validate_prompts_batch(
    requests: List[ValidationRequest],
    validation_service: ValidationService = Depends(get_validation_service)
) -> List[ValidationResponse]:
    """
    Validate multiple prompts in batch.

    Useful for validating prompt collections or testing multiple variations.
    """
    try:
        import time
        results = []

        for request in requests:
            start_time = time.time()

            prompt_data = {
                "content": request.content,
                "type": request.prompt_type,
                "context": request.context
            }

            result = await validation_service.validate_prompt(prompt_data)
            processing_time = time.time() - start_time

            results.append(ValidationResponse(
                is_valid=result.is_valid,
                overall_score=result.overall_score,
                issues=[issue.dict() for issue in result.issues],
                passed_checks=result.passed_checks,
                failed_checks=result.failed_checks,
                recommendations=result.recommendations,
                processing_time=processing_time
            ))

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch validation failed: {str(e)}")

@router.get("/rules")
async def get_validation_rules() -> Dict[str, Any]:
    """
    Get information about available validation rules and checks.

    Returns details about all validation categories and their criteria.
    """
    try:
        rules = {
            "clarity": {
                "description": "Checks for clear, unambiguous instructions",
                "checks": ["instruction_clarity", "task_definition", "goal_specificity"]
            },
            "specificity": {
                "description": "Ensures prompts are specific and detailed",
                "checks": ["detail_level", "success_criteria", "constraint_definition"]
            },
            "safety": {
                "description": "Detects potential safety concerns and biases",
                "checks": ["bias_detection", "safety_concerns", "ethical_considerations"]
            },
            "best_practices": {
                "description": "Validates against prompt engineering best practices",
                "checks": ["structure_quality", "context_usage", "format_consistency"]
            },
            "potential_issues": {
                "description": "Identifies common problems and pitfalls",
                "checks": ["ambiguity_detection", "over_specification", "missing_context"]
            },
            "length_appropriateness": {
                "description": "Checks if prompt length is appropriate for the task",
                "checks": ["conciseness", "completeness", "information_density"]
            }
        }

        return {
            "validation_categories": rules,
            "total_categories": len(rules),
            "description": "Comprehensive prompt validation covering clarity, specificity, safety, and best practices"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve validation rules: {str(e)}")

@router.get("/stats", response_model=ValidationStats)
async def get_validation_stats(
    validation_service: ValidationService = Depends(get_validation_service)
) -> ValidationStats:
    """
    Get validation statistics and insights.

    Returns aggregated statistics about validation usage and common issues.
    """
    try:
        # In a real implementation, this would track actual usage
        # For now, return mock statistics
        return ValidationStats(
            total_validations=0,
            average_score=0.0,
            common_issues=[],
            validation_types={}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve validation stats: {str(e)}")

@router.post("/feedback")
async def submit_validation_feedback(
    feedback: Dict[str, Any]
) -> Dict[str, str]:
    """
    Submit feedback on validation results.

    Allows users to provide feedback on validation accuracy and usefulness.
    """
    try:
        # In a real implementation, this would store feedback for model improvement
        return {
            "status": "success",
            "message": "Feedback submitted successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")