# PromptPilot Quickstart

## 1. Install and Set Up

```sh
git clone https://github.com/your-org/PromptPilot.git
cd PromptPilot
pip install -r requirements.txt
```

## 2. Create a Prompt (CLI)

```sh
python -m cli.main create --id hello --name "Hello Prompt" --description "A test prompt" --task_type generation --model_provider openai --model_name gpt-4
```

## 3. List Prompts

```sh
python -m cli.main list
```

## 4. Delete a Prompt

```sh
python -m cli.main delete --id hello
```

## 5. Run the API

```sh
uvicorn api.rest:app --reload
```

## 6. Use the Python SDK

```python
from api.sdk import PromptPilotSDK
sdk = PromptPilotSDK()
sdk.create_prompt({...})
print(sdk.list_prompts())
```

## Next Steps

- Explore storage backends: `--storage file|inmemory|git`
- See `docs/` for advanced usage, API, and LLM integration.
