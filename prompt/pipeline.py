"""
LLM Pipeline Module for PromptPilot

Supports advanced multi-step, chaining, and conditional prompt workflows.
"""

from typing import List, Dict, Any, Callable, Optional
from prompt.core import Prompt

class PipelineStep:
    def __init__(self, prompt: Prompt, transform: Optional[Callable[[Any], Any]] = None):
        self.prompt = prompt
        self.transform = transform  # Function to process output before passing to next step

class LLMPipeline:
    def __init__(self, steps: List[PipelineStep]):
        self.steps = steps

    def run(self, input_vars: Dict[str, Any], executor: Callable[[Prompt, Dict[str, Any]], Any]) -> List[Any]:
        results = []
        current_vars = input_vars.copy()
        for step in self.steps:
            output = executor(step.prompt, current_vars)
            if step.transform:
                current_vars = step.transform(output)
            results.append(output)
        return results

# Example usage:
# pipeline = LLMPipeline([
#     PipelineStep(prompt1),
#     PipelineStep(prompt2, transform=lambda out: {"text_input": out["result"]}),
# ])
# results = pipeline.run({"text_input": "start"}, executor)
