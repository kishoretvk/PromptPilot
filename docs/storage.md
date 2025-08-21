# Storage Backends in PromptPilot

## Overview

PromptPilot supports multiple storage backends for managing prompt data and versioning.

- Storage backends are implemented in `prompt/storage/`.

## Available Backends

- **FileStorage (`file_backend.py`)**: Stores each prompt as a JSON file in a directory.
- **GitStorage (`git_backend.py`)**: Stores prompts as JSON files and uses git for versioning and history.
- **InMemoryStorage (`memory_backend.py`)**: Stores prompts in memory for fast prototyping and testing.

## Usage

### File Storage (default)

```python
from prompt.storage.file_backend import FileStorage
storage = FileStorage(directory="prompts")
```

### Git Storage

```python
from prompt.storage.git_backend import GitStorage
storage = GitStorage(directory="prompts")
```

### In-Memory Storage

```python
from prompt.storage.memory_backend import InMemoryStorage
storage = InMemoryStorage()
```

## CLI Integration

Use the `--storage` flag to select the backend:

```sh
python -m cli.main --storage file create ...
python -m cli.main --storage git list
python -m cli.main --storage inmemory delete --id myprompt
```

## Extending

- Add new backends by subclassing `prompt/storage/base.py`.
- Update CLI and API to support new backends as needed.

See core docs for prompt data model details.
