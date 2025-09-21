"""
Testing API Router

REST endpoints for A/B testing, statistical analysis, and example generation.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from api.services.testing_service import TestingService
from api.services.model_provider_service import ModelProviderService

router = APIRouter(prefix="/api/testing", tags=["testing"])

# Dependency injection
def get_testing_service() -> TestingService:
    model_provider = ModelProviderService()
    return TestingService(model_provider)

class TestCaseRequest(BaseModel):
    """Request model for test case generation"""
    prompt_data: Dict[str, Any] = Field(..., description="Prompt data to generate test cases for")
    count: int = Field(default=10, ge=1, le=50, description="Number of test cases to generate")

class ABTestRequest(BaseModel):
    """Request model for A/B testing"""
    prompt_a: Dict[str, Any] = Field(..., description="First prompt to test")
    prompt_b: Dict[str, Any] = Field(..., description="Second prompt to test")
    test_cases: List[Dict[str, Any]] = Field(..., description="Test cases to run")
    significance_level: float = Field(default=0.05, ge=0.01, le=0.1, description="Statistical significance threshold")

class TestResult(BaseModel):
    """Individual test result"""
    test_case_id: str = Field(..., description="Test case identifier")
    prompt_version: str = Field(..., description="Which prompt version (A or B)")
    output: str = Field(..., description="Generated output")
    processing_time: float = Field(..., description="Time to generate output")
    quality_score: Optional[float] = Field(None, description="Automated quality score")
    custom_metrics: Dict[str, Any] = Field(default_factory=dict, description="Custom evaluation metrics")

class ABTestResult(BaseModel):
    """Results of an A/B test comparison"""
    test_id: str = Field(..., description="Unique test identifier")
    prompt_a_results: List[TestResult] = Field(..., description="Results for prompt A")
    prompt_b_results: List[TestResult] = Field(..., description="Results for prompt B")
    statistical_analysis: Dict[str, Any] = Field(..., description="Statistical analysis results")
    winner: Optional[str] = Field(None, description="Winning prompt (A, B, or tie)")
    confidence_level: float = Field(..., description="Confidence level of the result")
    effect_size: Optional[float] = Field(None, description="Effect size of the difference")
    recommendations: List[str] = Field(default_factory=list, description="Test recommendations")
    execution_time: float = Field(..., description="Total execution time")

class RefinementExample(BaseModel):
    """Example showing before/after refinement improvements"""
    type: str = Field(..., description="Type of improvement (clarity, specificity, etc.)")
    title: str = Field(..., description="Example title")
    original_prompt: str = Field(..., description="Original prompt text")
    refined_prompt: str = Field(..., description="Refined prompt text")
    improvement_description: str = Field(..., description="Description of the improvement")
    performance_metrics: Dict[str, Any] = Field(default_factory=dict, description="Performance comparison metrics")

class ValidationRequest(BaseModel):
    """Request model for refinement validation"""
    original_prompt: Dict[str, Any] = Field(..., description="Original prompt")
    refined_prompt: Dict[str, Any] = Field(..., description="Refined prompt")
    test_sample_size: int = Field(default=20, ge=10, le=100, description="Number of test cases to validate with")

@router.post("/generate-test-cases", response_model=List[Dict[str, Any]])
async def generate_test_cases(
    request: TestCaseRequest,
    testing_service: TestingService = Depends(get_testing_service)
) -> List[Dict[str, Any]]:
    """
    Generate diverse test cases for prompt evaluation.

    Creates varied test scenarios to comprehensively evaluate prompt performance.
    """
    try:
        test_cases = await testing_service.generate_test_cases(
            prompt_data=request.prompt_data,
            count=request.count
        )

        # Convert TestCase objects to dictionaries
        return [test_case.dict() for test_case in test_cases]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test case generation failed: {str(e)}")

@router.post("/ab-test", response_model=ABTestResult)
async def run_ab_test(
    request: ABTestRequest,
    testing_service: TestingService = Depends(get_testing_service)
) -> ABTestResult:
    """
    Execute an A/B test comparing two prompts.

    Runs both prompts against test cases and performs statistical analysis
    to determine which prompt performs better.
    """
    try:
        # Convert dictionaries to TestCase objects
        from api.services.testing_service import TestCase
        test_cases = [TestCase(**tc) for tc in request.test_cases]

        result = await testing_service.run_ab_test(
            prompt_a=request.prompt_a,
            prompt_b=request.prompt_b,
            test_cases=test_cases,
            significance_level=request.significance_level
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"A/B test failed: {str(e)}")

@router.post("/validate-refinement", response_model=ABTestResult)
async def validate_refinement_success(
    request: ValidationRequest,
    testing_service: TestingService = Depends(get_testing_service)
) -> ABTestResult:
    """
    Validate that automated refinement actually improved the prompt.

    Performs A/B testing to confirm refinement quality improvements.
    """
    try:
        result = await testing_service.validate_refinement_success(
            original_prompt=request.original_prompt,
            refined_prompt=request.refined_prompt
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement validation failed: {str(e)}")

@router.post("/generate-examples", response_model=List[RefinementExample])
async def generate_refinement_examples(
    original_prompt: Dict[str, Any],
    refined_prompt: Dict[str, Any],
    test_results: Optional[ABTestResult] = None,
    testing_service: TestingService = Depends(get_testing_service)
) -> List[RefinementExample]:
    """
    Generate exactly 2 examples showing before/after refinement improvements.

    Creates concrete examples demonstrating specific improvements made during refinement.
    """
    try:
        examples = await testing_service.generate_refinement_examples(
            original_prompt=original_prompt,
            refined_prompt=refined_prompt,
            test_results=test_results
        )

        return examples

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Example generation failed: {str(e)}")

@router.get("/stats")
async def get_testing_stats(
    testing_service: TestingService = Depends(get_testing_service)
) -> Dict[str, Any]:
    """
    Get testing statistics and insights.

    Returns aggregated statistics about A/B testing usage and performance.
    """
    try:
        # In a real implementation, this would track actual usage
        # For now, return mock statistics
        return {
            "total_tests": 0,
            "average_execution_time": 0.0,
            "success_rate": 0.0,
            "common_test_types": [],
            "statistical_insights": {
                "typical_significance_level": 0.05,
                "average_effect_size": 0.0,
                "winner_distribution": {"A": 0, "B": 0, "tie": 0}
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve testing stats: {str(e)}")

@router.post("/feedback")
async def submit_test_feedback(
    feedback: Dict[str, Any]
) -> Dict[str, str]:
    """
    Submit feedback on test results and statistical analysis.

    Allows users to provide feedback on test accuracy and usefulness.
    """
    try:
        # In a real implementation, this would store feedback for improvement
        return {
            "status": "success",
            "message": "Test feedback submitted successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit test feedback: {str(e)}")

@router.get("/methodology")
async def get_testing_methodology() -> Dict[str, Any]:
    """
    Get information about A/B testing methodology and statistical analysis.

    Returns details about testing approach, statistical methods, and best practices.
    """
    try:
        methodology = {
            "ab_testing": {
                "description": "A/B testing compares two prompt versions against identical test cases",
                "methodology": "Randomized controlled trials with statistical significance testing",
                "metrics": ["quality_score", "processing_time", "custom_metrics"]
            },
            "statistical_analysis": {
                "significance_tests": ["t-test", "mann-whitney-u"],
                "effect_size": "Cohen's d calculation",
                "confidence_intervals": "95% confidence intervals",
                "power_analysis": "Statistical power calculations"
            },
            "validation_criteria": {
                "minimum_sample_size": 10,
                "significance_threshold": 0.05,
                "effect_size_threshold": 0.2,
                "reliability_checks": ["test-retest", "internal_consistency"]
            },
            "example_generation": {
                "examples_per_refinement": 2,
                "example_types": ["clarity_improvement", "performance_enhancement"],
                "validation_requirements": "Statistical significance required"
            }
        }

        return methodology

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve testing methodology: {str(e)}")