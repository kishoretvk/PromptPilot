"""
Testing Service

A/B testing framework with statistical analysis for prompt comparison and validation.
"""

from typing import Dict, List, Any, Optional, Tuple
import asyncio
import logging
import time
from datetime import datetime
from dataclasses import dataclass
import statistics

import numpy as np
from scipy import stats
from pydantic import BaseModel, Field

from api.services.model_provider_service import ModelProviderService
from api.database.config import DatabaseManager
from api.database.models import ABTest as ABTestModel, ABTestCase as ABTestCaseModel, ABTestResult as ABTestResultModel, ValidationResult as ValidationResultModel

logger = logging.getLogger(__name__)


class TestCase(BaseModel):
    """Individual test case for A/B testing"""
    id: str = Field(..., description="Unique test case identifier")
    input_text: str = Field(..., description="Input text for the test")
    expected_criteria: Optional[Dict[str, Any]] = Field(None, description="Expected output criteria")
    category: Optional[str] = Field(None, description="Test category")


class TestResult(BaseModel):
    """Result of running a single test case"""
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
    recommendations: List[str] = Field(default_factory=list, description="Recommendations based on results")
    execution_time: float = Field(..., description="Total test execution time")


class ValidationResult(BaseModel):
    """Result of refinement validation"""
    is_significant_improvement: bool = Field(..., description="Whether improvement is statistically significant")
    improvement_percentage: float = Field(..., description="Percentage improvement")
    confidence_interval: Tuple[float, float] = Field(..., description="Confidence interval for improvement")
    p_value: float = Field(..., description="Statistical significance p-value")
    effect_size: float = Field(..., description="Cohen's d effect size")
    sample_size: int = Field(..., description="Number of test cases used")


