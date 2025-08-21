# PromptPilot CLI

## Overview

The PromptPilot CLI provides command-line tools for managing prompts, storage backends, and prompt metadata.

- CLI entrypoint: `cli/main.py`

## Usage

```sh
python -m cli.main [--storage file|inmemory|git] <command> [options]
```

### Commands

- `create` — Create a new prompt
  - `--id` (required): Unique prompt ID
  - `--name` (required): Prompt name
  - `--description` (required): Description
  - `--task_type` (required): Task type (e.g., classification, generation)
  - `--tags`: List of tags
  - `--model_provider` (required): LLM provider
  - `--model_name` (required): Model name

- `list` — List all prompts

- `delete` — Delete a prompt
  - `--id` (required): Prompt ID

### Storage Backends

- `--storage file` (default): Use file-based storage
- `--storage inmemory`: Use in-memory storage
- `--storage git`: Use git-backed storage

## Examples

```sh
python -m cli.main --storage file create --id myprompt --name "My Prompt" --description "Test" --task_type classification --model_provider openai --model_name gpt-4
python -m cli.main list
python -m cli.main delete --id myprompt
```

## Extending

- Add new commands in `cli/main.py`.
- Update storage logic by extending backends in `prompt/storage/`.

See API and SDK docs for programmatic access.
