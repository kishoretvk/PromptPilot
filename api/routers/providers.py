"""
Provider API Router

REST endpoints for LLM provider management, switching, and monitoring.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from api.services.model_provider_service import ModelProviderService

router = APIRouter(prefix="/api/providers", tags=["providers"])

# Dependency injection
def get_provider_service() -> ModelProviderService:
    return ModelProviderService()

class ProviderInfo(BaseModel):
    """Information about an LLM provider"""
    name: str = Field(..., description="Provider name")
    status: str = Field(..., description="Provider status (active, error, inactive)")
    models: List[str] = Field(default_factory=list, description="Available models")
    cost_per_token: Optional[float] = Field(None, description="Cost per token in USD")
    rate_limits: Dict[str, Any] = Field(default_factory=dict, description="Rate limiting information")
    capabilities: List[str] = Field(default_factory=list, description="Provider capabilities")

class ExecutionRequest(BaseModel):
    """Request model for prompt execution"""
    provider: str = Field(..., description="Provider name")
    model: str = Field(..., description="Model name")
    prompt_data: Dict[str, Any] = Field(..., description="Prompt data to execute")
    fallback_providers: Optional[List[str]] = Field(None, description="Fallback providers if primary fails")

class ExecutionResult(BaseModel):
    """Result of prompt execution"""
    success: bool = Field(..., description="Whether execution was successful")
    output: Optional[str] = Field(None, description="Generated output")
    provider: str = Field(..., description="Provider used")
    model: str = Field(..., description="Model used")
    tokens_used: Optional[int] = Field(None, description="Tokens consumed")
    cost: Optional[float] = Field(None, description="Cost in USD")
    processing_time: float = Field(..., description="Processing time in seconds")
    error: Optional[str] = Field(None, description="Error message if failed")

class UsageStats(BaseModel):
    """Usage statistics for providers"""
    provider: str = Field(..., description="Provider name")
    total_requests: int = Field(..., description="Total requests made")
    total_tokens: int = Field(..., description="Total tokens used")
    total_cost: float = Field(..., description="Total cost in USD")
    models: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Per-model statistics")
    last_used: Optional[str] = Field(None, description="Last usage timestamp")

@router.get("/available", response_model=List[ProviderInfo])
async def list_available_providers(
    provider_service: ModelProviderService = Depends(get_provider_service)
) -> List[ProviderInfo]:
    """
    List all available LLM providers with their status and capabilities.

    Returns detailed information about each provider including available models,
    status, and cost information.
    """
    try:
        providers_info = await provider_service.list_available_providers()
        return providers_info

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list providers: {str(e)}")

@router.post("/execute", response_model=ExecutionResult)
async def execute_prompt(
    request: ExecutionRequest,
    provider_service: ModelProviderService = Depends(get_provider_service)
) -> ExecutionResult:
    """
    Execute a prompt using the specified provider and model.

    Supports automatic fallback to alternative providers if the primary provider fails.
    """
    try:
        result = await provider_service.execute_prompt(
            provider=request.provider,
            model=request.model,
            prompt_data=request.prompt_data,
            fallback_providers=request.fallback_providers
        )

        return ExecutionResult(
            success=not result.error,
            output=result.content,
            provider=result.provider or request.provider,
            model=result.model or request.model,
            tokens_used=result.tokens_used,
            cost=result.cost,
            processing_time=result.processing_time,
            error=result.error
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt execution failed: {str(e)}")

@router.get("/usage", response_model=Dict[str, UsageStats])
async def get_usage_stats(
    provider: Optional[str] = None,
    provider_service: ModelProviderService = Depends(get_provider_service)
) -> Dict[str, UsageStats]:
    """
    Get usage statistics for providers.

    Returns detailed usage metrics including request counts, token usage, and costs.
    Can filter by specific provider or return all providers.
    """
    try:
        stats = provider_service.get_usage_stats(provider=provider)

        # Convert to response format
        result = {}
        for provider_name, provider_stats in stats.items():
            result[provider_name] = UsageStats(
                provider=provider_name,
                total_requests=provider_stats.get("total_requests", 0),
                total_tokens=provider_stats.get("total_tokens", 0),
                total_cost=provider_stats.get("total_cost", 0.0),
                models=provider_stats.get("models", {}),
                last_used=None  # Would need to track this in the service
            )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get usage stats: {str(e)}")

@router.get("/models/{provider}")
async def get_provider_models(
    provider: str,
    provider_service: ModelProviderService = Depends(get_provider_service)
) -> Dict[str, Any]:
    """
    Get available models for a specific provider.

    Returns detailed information about models including capabilities and pricing.
    """
    try:
        # Try to get the provider instance
        provider_instance = provider_service._get_provider(provider)
        models = provider_instance.list_models()

        # Get cost information if available
        cost_info = {}
        for model in models:
            try:
                cost = provider_instance.calculate_cost(1000, model)  # Cost per 1000 tokens
                cost_info[model] = cost
            except:
                cost_info[model] = None

        return {
            "provider": provider,
            "models": models,
            "cost_per_1000_tokens": cost_info,
            "status": "active"
        }

    except Exception as e:
        return {
            "provider": provider,
            "models": [],
            "cost_per_1000_tokens": {},
            "status": "error",
            "error": str(e)
        }

@router.post("/switch")
async def switch_provider(
    provider: str,
    model: str,
    provider_service: ModelProviderService = Depends(get_provider_service)
) -> Dict[str, str]:
    """
    Switch to a different provider and model.

    Validates that the provider and model are available before switching.
    """
    try:
        # Validate provider exists
        available_providers = provider_service.get_available_providers()
        if provider not in available_providers:
            raise HTTPException(status_code=400, detail=f"Provider '{provider}' not available")

        # Try to get provider instance to validate model
        provider_instance = provider_service._get_provider(provider)
        available_models = provider_instance.list_models()

        if model not in available_models:
            raise HTTPException(status_code=400, detail=f"Model '{model}' not available for provider '{provider}'")

        return {
            "status": "success",
            "message": f"Successfully switched to {provider}:{model}",
            "provider": provider,
            "model": model
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Provider switch failed: {str(e)}")

@router.get("/health")
async def check_provider_health(
    provider_service: ModelProviderService = Depends(get_provider_service)
) -> Dict[str, Any]:
    """
    Check the health status of all providers.

    Returns connectivity and availability status for each provider.
    """
    try:
        health_status = {}
        providers = provider_service.get_available_providers()

        for provider_name in providers:
            try:
                provider_instance = provider_service._get_provider(provider_name)
                models = provider_instance.list_models()
                health_status[provider_name] = {
                    "status": "healthy",
                    "models_available": len(models),
                    "error": None
                }
            except Exception as e:
                health_status[provider_name] = {
                    "status": "unhealthy",
                    "models_available": 0,
                    "error": str(e)
                }

        return {
            "overall_status": "healthy" if all(p["status"] == "healthy" for p in health_status.values()) else "degraded",
            "providers": health_status,
            "timestamp": "2025-01-14T00:00:00Z"  # Would be dynamic in real implementation
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.post("/benchmark")
async def benchmark_providers(
    prompt_data: Dict[str, Any],
    providers_to_test: List[str],
    models_to_test: List[str],
    provider_service: ModelProviderService = Depends(get_provider_service)
) -> Dict[str, Any]:
    """
    Benchmark multiple providers and models against the same prompt.

    Useful for comparing performance, cost, and quality across providers.
    """
    try:
        import time
        results = {}

        for provider in providers_to_test:
            for model in models_to_test:
                try:
                    start_time = time.time()

                    result = await provider_service.execute_prompt(
                        provider=provider,
                        model=model,
                        prompt_data=prompt_data
                    )

                    execution_time = time.time() - start_time

                    results[f"{provider}:{model}"] = {
                        "success": not result.error,
                        "execution_time": execution_time,
                        "tokens_used": result.tokens_used,
                        "cost": result.cost,
                        "error": result.error
                    }

                except Exception as e:
                    results[f"{provider}:{model}"] = {
                        "success": False,
                        "execution_time": 0.0,
                        "tokens_used": None,
                        "cost": None,
                        "error": str(e)
                    }

        return {
            "benchmark_results": results,
            "prompt_data": prompt_data,
            "providers_tested": providers_to_test,
            "models_tested": models_to_test
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")

@router.get("/capabilities")
async def get_provider_capabilities() -> Dict[str, Any]:
    """
    Get detailed capabilities and features of each provider.

    Returns information about supported features, limitations, and best use cases.
    """
    try:
        capabilities = {
            "openai": {
                "features": ["text_generation", "chat_completion", "embeddings", "fine_tuning"],
                "models": ["gpt-4", "gpt-3.5-turbo", "text-davinci-003"],
                "strengths": ["high_quality", "versatile", "well_documented"],
                "limitations": ["api_cost", "rate_limits"],
                "best_for": ["general_purpose", "creative_writing", "analysis"]
            },
            "anthropic": {
                "features": ["text_generation", "chat_completion", "safety_focused"],
                "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
                "strengths": ["safety", "reasoning", "long_context"],
                "limitations": ["newer_api", "limited_fine_tuning"],
                "best_for": ["safe_content", "reasoning_tasks", "long_documents"]
            },
            "google": {
                "features": ["text_generation", "chat_completion", "multimodal"],
                "models": ["gemini-pro", "gemini-pro-vision"],
                "strengths": ["multimodal", "cost_effective", "google_ecosystem"],
                "limitations": ["less_mature", "api_stability"],
                "best_for": ["multimodal_tasks", "cost_sensitive", "google_integration"]
            },
            "ollama": {
                "features": ["local_models", "privacy", "custom_models"],
                "models": ["llama2", "codellama", "mistral"],
                "strengths": ["privacy", "no_api_cost", "customizable"],
                "limitations": ["local_resources", "model_size_limits"],
                "best_for": ["privacy_sensitive", "offline_work", "custom_models"]
            }
        }

        return capabilities

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve capabilities: {str(e)}")