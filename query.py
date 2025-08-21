from typing import Dict, Any, Optional
from model.prompt import Prompt
from llm import LLMRegistry

def render_prompt(prompt: Prompt, variables: Dict[str, Any]) -> str:
    # Simple variable injection for user message content
    rendered_messages = []
    for msg in sorted(prompt.messages, key=lambda m: m.priority):
        content = msg.content
        if msg.role == "user":
            for var, value in variables.items():
                content = content.replace("{" + var + "}", str(value))
        rendered_messages.append(f"{msg.role.upper()}: {content}")
    return "\n".join(rendered_messages)

def execute_prompt(
    prompt: Prompt,
    variables: Dict[str, Any],
    llm_registry: LLMRegistry,
    parameters: Optional[Dict[str, Any]] = None,
) -> Any:
    prompt_text = render_prompt(prompt, variables)
    provider = prompt.model_provider
    model_params = prompt.parameters.copy()
    if parameters:
        model_params.update(parameters)
    return llm_registry.call(provider, prompt_text, model_params)
