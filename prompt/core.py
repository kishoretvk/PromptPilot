from typing import List, Dict, Optional, Any
from datetime import datetime

class Message:
    def __init__(self, role: str, content: str, priority: int):
        self.role = role  # system, developer, user, assistant
        self.content = content
        self.priority = priority

class PromptVersion:
    def __init__(
        self,
        version: str,
        status: str,
        author: str,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
        commit_ref: Optional[str] = None,
    ):
        self.version = version
        self.status = status  # DRAFT, STAGING, PUBLISHED, ARCHIVED, DEPRECATED
        self.author = author
        self.created_at = created_at or datetime.utcnow().isoformat()
        self.updated_at = updated_at or self.created_at
        self.commit_ref = commit_ref

class TestCase:
    def __init__(
        self,
        name: str,
        inputs: Dict[str, Any],
        expected_outputs: Any,
        test_type: str = "functional",
        evaluation_metrics: Optional[Dict[str, Any]] = None,
    ):
        self.name = name
        self.inputs = inputs
        self.expected_outputs = expected_outputs
        self.test_type = test_type
        self.evaluation_metrics = evaluation_metrics or {}

class Prompt:
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        task_type: str,
        tags: List[str],
        developer_notes: Optional[str],
        version_info: PromptVersion,
        messages: List[Message],
        input_variables: Dict[str, Any],
        final_prompt_structure: Optional[str],
        model_provider: str,
        model_name: str,
        parameters: Dict[str, Any],
        test_cases: Optional[List[TestCase]] = None,
        evaluation_metrics: Optional[Dict[str, Any]] = None,
        execution_order: Optional[List[str]] = None,
        fallback_prompts: Optional[List[str]] = None,
        rate_limits: Optional[Dict[str, Any]] = None,
        deployment_targets: Optional[List[str]] = None,
        custom_fields: Optional[Dict[str, Any]] = None,
    ):
        self.id = id
        self.name = name
        self.description = description
        self.task_type = task_type
        self.tags = tags
        self.developer_notes = developer_notes
        self.version_info = version_info
        self.messages = sorted(messages, key=lambda m: m.priority)
        self.input_variables = input_variables
        self.final_prompt_structure = final_prompt_structure
        self.model_provider = model_provider
        self.model_name = model_name
        self.parameters = parameters
        self.test_cases = test_cases or []
        self.evaluation_metrics = evaluation_metrics or {}
        self.execution_order = execution_order or []
        self.fallback_prompts = fallback_prompts or []
        self.rate_limits = rate_limits or {}
        self.deployment_targets = deployment_targets or []
        self.custom_fields = custom_fields or {}

    def compile_prompt(self, variables: Dict[str, Any]) -> str:
        # Hierarchical message system: system → developer → user → assistant (examples)
        compiled = []
        for msg in self.messages:
            content = msg.content
            if msg.role == "user":
                for var, value in variables.items():
                    content = content.replace("{" + var + "}", str(value))
            compiled.append(f"{msg.role.upper()}: {content}")
        return "\n".join(compiled)

    def run_test_cases(self, executor) -> List[Dict[str, Any]]:
        results = []
        for test in self.test_cases:
            prompt_text = self.compile_prompt(test.inputs)
            try:
                output = executor(prompt_text, self.parameters)
                passed = output == test.expected_outputs
                metrics = test.evaluation_metrics.copy()
                metrics["passed"] = passed
                results.append({
                    "test": test.name,
                    "passed": passed,
                    "output": output,
                    "expected": test.expected_outputs,
                    "metrics": metrics
                })
            except Exception as e:
                results.append({
                    "test": test.name,
                    "passed": False,
                    "error": str(e)
                })
        return results

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "task_type": self.task_type,
            "tags": self.tags,
            "developer_notes": self.developer_notes,
            "version_info": vars(self.version_info),
            "messages": [vars(m) for m in self.messages],
            "input_variables": self.input_variables,
            "final_prompt_structure": self.final_prompt_structure,
            "model_provider": self.model_provider,
            "model_name": self.model_name,
            "parameters": self.parameters,
            "test_cases": [vars(tc) for tc in self.test_cases],
            "evaluation_metrics": self.evaluation_metrics,
            "execution_order": self.execution_order,
            "fallback_prompts": self.fallback_prompts,
            "rate_limits": self.rate_limits,
            "deployment_targets": self.deployment_targets,
            "custom_fields": self.custom_fields,
        }
