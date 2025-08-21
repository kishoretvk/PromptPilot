# PromptPilot Python SDK

## Overview

The PromptPilot Python SDK provides programmatic access to prompt management and execution via the REST API.

- SDK entrypoint: `api/sdk.py`

## Usage

```python
from api.sdk import PromptPilotSDK

sdk = PromptPilotSDK(base_url="http://localhost:8000")

# Create a prompt
prompt = {
    "id": "myprompt",
    "name": "My Prompt",
    "description": "Test prompt",
    "task_type": "classification",
    "tags": ["test"],
    "model_provider": "openai",
    "model_name": "gpt-4"
}
sdk.create_prompt(prompt)

# List prompts
prompts = sdk.list_prompts()
print(prompts)

# Delete a prompt
sdk.delete_prompt("myprompt")
```

## Methods

- `create_prompt(prompt: Dict[str, Any]) -> Dict[str, Any]`
- `list_prompts() -> List[str]`
- `delete_prompt(prompt_id: str) -> Dict[str, Any]`

## Extending

- Add new API endpoints in `api/rest.py` and corresponding SDK methods in `api/sdk.py`.
- See CLI and REST API docs for more options.
