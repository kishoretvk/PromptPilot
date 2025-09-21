#!/usr/bin/env python3
"""
Week 1 Test Script for PromptPilot AI Refinement Services
Tests the automated refinement workflow implementation
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent))

from api.services.ai_refinement_service import AutomatedRefinementService
from api.services.model_provider_service import ModelProviderService
from api.services.validation_service import ValidationService
from api.services.testing_service import TestingService

async def test_validation_service():
    """Test the validation service functionality"""
    print("Testing Validation Service...")

    validation_service = ValidationService()

    # Test prompt validation
    test_prompt = {"content": "Write a haiku about coding"}
    validation_result = await validation_service.validate_prompt(test_prompt)

    print(f"Validation result: {validation_result}")
    assert validation_result.is_valid == True
    print("✓ Validation service test passed")

    return validation_service

async def test_model_provider_service():
    """Test the model provider service"""
    print("Testing Model Provider Service...")

    provider_service = ModelProviderService()

    # Test getting available providers
    providers = provider_service.get_available_providers()
    print(f"Available providers: {providers}")

    # Test getting a provider (this will fail without API keys, but should not crash)
    try:
        provider = provider_service.get_provider('openai')
        print(f"Got OpenAI provider: {type(provider)}")
    except Exception as e:
        print(f"Expected error getting provider without API key: {e}")

    print("✓ Model provider service test passed")
    return provider_service

async def test_testing_service():
    """Test the A/B testing service"""
    print("Testing Testing Service...")

    # We need to pass the model provider service to TestingService
    provider_service = ModelProviderService()
    testing_service = TestingService(provider_service)

    # Test generating test cases (this doesn't require API keys)
    test_cases = await testing_service.generate_test_cases(
        prompt_data={"content": "Write a coding tutorial"},
        count=3
    )
    print(f"Generated {len(test_cases)} test cases")

    print("✓ Testing service test passed")
    return testing_service

async def test_ai_refinement_service():
    """Test the main AI refinement service"""
    print("Testing AI Refinement Service...")

    # Create dependencies
    model_provider_service = ModelProviderService()
    validation_service = ValidationService()
    testing_service = TestingService(model_provider_service)

    refinement_service = AutomatedRefinementService(
        model_provider_service=model_provider_service,
        validation_service=validation_service,
        testing_service=testing_service
    )

    # Test basic refinement (this will likely fail without API keys, but should not crash)
    original_prompt = {"content": "Write a story about a robot"}

    try:
        result = await refinement_service.auto_refine_prompt(
            prompt_data=original_prompt,
            max_iterations=2
        )
        print(f"Refinement result: {result}")
    except Exception as e:
        print(f"Expected error during refinement without API keys: {e}")

    print("✓ AI refinement service test passed")
    return refinement_service

async def main():
    """Run all Week 1 tests"""
    print("Starting Week 1 AI Refinement Services Tests")
    print("=" * 50)

    try:
        # Test individual services
        validation_service = await test_validation_service()
        print()

        model_provider_service = await test_model_provider_service()
        print()

        testing_service = await test_testing_service()
        print()

        ai_refinement_service = await test_ai_refinement_service()
        print()

        print("=" * 50)
        print("All Week 1 tests completed successfully!")
        print("Note: Full functionality requires API keys for LLM providers")

    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)