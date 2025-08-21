# Getting Started with PromptPilot

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-org/PromptPilot.git
   cd PromptPilot
   ```

2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```

## Directory Structure

- `prompt/`: Core logic, data models, storage backends
- `llm/`: LLM provider abstraction
- `cli/`: Command-line interface
- `api/`: REST API and Python SDK
- `docs/`: Documentation
- `examples/`: Example notebooks

## Running the CLI

```sh
python -m cli.main --storage file list
```

## Running the API

```sh
uvicorn api.rest:app --reload
```

## Using the Python SDK

See `docs/python-api.md` for usage examples.

## Next Steps

- Create your first prompt using the CLI or API.
- Explore storage backends and LLM integrations.
- See the documentation for advanced features and customization.
