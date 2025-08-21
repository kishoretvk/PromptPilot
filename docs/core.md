# PromptPilot Core Architecture

## Overview

PromptPilot is structured for modularity and clarity. The core logic is organized into feature-based modules:

- `prompt/core.py`: Main Prompt data model, versioning, variables, run tracking.
- `prompt/versioning.py`: Version history and rollback logic.
- `prompt/variables.py`: Variable schema and validation.
- `prompt/dataset.py`: Dataset loading, validation, and synthetic data generation.
- `prompt/run.py`: Run tracking and execution logging.
- `prompt/storage/`: Storage backends (file, git, memory).

## Data Model

- **Prompt**: Represents a versioned prompt with metadata, messages, variables, LLM config, and test cases.
- **VersionHistory**: Tracks prompt versions and supports rollback.
- **VariableDefinition**: Defines and validates input variables.
- **Dataset**: Manages test data and synthetic data generation.
- **RunRecord**: Tracks prompt executions and results.

## Storage

- **FileStorage**: JSON file-based backend.
- **GitStorage**: Git-backed versioned storage.
- **InMemoryStorage**: Fast, ephemeral backend for testing.

## Extensibility

- Add new storage backends in `prompt/storage/`.
- Extend prompt schema and evaluation logic in `prompt/core.py`.

See other docs for API, CLI, and LLM integration details.
