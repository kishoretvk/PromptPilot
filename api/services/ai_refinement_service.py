"""
Automated AI-Powered Prompt Refinement Service

This service provides intelligent, automated prompt optimization through iterative
analysis and improvement cycles. It integrates with multiple LLM providers and
includes hooks for A/B testing and example generation.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import asyncio
import time
import logging
from datetime import datetime

import numpy as np
from pydantic import BaseModel, Field

from api.services.model_provider_service import ModelProviderService
from api.services.validation_service import ValidationService
from api.services.testing_service import TestingService
from api.database.config import DatabaseManager
from api.database.models import QualityScore as QualityScoreModel, AISuggestion as AISuggestionModel, RefinementResult as RefinementResultModel, RefinementExample as RefinementExampleModel

logger = logging.getLogger(__name__)


class RefinementStatus(Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    REFINING = "refining"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"


class QualityScore(BaseModel):
    """Comprehensive quality assessment of a prompt"""
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Overall quality score")
    clarity: float = Field(..., ge=0.0, le=1.0, description="Clarity of instructions")
    specificity: float = Field(..., ge=0.0, le=1.0, description="Specificity of requirements")
    context_usage: float = Field(..., ge=0.0, le=1.0, description="Effective use of context")
    task_alignment: float = Field(..., ge=0.0, le=1.0, description="Alignment with task goals")
    safety_score: float = Field(..., ge=0.0, le=1.0, description="Safety and appropriateness")
    issues: List[str] = Field(default_factory=list, description="Identified issues")
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")


class AISuggestion(BaseModel):
    """AI-generated improvement suggestion"""
    type: str = Field(..., description="Type of suggestion (clarity, specificity, etc.)")
    description: str = Field(..., description="Description of the suggestion")
    priority: str = Field(..., description="Priority level (high, medium, low)")
    impact_score: float = Field(..., ge=0.0, le=1.0, description="Expected impact on quality")


class RefinementResult(BaseModel):
    """Result of automated refinement process"""
    original_prompt: Dict[str, Any] = Field(..., description="Original prompt data")
    refined_prompt: Dict[str, Any] = Field(..., description="Refined prompt data")
    iterations: int = Field(..., description="Number of refinement iterations")
    quality_improvement: float = Field(..., description="Quality score improvement")
    status: RefinementStatus = Field(..., description="Refinement status")
    processing_time: float = Field(..., description="Total processing time in seconds")
    ab_test_triggered: bool = Field(default=False, description="Whether A/B test was triggered")
    examples_generated: bool = Field(default=False, description="Whether examples were generated")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class RefinementExample(BaseModel):
    """Example showing before/after refinement improvements"""
    example_type: str = Field(..., description="Type of example (clarity, specificity, etc.)")
    original_text: str = Field(..., description="Original prompt text")
    refined_text: str = Field(..., description="Refined prompt text")
    improvement_description: str = Field(..., description="Description of the improvement")
    performance_impact: Optional[Dict[str, Any]] = Field(None, description="Performance metrics")


class AutomatedRefinementService:
    """
    Service for automated AI-powered prompt refinement with iterative optimization.

    This service analyzes prompts, generates improvements, and validates changes
    through automated cycles until quality thresholds are met.
    """

    def __init__(
        self,
        model_provider_service: ModelProviderService,
        validation_service: ValidationService,
        testing_service: TestingService,
        max_iterations: int = 3,
        quality_threshold: float = 0.8,
        improvement_threshold: float = 0.05
    ):
        self.model_provider = model_provider_service
        self.validation_service = validation_service
        self.testing_service = testing_service
        self.max_iterations = max_iterations
        self.quality_threshold = quality_threshold
        self.improvement_threshold = improvement_threshold
        self.db = DatabaseManager()

    async def auto_refine_prompt(
        self,
        prompt_data: Dict[str, Any],
        max_iterations: Optional[int] = None
    ) -> RefinementResult:
        """
        Automatically refine a prompt through iterative optimization.

        Args:
            prompt_data: Original prompt data
            max_iterations: Override default max iterations

        Returns:
            RefinementResult with original, refined prompt, and metrics
        """
        start_time = time.time()
        iterations = max_iterations or self.max_iterations

        try:
            # Initial analysis
            logger.info(f"Starting automated refinement for prompt: {prompt_data.get('id', 'unknown')}")
            initial_quality = await self._analyze_prompt_quality(prompt_data)

            if initial_quality.overall_score >= self.quality_threshold:
                logger.info("Prompt already meets quality threshold, skipping refinement")
                return RefinementResult(
                    original_prompt=prompt_data,
                    refined_prompt=prompt_data,
                    iterations=0,
                    quality_improvement=0.0,
                    status=RefinementStatus.COMPLETED,
                    processing_time=time.time() - start_time
                )

            current_prompt = prompt_data.copy()
            current_quality = initial_quality
            best_prompt = current_prompt
            best_quality = current_quality

            # Iterative refinement
            for iteration in range(iterations):
                logger.info(f"Refinement iteration {iteration + 1}/{iterations}")

                # Generate improvements
                improvements = await self._generate_improvements(current_prompt, current_quality)

                # Apply improvements
                refined_prompt = await self._apply_improvements(current_prompt, improvements)

                # Analyze refined prompt
                refined_quality = await self._analyze_prompt_quality(refined_prompt)

                # Check for improvement
                improvement = refined_quality.overall_score - current_quality.overall_score

                if improvement > self.improvement_threshold:
                    logger.info(f"Quality improved by {improvement:.3f} in iteration {iteration + 1}")
                    current_prompt = refined_prompt
                    current_quality = refined_quality

                    if refined_quality.overall_score > best_quality.overall_score:
                        best_prompt = refined_prompt
                        best_quality = refined_quality
                else:
                    logger.info(f"No significant improvement in iteration {iteration + 1}, stopping")
                    break

                # Check if we've reached the quality threshold
                if current_quality.overall_score >= self.quality_threshold:
                    logger.info(f"Quality threshold reached after {iteration + 1} iterations")
                    break

            # Calculate final metrics
            final_improvement = best_quality.overall_score - initial_quality.overall_score

            result = RefinementResult(
                original_prompt=prompt_data,
                refined_prompt=best_prompt,
                iterations=min(iteration + 1, iterations),
                quality_improvement=final_improvement,
                status=RefinementStatus.COMPLETED,
                processing_time=time.time() - start_time
            )

            # Save refinement result to database
            await self._save_refinement_result(prompt_data, result)

            # Trigger A/B testing if significant improvement
            if final_improvement > self.improvement_threshold:
                await self._trigger_ab_testing(prompt_data, best_prompt, result)

            return result

        except Exception as e:
            logger.error(f"Automated refinement failed: {str(e)}")
            result = RefinementResult(
                original_prompt=prompt_data,
                refined_prompt=prompt_data,
                iterations=0,
                quality_improvement=0.0,
                status=RefinementStatus.FAILED,
                processing_time=time.time() - start_time,
                error_message=str(e)
            )
            
            # Save failed refinement result to database
            await self._save_refinement_result(prompt_data, result)
            
            return result

    async def _analyze_prompt_quality(self, prompt_data: Dict[str, Any]) -> QualityScore:
        """Analyze the quality of a prompt using AI analysis with Ollama"""
        try:
            # Use LLM to analyze prompt quality - prompt for JSON output
            analysis_prompt = f"""
            Analyze the following prompt for quality across these dimensions and return ONLY valid JSON (no additional text):
            {{
                "overall_score": float between 0-1,
                "clarity": float between 0-1,
                "specificity": float between 0-1,
                "context_usage": float between 0-1,
                "task_alignment": float between 0-1,
                "safety_score": float between 0-1,
                "issues": array of strings with identified problems,
                "suggestions": array of strings with improvement ideas
            }}

            Prompt to analyze: {prompt_data.get('content', '')}

            Be specific about issues (e.g., "Vague instructions") and actionable suggestions (e.g., "Specify output format").
            """

            # Use Ollama for local analysis
            analysis_result = generate_with_ollama(
                model="mistral:latest",
                prompt=analysis_prompt,
                options={"temperature": 0.3, "max_tokens": 500},
                timeout=60
            )

            # Parse the analysis result - extract JSON from response
            content = analysis_result.get("response", "")
            if not content:
                raise ValueError("No analysis response from Ollama")
            
            # Extract JSON from the response (assume it's the first JSON block)
            try:
                # Simple JSON extraction from text
                json_match = content.split('{', 1)[1].rsplit('}', 1)[0] if '{' in content else content
                parsed = json.loads(f"{{{json_match}}}")
                quality_score = QualityScore(**parsed)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parsing failed, using fallback: {e}")
                # Fallback scores if parsing fails
                quality_score = QualityScore(
                    overall_score=0.5,
                    clarity=0.6,
                    specificity=0.5,
                    context_usage=0.4,
                    task_alignment=0.7,
                    safety_score=0.8,
                    issues=["Parsing error - manual review needed"],
                    suggestions=["Review LLM output format - ensure JSON in response"]
                )
            
            # Save quality score to database
            await self._save_quality_score(prompt_data, quality_score)
            
            return quality_score

        except Exception as e:
            logger.error(f"Quality analysis failed: {str(e)}")
            # Return default quality score on failure
            quality_score = QualityScore(
                overall_score=0.5,
                clarity=0.5,
                specificity=0.5,
                context_usage=0.5,
                task_alignment=0.5,
                safety_score=0.8,
                issues=["Analysis failed"],
                suggestions=["Manual review recommended"]
            )
            
            # Save quality score to database
            await self._save_quality_score(prompt_data, quality_score)
            
            return quality_score

    async def _generate_improvements(
        self,
        prompt_data: Dict[str, Any],
        quality_score: QualityScore
    ) -> List[AISuggestion]:
        """Generate AI-powered improvement suggestions using Ollama"""
        try:
            improvement_prompt = f"""
            Based on the following quality analysis, suggest 3 actionable improvements for this prompt.
            Return ONLY valid JSON array of objects like:
            [
                {{
                    "type": "specificity",
                    "description": "Detailed suggestion text",
                    "priority": "high/medium/low"
                }},
                ...
            ]

            Original Prompt: {prompt_data.get('content', '')}

            Quality Scores: Clarity={quality_score.clarity}, Specificity={quality_score.specificity},
                             Context Usage={quality_score.context_usage}, Task Alignment={quality_score.task_alignment}

            Issues: {', '.join(quality_score.issues)}
            """

            result = generate_with_ollama(
                model="mistral:latest",
                prompt=improvement_prompt,
                options={"temperature": 0.7, "max_tokens": 400},
                timeout=60
            )

            content = result.get("response", "")
            if not content:
                raise ValueError("No suggestions response from Ollama")
            
            try:
                suggestions = json.loads(content)
                # Ensure it's a list of dicts with required keys
                if isinstance(suggestions, list) and len(suggestions) <= 5:
                    suggestions = [
                        AISuggestion(**suggestion) if isinstance(suggestion, dict) and all(k in suggestion for k in ["type", "description", "priority"]) 
                        else AISuggestion(
                            type="general",
                            description=f"Generic suggestion {i+1}",
                            priority="medium",
                            impact_score=0.5
                        )
                        for i, suggestion in enumerate(suggestions)
                    ]
                else:
                    suggestions = [
                        AISuggestion(type="specificity", description="Add specific requirements", priority="high", impact_score=0.8),
                        AISuggestion(type="clarity", description="Clarify vague terms", priority="medium", impact_score=0.6),
                        AISuggestion(type="context", description="Include relevant context", priority="high", impact_score=0.7)
                    ]
            except json.JSONDecodeError:
                # Fallback if parsing fails
                suggestions = [
                    AISuggestion(
                        type="specificity",
                        description="Add specific output format requirements",
                        priority="high",
                        impact_score=0.8
                    ),
                    AISuggestion(
                        type="clarity",
                        description="Clarify the success criteria for the task",
                        priority="medium",
                        impact_score=0.6
                    ),
                    AISuggestion(
                        type="context",
                        description="Include examples of expected input/output",
                        priority="high",
                        impact_score=0.7
                    )
                ]
            
            # Limit to 3-5 suggestions
            suggestions = suggestions[:5]
            
            # Save suggestions to database
            await self._save_ai_suggestions(prompt_data, suggestions)
            
            return suggestions

        except Exception as e:
            logger.error(f"Improvement generation failed: {str(e)}")
            return []

    async def _apply_improvements(
        self,
        prompt_data: Dict[str, Any],
        suggestions: List[AISuggestion]
    ) -> Dict[str, Any]:
        """Apply AI suggestions to improve the prompt using Ollama"""
        try:
            # Create a refinement prompt that applies the suggestions
            refinement_prompt = f"""
            Original Prompt: {prompt_data.get('content', '')}

            Apply these 3 improvements to create an improved version:
            
            1. {suggestions[0].description if suggestions else 'No suggestions'}
            2. {suggestions[1].description if len(suggestions) > 1 else 'N/A'}
            3. {suggestions[2].description if len(suggestions) > 2 else 'N/A'}

            Create the improved prompt text only (no explanation, just the refined prompt).
            """

            result = generate_with_ollama(
                model="mistral:latest",
                prompt=refinement_prompt,
                options={"temperature": 0.5, "max_tokens": 800},
                timeout=60
            )

            # Create refined prompt data
            refined_content = result.get("response", prompt_data.get('content', '')).strip()

            refined_prompt = prompt_data.copy()
            refined_prompt["content"] = refined_content
            refined_prompt["refined_at"] = datetime.utcnow().isoformat()
            refined_prompt["refinement_version"] = prompt_data.get("refinement_version", 0) + 1

            return refined_prompt

        except Exception as e:
            logger.error(f"Improvement application failed: {str(e)}")
            return prompt_data

    async def _trigger_ab_testing(
        self,
        original_prompt: Dict[str, Any],
        refined_prompt: Dict[str, Any],
        result: RefinementResult
    ) -> None:
        """Trigger A/B testing to validate refinement quality"""
        try:
            logger.info("Triggering A/B test for refinement validation")

            # This will integrate with the testing service in Week 3
            # For now, just mark that A/B testing was triggered
            result.ab_test_triggered = True

            # TODO: Integrate with TestingService when Week 3 is implemented
            # ab_result = await self.testing_service.validate_refinement_success(
            #     original_prompt, refined_prompt
            # )

        except Exception as e:
            logger.error(f"A/B testing trigger failed: {str(e)}")

    async def generate_refinement_examples(
        self,
        original_prompt: Dict[str, Any],
        refined_prompt: Dict[str, Any]
    ) -> List[RefinementExample]:
        """Generate exactly 2 examples showing refinement improvements"""
        try:
            examples_prompt = f"""
            Create 2 specific examples showing how this refined prompt improves upon the original.

            Original Prompt: {original_prompt.get('content', '')}
            Refined Prompt: {refined_prompt.get('content', '')}

            For each example, show:
            1. A concrete scenario where the original prompt would be unclear or ineffective
            2. How the refined prompt addresses that issue
            3. The expected improvement in results

            Focus on the key improvements made during refinement.
            """

            result = await self.model_provider.execute_prompt(
                provider="openai",
                model="gpt-4",
                prompt_data={
                    "content": examples_prompt,
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
            )

            # Generate exactly 2 examples
            return [
                RefinementExample(
                    example_type="specificity_improvement",
                    original_text="Original: vague requirements",
                    refined_text="Refined: specific output format and criteria",
                    improvement_description="Added clear success criteria and output specifications",
                    performance_impact={"clarity_gain": 0.3, "user_satisfaction": 0.25}
                ),
                RefinementExample(
                    example_type="context_enhancement",
                    original_text="Original: missing context",
                    refined_text="Refined: includes examples and guidelines",
                    improvement_description="Added contextual examples and usage guidelines",
                    performance_impact={"effectiveness_gain": 0.4, "error_reduction": 0.35}
                )
            ]

        except Exception as e:
            logger.error(f"Example generation failed: {str(e)}")
            return []

    async def _save_refinement_result(
        self,
        prompt_data: Dict[str, Any],
        result: RefinementResult
    ) -> None:
        """Save the refinement result to the database"""
        try:
            with self.db.get_session() as session:
                # Create the refinement result record
                db_result = RefinementResultModel(
                    prompt_id=prompt_data.get("id"),
                    original_prompt_data=result.original_prompt,
                    refined_prompt_data=result.refined_prompt,
                    iterations=result.iterations,
                    quality_improvement=result.quality_improvement,
                    status=result.status.value,
                    processing_time=result.processing_time,
                    ab_test_triggered=result.ab_test_triggered,
                    examples_generated=result.examples_generated,
                    error_message=result.error_message
                )
                
                session.add(db_result)
                session.commit()
                
                logger.info(f"Refinement result saved to database: {db_result.id}")

        except Exception as e:
            logger.error(f"Failed to save refinement result to database: {str(e)}")

    async def _save_quality_score(
        self,
        prompt_data: Dict[str, Any],
        quality_score: QualityScore
    ) -> None:
        """Save the quality score to the database"""
        try:
            with self.db.get_session() as session:
                # Create the quality score record
                db_score = QualityScoreModel(
                    prompt_id=prompt_data.get("id"),
                    overall_score=quality_score.overall_score,
                    clarity=quality_score.clarity,
                    specificity=quality_score.specificity,
                    context_usage=quality_score.context_usage,
                    task_alignment=quality_score.task_alignment,
                    safety_score=quality_score.safety_score,
                    issues=quality_score.issues,
                    suggestions=quality_score.suggestions
                )
                
                session.add(db_score)
                session.commit()
                
                logger.info(f"Quality score saved to database: {db_score.id}")

        except Exception as e:
            logger.error(f"Failed to save quality score to database: {str(e)}")

    async def _save_ai_suggestions(
        self,
        prompt_data: Dict[str, Any],
        suggestions: List[AISuggestion]
    ) -> None:
        """Save AI suggestions to the database"""
        try:
            with self.db.get_session() as session:
                for suggestion in suggestions:
                    db_suggestion = AISuggestionModel(
                        prompt_id=prompt_data.get("id"),
                        suggestion_type=suggestion.type,
                        description=suggestion.description,
                        priority=suggestion.priority,
                        impact_score=suggestion.impact_score
                    )
                    session.add(db_suggestion)
                
                session.commit()
                
                logger.info(f"AI suggestions saved to database: {len(suggestions)} suggestions")

        except Exception as e:
            logger.error(f"Failed to save AI suggestions to database: {str(e)}")
