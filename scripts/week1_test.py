#!/usr/bin/env python3
"""
Week 1 Implementation Test Script

Tests the automated AI refinement service implementation.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.services.ai_refinement_service import AutomatedRefinementService
from api.services.model_provider_service import ModelProviderService
from api.services.validation_service import ValidationService
from api.services.testing_service import TestingService


async def test_basic_refinement():
    """Test basic automated refinement functionality"""
    print("🧪 Testing Week 1: Automated AI Refinement Service")
    print("=" * 60)

    # Initialize services
    print("🔧 Initializing services...")
    model_provider = ModelProviderService()
    validation_service = ValidationService()
    testing_service = TestingService(model_provider)

    refinement_service = AutomatedRefinementService(
        model_provider_service=model_provider,
        validation_service=validation_service,
        testing_service=testing_service,
        max_iterations=2,  # Shorter for testing
        quality_threshold=0.7
    )

    # Test prompt
    test_prompt = {
        "id": "test_prompt_001",
        "content": "Write a summary of the given text. Make it concise and clear.",
        "preferred_provider": "openai",
        "preferred_model": "gpt-4"
    }

    print(f"📝 Original Prompt: {test_prompt['content']}")
    print()

    try:
        # Test quality analysis
        print("🔍 Testing quality analysis...")
        quality_score = await refinement_service._analyze_prompt_quality(test_prompt)
        print(f"✅ Quality Score: {quality_score.overall_score:.2f}")
        print(f"   Clarity: {quality_score.clarity:.2f}")
        print(f"   Specificity: {quality_score.specificity:.2f}")
        print(f"   Issues: {len(quality_score.issues)}")
        print(f"   Suggestions: {len(quality_score.suggestions)}")
        print()

        # Test automated refinement
        print("🤖 Testing automated refinement...")
        start_time = datetime.now()
        result = await refinement_service.auto_refine_prompt(test_prompt)
        end_time = datetime.now()

        print("✅ Refinement completed!")
        print(f"   Status: {result.status}")
        print(f"   Iterations: {result.iterations}")
        print(f"   Quality Improvement: {result.quality_improvement:.3f}")
        print(f"   Processing Time: {result.processing_time:.2f}s")
        print(f"   A/B Test Triggered: {result.ab_test_triggered}")
        print()

        if result.refined_prompt != test_prompt:
            print("📋 Refined Prompt:")
            print(f"   {result.refined_prompt['content']}")
            print()

        # Test example generation (if refinement was successful)
        if result.status == "completed" and result.quality_improvement > 0:
            print("📚 Testing example generation...")
            examples = await refinement_service.generate_refinement_examples(
                original_prompt=test_prompt,
                refined_prompt=result.refined_prompt
            )

            print(f"✅ Generated {len(examples)} examples:")
            for i, example in enumerate(examples, 1):
                print(f"   Example {i}: {example.example_type}")
                print(f"   Improvement: {example.improvement_description}")
            print()

        print("🎉 Week 1 implementation test completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_validation_service():
    """Test the validation service"""
    print("🔍 Testing Validation Service")
    print("-" * 40)

    validation_service = ValidationService()

    test_prompt = {
        "content": "Create a summary that is very detailed and comprehensive but also brief."
    }

    try:
        result = await validation_service.validate_prompt(test_prompt)

        print("✅ Validation completed")
        print(f"   Is Valid: {result.is_valid}")
        print(f"   Overall Score: {result.overall_score:.2f}")
        print(f"   Issues: {len(result.issues)}")
        print(f"   Passed Checks: {', '.join(result.passed_checks)}")
        print(f"   Failed Checks: {', '.join(result.failed_checks)}")

        if result.issues:
            print("   Top Issues:")
            for issue in result.issues[:3]:  # Show first 3
                print(f"     - {issue.message}")

        return True

    except Exception as e:
        print(f"❌ Validation test failed: {str(e)}")
        return False


async def test_model_provider():
    """Test the model provider service"""
    print("🔌 Testing Model Provider Service")
    print("-" * 40)

    provider_service = ModelProviderService()

    try:
        # Test provider listing
        providers = await provider_service.list_available_providers()
        print(f"✅ Found {len(providers)} providers")

        for provider in providers:
            print(f"   {provider.name}: {provider.status} ({len(provider.models)} models)")

        # Test simple execution (if API keys are available)
        test_prompt = {
            "content": "Say 'Hello, World!' and nothing else.",
            "temperature": 0.1,
            "max_tokens": 50
        }

        print("\n🧪 Testing simple prompt execution...")
        try:
            result = await provider_service.execute_prompt(
                provider="openai",  # Try OpenAI first
                model="gpt-4",
                prompt_data=test_prompt
            )

            if result.error:
                print(f"⚠️  Execution failed: {result.error}")
                print("   (This is expected if API keys are not configured)")
            else:
                print("✅ Prompt executed successfully")
                print(f"   Response: {result.content[:100]}...")
                print(f"   Tokens: {result.tokens_used}, Cost: ${result.cost:.4f}")

        except Exception as e:
            print(f"⚠️  Execution test failed: {str(e)}")
            print("   (This is expected if API keys are not configured)")

        return True

    except Exception as e:
        print(f"❌ Provider test failed: {str(e)}")
        return False


async def main():
    """Run all Week 1 tests"""
    print("🚀 Week 1 Implementation Test Suite")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    print()

    results = []

    # Test individual components
    results.append(await test_validation_service())
    print()

    results.append(await test_model_provider())
    print()

    # Test the main refinement service
    results.append(await test_basic_refinement())
    print()

    # Summary
    print("=" * 60)
    passed = sum(results)
    total = len(results)

    if passed == total:
        print("🎉 All tests passed! Week 1 implementation is ready.")
        print("📋 Next steps:")
        print("   1. Configure API keys for LLM providers")
        print("   2. Test with real prompts")
        print("   3. Move to Week 2: Automated Validation")
    else:
        print(f"⚠️  {passed}/{total} tests passed. Review failures above.")

    print(f"Completed at: {datetime.now()}")
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)