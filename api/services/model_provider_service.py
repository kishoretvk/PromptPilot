"""
Model Provider Service

Unified interface for multiple LLM providers (OpenAI, Anthropic, Google, Ollama).
Handles provider switching, usage tracking, and error handling.
"""

from typing import Dict, List, Any, Optional, Union
from abc import ABC, abstractmethod
import asyncio
import logging
from datetime import datetime
import time

from pydantic import BaseModel, Field
import openai
import anthropic
import google.generativeai as genai
import ollama

from api.config import settings

logger = logging.getLogger(__name__)


class ProviderInfo(BaseModel):
    """Information about an LLM provider"""
    name: str = Field(..., description="Provider name")
    models: List[str] = Field(..., description="Available models")
    status: str = Field(..., description="Provider status (active, inactive, error)")
    cost_per_token: Optional[float] = Field(None, description="Cost per token in USD")


class ExecutionResult(BaseModel):
    """Result of prompt execution"""
    content: str = Field(..., description="Generated content")
    provider: str = Field(..., description="Provider used")
    model: str = Field(..., description="Model used")
    tokens_used: Optional[int] = Field(None, description="Tokens consumed")
    cost: Optional[float] = Field(None, description="Cost in USD")
    processing_time: float = Field(..., description="Processing time in seconds")
    error: Optional[str] = Field(None, description="Error message if failed")


class BaseProvider(ABC):
    """Base class for LLM providers"""

    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"{__name__}.{name}")

    @abstractmethod
    async def execute(self, model: str, prompt_data: Dict[str, Any]) -> ExecutionResult:
        """Execute a prompt using this provider"""
        pass

    @abstractmethod
    def list_models(self) -> List[str]:
        """List available models for this provider"""
        pass

    def calculate_cost(self, tokens: int, model: str) -> float:
        """Calculate cost for token usage"""
        # Default implementation - override in subclasses for actual pricing
        return 0.0


class OpenAIProvider(BaseProvider):
    """OpenAI API provider"""

    def __init__(self):
        super().__init__("openai")
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def execute(self, model: str, prompt_data: Dict[str, Any]) -> ExecutionResult:
        start_time = time.time()

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt_data["content"]}],
                temperature=prompt_data.get("temperature", 0.7),
                max_tokens=prompt_data.get("max_tokens", 1000),
            )

            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            cost = self.calculate_cost(tokens_used or 0, model) if tokens_used else None

            return ExecutionResult(
                content=content,
                provider=self.name,
                model=model,
                tokens_used=tokens_used,
                cost=cost,
                processing_time=time.time() - start_time
            )

        except Exception as e:
            self.logger.error(f"OpenAI execution failed: {str(e)}")
            return ExecutionResult(
                content="",
                provider=self.name,
                model=model,
                processing_time=time.time() - start_time,
                error=str(e)
            )

    def list_models(self) -> List[str]:
        return ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]

    def calculate_cost(self, tokens: int, model: str) -> float:
        # Simplified pricing - update with actual rates
        rates = {
            "gpt-4": 0.03,
            "gpt-4-turbo": 0.01,
            "gpt-3.5-turbo": 0.002
        }
        return tokens * rates.get(model, 0.01) / 1000


class AnthropicProvider(BaseProvider):
    """Anthropic Claude provider"""

    def __init__(self):
        super().__init__("anthropic")
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def execute(self, model: str, prompt_data: Dict[str, Any]) -> ExecutionResult:
        start_time = time.time()

        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=prompt_data.get("max_tokens", 1000),
                temperature=prompt_data.get("temperature", 0.7),
                messages=[{"role": "user", "content": prompt_data["content"]}]
            )

            content = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            cost = self.calculate_cost(tokens_used, model)

            return ExecutionResult(
                content=content,
                provider=self.name,
                model=model,
                tokens_used=tokens_used,
                cost=cost,
                processing_time=time.time() - start_time
            )

        except Exception as e:
            self.logger.error(f"Anthropic execution failed: {str(e)}")
            return ExecutionResult(
                content="",
                provider=self.name,
                model=model,
                processing_time=time.time() - start_time,
                error=str(e)
            )

    def list_models(self) -> List[str]:
        return ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]

    def calculate_cost(self, tokens: int, model: str) -> float:
        # Simplified pricing
        rates = {
            "claude-3-opus-20240229": 0.015,
            "claude-3-sonnet-20240229": 0.008,
            "claude-3-haiku-20240307": 0.0025
        }
        return tokens * rates.get(model, 0.01) / 1000


class GoogleProvider(BaseProvider):
    """Google Gemini provider"""

    def __init__(self):
        super().__init__("google")
        genai.configure(api_key=settings.GOOGLE_API_KEY)

    async def execute(self, model: str, prompt_data: Dict[str, Any]) -> ExecutionResult:
        start_time = time.time()

        try:
            model_instance = genai.GenerativeModel(model)
            response = await model_instance.generate_content_async(
                prompt_data["content"],
                generation_config=genai.types.GenerationConfig(
                    temperature=prompt_data.get("temperature", 0.7),
                    max_output_tokens=prompt_data.get("max_tokens", 1000),
                )
            )

            content = response.text
            # Gemini doesn't provide token counts easily, estimate
            tokens_used = len(prompt_data["content"].split()) + len(content.split())
            cost = self.calculate_cost(tokens_used, model)

            return ExecutionResult(
                content=content,
                provider=self.name,
                model=model,
                tokens_used=tokens_used,
                cost=cost,
                processing_time=time.time() - start_time
            )

        except Exception as e:
            self.logger.error(f"Google execution failed: {str(e)}")
            return ExecutionResult(
                content="",
                provider=self.name,
                model=model,
                processing_time=time.time() - start_time,
                error=str(e)
            )

    def list_models(self) -> List[str]:
        return ["gemini-pro", "gemini-pro-vision"]

    def calculate_cost(self, tokens: int, model: str) -> float:
        # Simplified pricing
        rates = {
            "gemini-pro": 0.001,
            "gemini-pro-vision": 0.002
        }
        return tokens * rates.get(model, 0.001) / 1000