class TestingService:
    """
    Service for A/B testing of prompts with statistical analysis.

    Provides automated testing, statistical significance testing, and
    validation of prompt improvements.
    """

    def __init__(self, model_provider_service: ModelProviderService):
        self.model_provider = model_provider_service
        self.logger = logging.getLogger(__name__)
        self.db = DatabaseManager()

    async def run_ab_test(
        self,
        prompt_a: Dict[str, Any],
        prompt_b: Dict[str, Any],
        test_cases: List[TestCase],
        significance_level: float = 0.05
    ) -> ABTestResult:
        """
        Run an A/B test comparing two prompts.

        Args:
            prompt_a: First prompt to test
            prompt_b: Second prompt to test
            test_cases: List of test cases to run
            significance_level: Statistical significance threshold

        Returns:
            ABTestResult with comparison and analysis
        """
        start_time = time.time()
        test_id = f"ab_test_{int(time.time())}"

        self.logger.info(f"Starting A/B test {test_id} with {len(test_cases)} test cases")

        # Run tests for both prompts
        prompt_a_results = await self._run_test_cases(prompt_a, test_cases, "A")
        prompt_b_results = await self._run_test_cases(prompt_b, test_cases, "B")

        # Perform statistical analysis
        statistical_analysis = self._perform_statistical_analysis(
            prompt_a_results, prompt_b_results, significance_level
        )

        # Determine winner
        winner = self._determine_winner(statistical_analysis, significance_level)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            statistical_analysis, winner, prompt_a_results, prompt_b_results
        )

        result = ABTestResult(
            test_id=test_id,
            prompt_a_results=prompt_a_results,
            prompt_b_results=prompt_b_results,
            statistical_analysis=statistical_analysis,
            winner=winner,
            confidence_level=1.0 - significance_level,
            effect_size=statistical_analysis.get("effect_size"),
            recommendations=recommendations,
            execution_time=time.time() - start_time
        )

        # Save A/B test results to database
        await self._save_ab_test_results(prompt_a, prompt_b, test_cases, result)

        self.logger.info(f"A/B test {test_id} completed. Winner: {winner}")
        return result

    async def validate_refinement_success(
        self,
        original_prompt: Dict[str, Any],
        refined_prompt: Dict[str, Any],
        test_cases: Optional[List[TestCase]] = None,
        min_improvement: float = 0.05
    ) -> ValidationResult:
        """
        Validate that automated refinement actually improved the prompt.

        Args:
            original_prompt: Original prompt before refinement
            refined_prompt: Refined prompt after automation
            test_cases: Test cases to use (generated if None)
            min_improvement: Minimum improvement threshold

        Returns:
            ValidationResult with statistical validation
        """
        if test_cases is None:
            test_cases = await self.generate_test_cases(refined_prompt, count=10)

        # Run A/B test
        ab_result = await self.run_ab_test(
            original_prompt, refined_prompt, test_cases
        )

        # Extract key metrics
        stats = ab_result.statistical_analysis
        p_value = stats.get("p_value", 1.0)
        effect_size = stats.get("effect_size", 0.0)
        mean_diff = stats.get("mean_difference", 0.0)
        mean_a = stats.get("mean_a", 0.0)

        # Calculate improvement percentage
        improvement_percentage = (mean_diff / mean_a) if mean_a != 0 else 0.0

        # Determine if significant
        is_significant = (
            p_value < 0.05 and  # Statistically significant
            improvement_percentage > min_improvement  # Meaningful improvement
        )

        # Calculate confidence interval
        confidence_interval = stats.get("confidence_interval", (0.0, 0.0))

        validation_result = ValidationResult(
            is_significant_improvement=is_significant,
            improvement_percentage=improvement_percentage,
            confidence_interval=confidence_interval,
            p_value=p_value,
            effect_size=effect_size,
            sample_size=len(test_cases)
        )

        # Save validation result to database
        await self._save_validation_result(ab_result, validation_result)

        return validation_result

    async def generate_test_cases(
        self,
        prompt_data: Dict[str, Any],
        count: int = 10
    ) -> List[TestCase]:
        """
        Generate diverse test cases for prompt evaluation.

        Args:
            prompt_data: Prompt to generate test cases for
            count: Number of test cases to generate

        Returns:
            List of test cases
        """
        # This is a simplified implementation
        # In practice, you'd use AI to generate diverse test cases

        base_scenarios = [
            "Simple case with clear requirements",
            "Complex case with multiple constraints",
            "Edge case with unusual requirements",
            "Ambiguous case requiring clarification",
            "Performance-critical case",
            "Error-prone case",
            "Multi-step process case",
            "Integration requirements case",
            "User experience focused case",
            "Technical specification case"
        ]

        test_cases = []
        for i in range(min(count, len(base_scenarios))):
            test_cases.append(TestCase(
                id=f"test_{i+1}",
                input_text=base_scenarios[i],
                category="generated",
                expected_criteria={"relevance": True, "completeness": True}
            ))

        return test_cases

    async def _run_test_cases(
        self,
        prompt: Dict[str, Any],
        test_cases: List[TestCase],
        version: str
    ) -> List[TestResult]:
        """Run test cases for a specific prompt version"""
        results = []

        for test_case in test_cases:
            try:
                # Combine prompt with test case
                full_prompt = f"{prompt.get('content', '')}\n\nTest Input: {test_case.input_text}"

                # Execute using model provider
                execution_result = await self.model_provider.execute_prompt(
                    provider=prompt.get("preferred_provider", "openai"),
                    model=prompt.get("preferred_model", "gpt-4"),
                    prompt_data={
                        "content": full_prompt,
                        "temperature": 0.7,
                        "max_tokens": 1000
                    }
                )

                # Calculate quality score (simplified)
                quality_score = self._calculate_quality_score(
                    execution_result.content, test_case
                )

                result = TestResult(
                    test_case_id=test_case.id,
                    prompt_version=version,
                    output=execution_result.content,
                    processing_time=execution_result.processing_time,
                    quality_score=quality_score,
                    custom_metrics={
                        "tokens_used": execution_result.tokens_used,
                        "cost": execution_result.cost
                    }
                )

                results.append(result)

            except Exception as e:
                self.logger.error(f"Test case {test_case.id} failed: {str(e)}")
                # Add failed result
                results.append(TestResult(
                    test_case_id=test_case.id,
                    prompt_version=version,
                    output="",
                    processing_time=0.0,
                    quality_score=0.0,
                    custom_metrics={"error": str(e)}
                ))

        return results

    def _perform_statistical_analysis(
        self,
        results_a: List[TestResult],
        results_b: List[TestResult],
        significance_level: float
    ) -> Dict[str, Any]:
        """Perform comprehensive statistical analysis"""
        # Extract quality scores
        scores_a = [r.quality_score for r in results_a if r.quality_score is not None]
        scores_b = [r.quality_score for r in results_b if r.quality_score is not None]

        if not scores_a or not scores_b:
            return {
                "error": "Insufficient data for statistical analysis",
                "mean_a": 0.0,
                "mean_b": 0.0,
                "p_value": 1.0
            }

        # Basic statistics
        mean_a = statistics.mean(scores_a)
        mean_b = statistics.mean(scores_b)
        std_a = statistics.stdev(scores_a) if len(scores_a) > 1 else 0
        std_b = statistics.stdev(scores_b) if len(scores_b) > 1 else 0

        # T-test for significance
        try:
            t_stat, p_value = stats.ttest_ind(scores_a, scores_b, equal_var=False)
        except Exception:
            p_value = 1.0
            t_stat = 0.0

        # Effect size (Cohen's d)
        pooled_std = np.sqrt(((len(scores_a) - 1) * std_a**2 + (len(scores_b) - 1) * std_b**2) /
                            (len(scores_a) + len(scores_b) - 2))
        effect_size = (mean_b - mean_a) / pooled_std if pooled_std > 0 else 0.0

        # Confidence interval
        mean_diff = mean_b - mean_a
        se_diff = np.sqrt(std_a**2/len(scores_a) + std_b**2/len(scores_b))
        ci_lower = mean_diff - 1.96 * se_diff
        ci_upper = mean_diff + 1.96 * se_diff

        return {
            "mean_a": mean_a,
            "mean_b": mean_b,
            "std_a": std_a,
            "std_b": std_b,
            "mean_difference": mean_diff,
            "t_statistic": t_stat,
            "p_value": p_value,
            "effect_size": effect_size,
            "confidence_interval": (ci_lower, ci_upper),
            "sample_size_a": len(scores_a),
            "sample_size_b": len(scores_b),
            "is_significant": p_value < significance_level
        }

    def _determine_winner(
        self,
        statistical_analysis: Dict[str, Any],
        significance_level: float
    ) -> Optional[str]:
        """Determine the winning prompt based on statistical analysis"""
        if statistical_analysis.get("error"):
            return None

        p_value = statistical_analysis.get("p_value", 1.0)
        mean_diff = statistical_analysis.get("mean_difference", 0.0)

        if p_value < significance_level:
            return "B" if mean_diff > 0 else "A"
        else:
            return "tie"  # No significant difference

    def _generate_recommendations(
        self,
        statistical_analysis: Dict[str, Any],
        winner: Optional[str],
        results_a: List[TestResult],
        results_b: List[TestResult]
    ) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []

        if winner == "B":
            recommendations.append("Prompt B shows statistically significant improvement")
            recommendations.append("Consider adopting the refined prompt version")
        elif winner == "A":
            recommendations.append("Original prompt A performed better")
            recommendations.append("Review refinement approach for potential issues")
        elif winner == "tie":
            recommendations.append("No significant difference between prompts")
            recommendations.append("Consider testing with more diverse cases or different metrics")

        # Check for consistency
        scores_a = [r.quality_score for r in results_a if r.quality_score is not None]
        scores_b = [r.quality_score for r in results_b if r.quality_score is not None]

        if scores_a and scores_b:
            var_a = statistics.variance(scores_a) if len(scores_a) > 1 else 0
            var_b = statistics.variance(scores_b) if len(scores_b) > 1 else 0

            if var_b > var_a * 1.5:
                recommendations.append("Refined prompt shows more variability - consider stability improvements")

        # Performance recommendations
        avg_time_a = statistics.mean([r.processing_time for r in results_a])
        avg_time_b = statistics.mean([r.processing_time for r in results_b])

        if avg_time_b > avg_time_a * 1.2:
            recommendations.append("Refined prompt takes significantly longer - review complexity")

        return recommendations

    def _calculate_quality_score(self, output: str, test_case: TestCase) -> float:
        """Calculate a quality score for test output (simplified implementation)"""
        if not output or not output.strip():
            return 0.0

        score = 0.5  # Base score

        # Length appropriateness (simple heuristic)
        word_count = len(output.split())
        if 10 <= word_count <= 500:
            score += 0.2
        elif word_count < 10:
            score -= 0.1
        else:
            score -= 0.1

        # Relevance check (very basic)
        input_words = set(test_case.input_text.lower().split())
        output_words = set(output.lower().split())
        overlap = len(input_words.intersection(output_words))
        relevance_score = min(overlap / len(input_words), 1.0) if input_words else 0.0
        score += relevance_score * 0.3

        return max(0.0, min(1.0, score))

    async def _save_ab_test_results(
        self,
        prompt_a: Dict[str, Any],
        prompt_b: Dict[str, Any],
        test_cases: List[TestCase],
        result: ABTestResult
    ) -> None:
        """Save A/B test results to the database"""
        try:
            with self.db.get_session() as session:
                # Create A/B test record
                ab_test = ABTestModel(
                    test_name=f"A/B Test {result.test_id}",
                    description=f"A/B test comparing two prompts",
                    status="completed",
                    winner=result.winner,
                    confidence_level=result.confidence_level,
                    effect_size=result.effect_size,
                    execution_time=result.execution_time,
                    statistical_analysis=result.statistical_analysis,
                    recommendations=result.recommendations,
                    completed_at=datetime.utcnow()
                )
                
                session.add(ab_test)
                session.flush()  # Get the ID
                
                # Save test cases and results
                for i, test_case in enumerate(test_cases):
                    # Create test case record
                    db_test_case = ABTestCaseModel(
                        ab_test_id=ab_test.id,
                        input_text=test_case.input_text,
                        expected_criteria=test_case.expected_criteria,
                        category=test_case.category
                    )
                    session.add(db_test_case)
                    session.flush()
                    
                    # Save results for both prompts
                    if i < len(result.prompt_a_results):
                        a_result = result.prompt_a_results[i]
                        db_result_a = ABTestResultModel(
                            ab_test_id=ab_test.id,
                            test_case_id=db_test_case.id,
                            prompt_version="A",
                            output=a_result.output,
                            processing_time=a_result.processing_time,
                            quality_score=a_result.quality_score,
                            custom_metrics=a_result.custom_metrics
                        )
                        session.add(db_result_a)
                    
                    if i < len(result.prompt_b_results):
                        b_result = result.prompt_b_results[i]
                        db_result_b = ABTestResultModel(
                            ab_test_id=ab_test.id,
                            test_case_id=db_test_case.id,
                            prompt_version="B",
                            output=b_result.output,
                            processing_time=b_result.processing_time,
                            quality_score=b_result.quality_score,
                            custom_metrics=b_result.custom_metrics
                        )
                        session.add(db_result_b)
                
                session.commit()
                
                logger.info(f"A/B test results saved to database: {ab_test.id}")

        except Exception as e:
            logger.error(f"Failed to save A/B test results to database: {str(e)}")

    async def _save_validation_result(
        self,
        ab_test_result: ABTestResult,
        validation_result: ValidationResult
    ) -> None:
        """Save validation result to the database"""
        try:
            with self.db.get_session() as session:
                # Find the A/B test record
                ab_test = session.query(ABTestModel).filter_by(test_id=ab_test_result.test_id).first()
                if not ab_test:
                    logger.warning(f"A/B test not found for validation: {ab_test_result.test_id}")
                    return
                
                # Create validation result record
                db_validation = ValidationResultModel(
                    ab_test_id=ab_test.id,
                    is_significant_improvement=validation_result.is_significant_improvement,
                    improvement_percentage=validation_result.improvement_percentage,
                    confidence_interval_lower=validation_result.confidence_interval[0],
                    confidence_interval_upper=validation_result.confidence_interval[1],
                    p_value=validation_result.p_value,
                    effect_size=validation_result.effect_size,
                    sample_size=validation_result.sample_size
                )
                
                session.add(db_validation)
                session.commit()
                
                logger.info(f"Validation result saved to database: {db_validation.id}")

        except Exception as e:
            logger.error(f"Failed to save validation result to database: {str(e)}")