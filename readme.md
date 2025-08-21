# PromptPilot

PromptPilot is a modular, production-ready framework for managing, testing, and deploying LLM prompts and pipelines. It supports multi-backend storage, advanced pipeline orchestration, analytics, and integrations for real-world LLM workflows.

---

## Features

- **Core Data Models:** Hierarchical prompt structure, versioning, variables, test cases, and evaluation.
- **Storage Backends:** File, Git (with versioning), and in-memory support.
- **LLM Abstraction:** Provider registry for OpenAI, Ollama, Gemini, Anthropic, and more.
- **Pipeline Orchestration:** Advanced async pipelines with error handling, branching, retries, and state.
- **CLI, REST API, and Python SDK:** Multiple developer interfaces for prompt management and execution.
- **Analytics & Evaluation:** Usage tracking, evaluation metrics, and prompt quality scoring.
- **Agent Integrations:** Scaffolding for LangChain, Haystack, and custom agent frameworks.
- **Web UI Planning:** Placeholder for a React/Vue dashboard.
- **CI/CD Ready:** GitHub Actions, linting, and test automation.
- **Comprehensive Documentation:** Usage guides, API reference, and examples.

---

## Quickstart

```sh
git clone https://github.com/kishoretvk/PromptPilot.git
cd PromptPilot
pip install -r requirements.txt
python -m cli.main --storage file list
uvicorn api.rest:app --reload
```

See `docs/quickstart.md` and `docs/getting-started.md` for more.

---

## Example: Advanced Pipeline

```python
from prompt.pipeline import AdvancedLLMPipeline, PipelineStep, ErrorStrategy
from prompt.core import Prompt

# Define prompts and steps...
pipeline = AdvancedLLMPipeline(
    steps=[
        PipelineStep(prompt1),
        PipelineStep(prompt2, transform=lambda out: {"text_input": out["result"]}, max_retries=2),
    ],
    error_strategy=ErrorStrategy.RETRY
)
# Run pipeline asynchronously
# result = asyncio.run(pipeline.run_async({"text_input": "start"}, executor))
```

---

## Roadmap

- [x] Core, storage, LLM, CLI, API, SDK, refactor
- [x] Documentation and examples
- [x] CI/CD and GitHub finalization
- [x] Analytics and evaluation scaffolding
- [x] Agent framework integration scaffolding
- [x] Web UI/dashboard planning
- [x] LLM pipelines for advanced usage
- [x] Add advanced pipeline features (error handling, branching, retries, async, state)
- [x] Upgrade core prompt structure (hierarchical messages, evaluation, compilation)
- [ ] Implement web UI/dashboard
- [ ] Expand analytics, evaluation, and visualization
- [ ] Build out agent integrations
- [ ] Expand tests and examples (integration, real LLMs)
- [ ] Gather feedback and iterate

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT License. See [LICENSE](LICENSE).