class OllamaProvider(BaseProvider):
    """Ollama local provider"""

    def __init__(self):
        super().__init__("ollama")

    async def execute(self, model: str, prompt_data: Dict[str, Any]) -> ExecutionResult:
        start_time = time.time()

        try:
            response = await ollama.AsyncClient().generate(
                model=model,
                prompt=prompt_data["content"],
                options={
                    "temperature": prompt_data.get("temperature", 0.7),
                    "num_predict": prompt_data.get("max_tokens", 1000),
                }
            )

            content = response["response"]
            tokens_used = None  # Ollama doesn't provide token counts
            cost = 0.0  # Local, no cost

            return ExecutionResult(
                content=content,
                provider=self.name,
                model=model,
                tokens_used=tokens_used,
                cost=cost,
                processing_time=time.time() - start_time
            )

        except Exception as e:
            self.logger.error(f"Ollama execution failed: {str(e)}")
            return ExecutionResult(
                content="",
                provider=self.name,
                model=model,
                processing_time=time.time() - start_time,
                error=str(e)
            )

    def list_models(self) -> List[str]:
        # This would ideally query Ollama for available models
        return ["llama2", "codellama", "mistral", "vicuna"]


class ModelProviderService:
    """
    Unified service for managing multiple LLM providers.

    Provides a single interface for executing prompts across different providers,
    with automatic fallback, usage tracking, and cost monitoring.
    """

    def __init__(self):
        self.providers = {}
        self.usage_stats = {}
        self.logger = logging.getLogger(__name__)

    def _get_provider(self, provider_name: str):
        """Lazy initialization of providers"""
        if provider_name not in self.providers:
            if provider_name == "openai":
                self.providers[provider_name] = OpenAIProvider()
            elif provider_name == "anthropic":
                self.providers[provider_name] = AnthropicProvider()
            elif provider_name == "google":
                self.providers[provider_name] = GoogleProvider()
            elif provider_name == "ollama":
                self.providers[provider_name] = OllamaProvider()
            else:
                raise ValueError(f"Unknown provider: {provider_name}")
        return self.providers[provider_name]

    async def execute_prompt(
        self,
        provider: str,
        model: str,
        prompt_data: Dict[str, Any],
        fallback_providers: Optional[List[str]] = None
    ) -> ExecutionResult:
        """
        Execute a prompt using the specified provider and model.

        Args:
            provider: Preferred provider name
            model: Model name
            prompt_data: Prompt data including content and parameters
            fallback_providers: List of fallback providers if primary fails

        Returns:
            ExecutionResult with content and metadata
        """
        providers_to_try = [provider] + (fallback_providers or [])

        for current_provider in providers_to_try:
            try:
                provider_instance = self._get_provider(current_provider)
                self.logger.info(f"Executing prompt with {current_provider}:{model}")
                result = await provider_instance.execute(model, prompt_data)

                if not result.error:
                    # Track usage
                    self._track_usage(current_provider, model, result)
                    return result
                else:
                    self.logger.warning(f"Provider {current_provider} failed: {result.error}")

            except Exception as e:
                self.logger.error(f"Provider {current_provider} error: {str(e)}")
                continue

        # All providers failed
        return ExecutionResult(
            content="",
            provider=provider,
            model=model,
            processing_time=0.0,
            error="All providers failed"
        )

    async def list_available_providers(self) -> List[ProviderInfo]:
        """List all available providers with their status and models"""
        providers_info = []
        provider_names = ["openai", "anthropic", "google", "ollama"]

        for name in provider_names:
            try:
                provider = self._get_provider(name)
                models = provider.list_models()
                status = "active"
            except Exception as e:
                self.logger.error(f"Failed to get info for provider {name}: {str(e)}")
                models = []
                status = "error"

            providers_info.append(ProviderInfo(
                name=name,
                models=models,
                status=status,
                cost_per_token=None  # Could be added per model
            ))

        return providers_info

    async def get_usage_stats(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get usage statistics, optionally filtered by provider"""
        if provider:
            return self.usage_stats.get(provider, {})

        return self.usage_stats

    def get_available_providers(self) -> List[str]:
        """Get list of available provider names"""
        return ["openai", "anthropic", "google", "ollama"]

    def _track_usage(self, provider: str, model: str, result: ExecutionResult):
        """Track usage statistics"""
        if provider not in self.usage_stats:
            self.usage_stats[provider] = {
                "total_requests": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "models": {}
            }

        stats = self.usage_stats[provider]
        stats["total_requests"] += 1

        if result.tokens_used:
            stats["total_tokens"] += result.tokens_used

        if result.cost:
            stats["total_cost"] += result.cost

        if model not in stats["models"]:
            stats["models"][model] = {"requests": 0, "tokens": 0, "cost": 0.0}

        model_stats = stats["models"][model]
        model_stats["requests"] += 1

        if result.tokens_used:
            model_stats["tokens"] += result.tokens_used

        if result.cost:
            model_stats["cost"] += result.cost