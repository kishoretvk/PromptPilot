from typing import Dict, Any, Optional, Callable

class LLMProvider:
    def __init__(self, name: str, call_fn: Callable[[str, Dict[str, Any]], Any]):
        self.name = name
        self.call_fn = call_fn

    def call(self, prompt: str, parameters: Dict[str, Any]) -> Any:
        return self.call_fn(prompt, parameters)

class LLMRegistry:
    def __init__(self):
        self.providers: Dict[str, LLMProvider] = {}

    def register(self, name: str, call_fn: Callable[[str, Dict[str, Any]], Any]):
        self.providers[name] = LLMProvider(name, call_fn)

    def get(self, name: str) -> Optional[LLMProvider]:
        return self.providers.get(name)

    def call(self, name: str, prompt: str, parameters: Dict[str, Any]) -> Any:
        provider = self.get(name)
        if not provider:
            raise ValueError(f"LLM provider '{name}' not registered")
        return provider.call(prompt, parameters)

# Example usage:
# registry = LLMRegistry()
# registry.register("openai", openai_call_function)
# result = registry.call("openai", "Prompt text", {"temperature": 0.7})
