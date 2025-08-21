# LLM Integration in PromptPilot

## Overview

PromptPilot supports integration with multiple LLM providers through a pluggable abstraction layer.

- `llm/provider.py`: Defines the LLMProvider class and LLMRegistry for managing providers.

## Key Concepts

- **LLMProvider**: Encapsulates a provider's name and call function.
- **LLMRegistry**: Registers and manages multiple LLM providers, enabling dynamic selection and invocation.

## Usage

1. **Register a Provider**
   ```python
   from llm.provider import LLMRegistry

   def openai_call(prompt, params):
       # Call OpenAI API here
       pass

   registry = LLMRegistry()
   registry.register("openai", openai_call)
   ```

2. **Call a Provider**
   ```python
   result = registry.call("openai", "Prompt text", {"temperature": 0.7})
   ```

## Extending

- Add new providers by implementing a call function and registering it with the registry.
- Supports OpenAI, Gemini, Anthropic, Mistral, Claude, Ollama, and more.

See `query.py` for prompt rendering and execution logic.
