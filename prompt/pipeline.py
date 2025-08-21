"""
Advanced LLM Pipeline Module for PromptPilot

Supports multi-step, branching, error-handling, and async prompt workflows.
"""

import asyncio
import time
from typing import List, Dict, Any, Callable, Optional
from dataclasses import dataclass
from enum import Enum
from prompt.core import Prompt

class ErrorStrategy(Enum):
    FAIL_FAST = "fail_fast"
    CONTINUE = "continue"
    RETRY = "retry"

@dataclass
class PipelineResult:
    success: bool
    results: List[Any]
    errors: List[Exception]
    execution_time: float

class PipelineStep:
    def __init__(
        self,
        prompt: Prompt,
        transform: Optional[Callable[[Any], Dict[str, Any]]] = None,
        condition: Optional[Callable[[Any], bool]] = None,
        on_fail: Optional['PipelineStep'] = None,
        max_retries: int = 0
    ):
        self.prompt = prompt
        self.transform = transform
        self.condition = condition  # For branching
        self.on_fail = on_fail
        self.max_retries = max_retries

class AdvancedLLMPipeline:
    def __init__(
        self,
        steps: List[PipelineStep],
        error_strategy: ErrorStrategy = ErrorStrategy.FAIL_FAST
    ):
        self.steps = steps
        self.error_strategy = error_strategy

    async def run_async(
        self,
        input_vars: Dict[str, Any],
        executor: Callable[[Prompt, Dict[str, Any]], Any]
    ) -> PipelineResult:
        results = []
        errors = []
        current_vars = input_vars.copy()
        start_time = time.time()

        for i, step in enumerate(self.steps):
            attempt = 0
            while attempt <= step.max_retries:
                try:
                    output = await self._execute_step(step, current_vars, executor)
                    results.append(output)
                    if step.transform:
                        current_vars = step.transform(output)
                    # Branching: if condition is set, decide next step
                    if step.condition is not None:
                        if step.condition(output):
                            break  # Continue to next step
                        elif step.on_fail:
                            # Run on_fail step
                            fail_output = await self._execute_step(step.on_fail, current_vars, executor)
                            results.append(fail_output)
                    break  # Success, move to next step
                except Exception as e:
                    errors.append(e)
                    attempt += 1
                    if self.error_strategy == ErrorStrategy.FAIL_FAST:
                        return PipelineResult(
                            success=False,
                            results=results,
                            errors=errors,
                            execution_time=time.time() - start_time
                        )
                    elif self.error_strategy == ErrorStrategy.RETRY and attempt <= step.max_retries:
                        continue
                    elif self.error_strategy == ErrorStrategy.CONTINUE:
                        break

        return PipelineResult(
            success=len(errors) == 0,
            results=results,
            errors=errors,
            execution_time=time.time() - start_time
        )

    async def _execute_step(self, step: PipelineStep, vars: Dict[str, Any], executor: Callable):
        # If executor is async, await it; else, run in thread
        if asyncio.iscoroutinefunction(executor):
            return await executor(step.prompt, vars)
        else:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, executor, step.prompt, vars)

    def add_conditional_step(self, condition: Callable, true_step: PipelineStep, false_step: PipelineStep):
        # Add a conditional branch to the pipeline
        self.steps.append(
            PipelineStep(
                prompt=true_step.prompt,
                transform=true_step.transform,
                condition=condition,
                on_fail=false_step
            )
        )

# Example usage:
# pipeline = AdvancedLLMPipeline([
#     PipelineStep(prompt1),
#     PipelineStep(prompt2, transform=lambda out: {"text_input": out["result"]}, max_retries=2),
# ])
# result = asyncio.run(pipeline.run_async({"text_input": "start"}, executor))
