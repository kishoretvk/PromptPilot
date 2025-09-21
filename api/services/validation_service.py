"""
Validation Service

Automated prompt validation with quality checking, best practice compliance,
and safety assessment.
"""

from typing import Dict, List, Any, Optional, Tuple
import re
import logging
from enum import Enum

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ValidationSeverity(Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationIssue(BaseModel):
    """Individual validation issue or suggestion"""
    type: str = Field(..., description="Type of issue (clarity, safety, etc.)")
    severity: ValidationSeverity = Field(..., description="Severity level")
    message: str = Field(..., description="Human-readable message")
    line_number: Optional[int] = Field(None, description="Line number if applicable")
    suggestion: Optional[str] = Field(None, description="Suggested fix")


class ValidationResult(BaseModel):
    """Result of prompt validation"""
    is_valid: bool = Field(..., description="Whether the prompt passes validation")
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Overall validation score")
    issues: List[ValidationIssue] = Field(default_factory=list, description="List of validation issues")
    passed_checks: List[str] = Field(default_factory=list, description="Checks that passed")
    failed_checks: List[str] = Field(default_factory=list, description="Checks that failed")
    recommendations: List[str] = Field(default_factory=list, description="Improvement recommendations")


class ValidationService:
    """
    Service for automated prompt validation and quality assessment.

    Performs comprehensive checks including clarity, safety, best practices,
    and potential issues.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def validate_prompt(self, prompt_data: Dict[str, Any]) -> ValidationResult:
        """
        Perform comprehensive validation on a prompt.

        Args:
            prompt_data: Prompt data to validate

        Returns:
            ValidationResult with issues and recommendations
        """
        content = prompt_data.get("content", "")
        issues = []
        passed_checks = []
        failed_checks = []
        recommendations = []

        # Run all validation checks
        checks = [
            self._check_clarity,
            self._check_specificity,
            self._check_safety,
            self._check_best_practices,
            self._check_potential_issues,
            self._check_length_appropriateness,
            self._check_instruction_clarity
        ]

        for check_func in checks:
            try:
                check_issues, check_passed, check_recommendations = await check_func(content)
                issues.extend(check_issues)
                if check_passed:
                    passed_checks.append(check_func.__name__.replace('_check_', ''))
                else:
                    failed_checks.append(check_func.__name__.replace('_check_', ''))
                recommendations.extend(check_recommendations)
            except Exception as e:
                self.logger.error(f"Validation check {check_func.__name__} failed: {str(e)}")

        # Calculate overall score
        total_checks = len(checks)
        passed_count = len(passed_checks)
        overall_score = passed_count / total_checks if total_checks > 0 else 0.0

        # Determine if valid (allow some warnings)
        error_count = sum(1 for issue in issues if issue.severity == ValidationSeverity.ERROR)
        is_valid = error_count == 0

        return ValidationResult(
            is_valid=is_valid,
            overall_score=overall_score,
            issues=issues,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            recommendations=list(set(recommendations))  # Remove duplicates
        )

    async def _check_clarity(self, content: str) -> Tuple[List[ValidationIssue], bool, List[str]]:
        """Check if the prompt is clear and unambiguous"""
        issues = []
        recommendations = []

        # Check for ambiguous words
        ambiguous_words = ['maybe', 'perhaps', 'might', 'could', 'possibly']
        found_ambiguous = any(word in content.lower() for word in ambiguous_words)

        if found_ambiguous:
            issues.append(ValidationIssue(
                type="clarity",
                severity=ValidationSeverity.WARNING,
                message="Prompt contains ambiguous language that may confuse the AI",
                suggestion="Replace ambiguous words with clear, direct instructions"
            ))
            recommendations.append("Use clear, direct language instead of ambiguous terms")

        # Check for multiple questions/conflicting instructions
        question_count = len(re.findall(r'\?', content))
        if question_count > 2:
            issues.append(ValidationIssue(
                type="clarity",
                severity=ValidationSeverity.WARNING,
                message="Prompt contains multiple questions which may confuse the AI",
                suggestion="Focus on one primary task or question"
            ))
            recommendations.append("Consolidate multiple questions into a single, clear task")

        # Check for clear task definition
        has_task_words = any(word in content.lower() for word in ['task', 'goal', 'objective', 'purpose'])
        if not has_task_words and len(content.split()) > 20:
            issues.append(ValidationIssue(
                type="clarity",
                severity=ValidationSeverity.INFO,
                message="Consider explicitly stating the task or goal",
                suggestion="Add a clear statement of what the AI should accomplish"
            ))

        passed = len([i for i in issues if i.severity == ValidationSeverity.ERROR]) == 0
        return issues, passed, recommendations

    async def _check_specificity(self, content: str) -> Tuple[List[ValidationIssue], bool, List[str]]:
        """Check if the prompt provides specific requirements"""
        issues = []
        recommendations = []

        # Check for specific output format requirements
        format_indicators = ['format:', 'output:', 'structure:', 'json', 'xml', 'markdown']
        has_format = any(indicator in content.lower() for indicator in format_indicators)

        if not has_format and len(content.split()) > 30:
            issues.append(ValidationIssue(
                type="specificity",
                severity=ValidationSeverity.WARNING,
                message="Prompt lacks specific output format requirements",
                suggestion="Specify the desired output format (JSON, markdown, etc.)"
            ))
            recommendations.append("Specify exact output format and structure requirements")

        # Check for concrete examples
        has_examples = 'example' in content.lower() or '"' in content or 'e.g.' in content.lower()
        if not has_examples and len(content.split()) > 50:
            issues.append(ValidationIssue(
                type="specificity",
                severity=ValidationSeverity.INFO,
                message="Consider adding examples to clarify expectations",
                suggestion="Include 1-2 concrete examples of desired input/output"
            ))
            recommendations.append("Add concrete examples to illustrate requirements")

        # Check for measurable criteria
        success_indicators = ['should', 'must', 'criteria', 'requirements', 'success']
        has_criteria = any(indicator in content.lower() for indicator in success_indicators)

        if not has_criteria:
            issues.append(ValidationIssue(
                type="specificity",
                severity=ValidationSeverity.INFO,
                message="Prompt could benefit from clear success criteria",
                suggestion="Define what constitutes a successful response"
            ))
            recommendations.append("Define clear success criteria and evaluation metrics")

        passed = len([i for i in issues if i.severity == ValidationSeverity.ERROR]) == 0
        return issues, passed, recommendations

    async def _check_safety(self, content: str) -> Tuple[List[ValidationIssue], bool, List[str]]:
        """Check for safety concerns and inappropriate content"""
        issues = []
        recommendations = []

        # Check for potentially harmful requests
        harmful_patterns = [
            r'\b(hack|exploit|crack|break into)\b',
            r'\b(illegal|unlawful|forbidden)\b',
            r'\b(weapon|nuclear|bomb|explosive)\b',
            r'\b(harm|injure|kill|damage)\b'
        ]

        for pattern in harmful_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append(ValidationIssue(
                    type="safety",
                    severity=ValidationSeverity.ERROR,
                    message="Prompt contains potentially harmful or illegal content",
                    suggestion="Remove or rephrase harmful content"
                ))
                break

        # Check for personal information requests
        personal_patterns = [
            r'\b(ssn|social security|password|credit card)\b',
            r'\b(private|confidential|secret)\b.*\b(info|data|information)\b'
        ]

        for pattern in personal_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append(ValidationIssue(
                    type="safety",
                    severity=ValidationSeverity.WARNING,
                    message="Prompt requests sensitive or personal information",
                    suggestion="Avoid requesting sensitive personal data"
                ))
                recommendations.append("Avoid requesting sensitive or personal information")
                break

        passed = len([i for i in issues if i.severity == ValidationSeverity.ERROR]) == 0
        return issues, passed, recommendations

    async def _check_best_practices(self, content: str) -> Tuple[List[ValidationIssue], bool, List[str]]:
        """Check adherence to prompt engineering best practices"""
        issues = []
        recommendations = []

        # Check for role definition
        role_indicators = ['you are', 'act as', 'role:', 'persona:']
        has_role = any(indicator in content.lower() for indicator in role_indicators)

        if not has_role and len(content.split()) > 40:
            issues.append(ValidationIssue(
                type="best_practice",
                severity=ValidationSeverity.INFO,
                message="Consider defining a clear role or persona for the AI",
                suggestion="Add 'You are a [role]' at the beginning to set context"
            ))
            recommendations.append("Define a clear role or persona for better responses")

        # Check for context provision
        context_indicators = ['context:', 'background:', 'information:', 'given that']
        has_context = any(indicator in content.lower() for indicator in context_indicators)

        if not has_context and len(content.split()) > 60:
            issues.append(ValidationIssue(
                type="best_practice",
                severity=ValidationSeverity.INFO,
                message="Consider providing more context for complex tasks",
                suggestion="Add relevant context or background information"
            ))
            recommendations.append("Provide sufficient context for the task")

        # Check for step-by-step instructions
        step_indicators = ['step 1', 'first', 'then', 'next', 'finally', '1.', '2.', '3.']
        has_steps = any(indicator in content.lower() for indicator in step_indicators)

        if not has_steps and len(content.split()) > 80:
            issues.append(ValidationIssue(
                type="best_practice",
                severity=ValidationSeverity.INFO,
                message="Consider breaking complex tasks into steps",
                suggestion="Structure the prompt with clear, numbered steps"
            ))
            recommendations.append("Break complex tasks into clear, sequential steps")

        passed = True  # Best practices are recommendations, not requirements
        return issues, passed, recommendations

    async def _check_potential_issues(self, content: str) -> Tuple[List[ValidationIssue], bool, List[str]]:
        """Check for potential issues that could cause problems"""
        issues = []
        recommendations = []

        # Check for overly complex language
        complex_words = ['utilize', 'facilitate', 'leverage', 'optimize', 'streamline', 'synergize']
        complex_count = sum(1 for word in complex_words if word in content.lower())

        if complex_count > 3:
            issues.append(ValidationIssue(
                type="potential_issue",
                severity=ValidationSeverity.WARNING,
                message="Prompt uses overly complex business jargon",
                suggestion="Use simpler, more direct language"
            ))
            recommendations.append("Use clear, simple language instead of jargon")

        # Check for contradictory instructions
        contradiction_patterns = [
            (r'\b(detailed|comprehensive)\b.*\b(brief|short)\b', "detailed vs brief"),
            (r'\b(fast|quick)\b.*\b(thorough|comprehensive)\b', "fast vs thorough"),
            (r'\b(creative|innovative)\b.*\b(standard|conventional)\b', "creative vs standard")
        ]

        for pattern, description in contradiction_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append(ValidationIssue(
                    type="potential_issue",
                    severity=ValidationSeverity.WARNING,
                    message=f"Prompt contains potentially contradictory requirements: {description}",
                    suggestion="Clarify conflicting requirements or choose one approach"
                ))
                recommendations.append("Resolve contradictory requirements")
                break

        # Check for unrealistic expectations
        unrealistic_patterns = [r'\b(perfect|flawless|100%)\b.*\b(accuracy|correct|right)\b']
        if re.search(unrealistic_patterns[0], content, re.IGNORECASE):
            issues.append(ValidationIssue(
                type="potential_issue",
                severity=ValidationSeverity.INFO,
                message="Prompt sets unrealistically high expectations",
                suggestion="Set realistic expectations for AI capabilities"
            ))
            recommendations.append("Set realistic expectations for AI performance")

        passed = len([i for i in issues if i.severity == ValidationSeverity.ERROR]) == 0
        return issues, passed, recommendations

    async def _check_length_appropriateness(self, content: str) -> Tuple[List[ValidationIssue], bool, List[str]]:
        """Check if prompt length is appropriate for the task"""
        issues = []
        recommendations = []

        word_count = len(content.split())

        # Very short prompts might lack detail
        if word_count < 10:
            issues.append(ValidationIssue(
                type="length",
                severity=ValidationSeverity.WARNING,
                message="Prompt is very short and may lack sufficient detail",
                suggestion="Add more context and specific requirements"
            ))
            recommendations.append("Add more detail and context to short prompts")

        # Very long prompts might be overwhelming
        elif word_count > 500:
            issues.append(ValidationIssue(
                type="length",
                severity=ValidationSeverity.WARNING,
                message="Prompt is very long and may overwhelm the AI",
                suggestion="Consider breaking into smaller, focused prompts"
            ))
            recommendations.append("Break very long prompts into smaller, focused tasks")

        passed = len([i for i in issues if i.severity == ValidationSeverity.ERROR]) == 0
        return issues, passed, recommendations

    async def _check_instruction_clarity(self, content: str) -> Tuple[List[ValidationIssue], bool, List[str]]:
        """Check if instructions are clear and actionable"""
        issues = []
        recommendations = []

        # Check for imperative verbs (do, create, write, etc.)
        imperative_indicators = ['create', 'write', 'generate', 'analyze', 'explain', 'describe']
        has_action = any(indicator in content.lower() for indicator in imperative_indicators)

        if not has_action and len(content.split()) > 15:
            issues.append(ValidationIssue(
                type="instruction_clarity",
                severity=ValidationSeverity.INFO,
                message="Prompt could be more directive with clear action verbs",
                suggestion="Start with clear action verbs like 'Create', 'Write', 'Analyze'"
            ))
            recommendations.append("Use clear action verbs to specify what the AI should do")

        # Check for passive voice that might confuse
        passive_indicators = [' is to be ', ' should be ', ' needs to be ', ' has to be ']
        passive_count = sum(1 for indicator in passive_indicators if indicator in content.lower())

        if passive_count > 2:
            issues.append(ValidationIssue(
                type="instruction_clarity",
                severity=ValidationSeverity.INFO,
                message="Prompt uses passive voice which may be less clear",
                suggestion="Use active voice for clearer instructions"
            ))
            recommendations.append("Use active voice for clearer, more direct instructions")

        passed = True  # These are style recommendations
        return issues, passed, recommendations