# Prompt Execution and Query Logic

## Overview

PromptPilot supports flexible prompt rendering, variable injection, and LLM query execution.

- Query logic: `query.py`

## Key Concepts

- **render_prompt**: Combines prompt messages and injects variables into user message templates.
- **execute_prompt**: Renders the prompt, selects the LLM provider, and executes the query.

## Usage

```python
from prompt.core import Prompt
from llm.provider import LLMRegistry
from query import render_prompt, execute_prompt

# Prepare prompt and variables
prompt = ...  # Load or create a Prompt object
variables = {"text_input": "Example input"}

# Register LLM provider
registry = LLMRegistry()
registry.register("openai", openai_call_function)

# Render prompt
prompt_text = render_prompt(prompt, variables)
print(prompt_text)

# Execute prompt
result = execute_prompt(prompt, variables, registry)
print(result)
```

## Extending

- Add new message roles or rendering logic in `render_prompt`.
- Add new LLM providers in `llm/provider.py`.
- Customize query execution logic in `execute_prompt`.

See LLM and core docs for more details.
