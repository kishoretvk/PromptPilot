# PromptPilot Examples

This directory contains example prompts, pipelines, and configurations to help you get started with PromptPilot.

## 📁 Directory Structure

```
examples/
├── prompts/           # Example prompts for various use cases
├── pipelines/         # Example pipelines combining multiple prompts
├── configurations/    # Example provider and settings configurations
└── datasets/          # Sample datasets for testing prompts
```

## 🎯 Example Prompts

### 1. Email Generation
**File**: [prompts/email-generator.json](prompts/email-generator.json)

A prompt template for generating professional emails based on recipient and topic.

```json
{
  "name": "Professional Email Generator",
  "description": "Generate professional emails with proper tone and structure",
  "task_type": "text-generation",
  "tags": ["email", "professional", "communication"],
  "messages": [
    {
      "role": "system",
      "content": "You are a professional communication assistant. Generate concise, polite, and effective emails."
    },
    {
      "role": "user",
      "content": "Write an email to {{recipient}} about {{topic}}. The tone should be {{tone}}."
    }
  ],
  "input_variables": {
    "recipient": "string",
    "topic": "string",
    "tone": "string"
  },
  "model_provider": "OpenAI",
  "model_name": "gpt-4",
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

### 2. Code Review
**File**: [prompts/code-review.json](prompts/code-review.json)

A prompt for reviewing code for best practices, security, and performance.

```json
{
  "name": "Code Review Assistant",
  "description": "Review code for best practices, security issues, and performance improvements",
  "task_type": "code-review",
  "tags": ["code", "review", "security"],
  "messages": [
    {
      "role": "system",
      "content": "You are a senior software engineer specializing in code reviews. Focus on best practices, security, and performance."
    },
    {
      "role": "user",
      "content": "Review this {{language}} code and provide feedback:\n\n{{code}}"
    }
  ],
  "input_variables": {
    "language": "string",
    "code": "string"
  },
  "model_provider": "Anthropic",
  "model_name": "claude-3-opus",
  "parameters": {
    "temperature": 0.3,
    "max_tokens": 1000
  }
}
```

## 🔗 Example Pipelines

### 1. Content Creation Workflow
**File**: [pipelines/content-creation.json](pipelines/content-creation.json)

A pipeline that generates content and then reviews it.

```json
{
  "name": "Content Creation Workflow",
  "description": "Generate content and review it for quality",
  "steps": [
    {
      "name": "Generate Content",
      "step_type": "prompt",
      "prompt_id": "content-generator",
      "input_mapping": {
        "topic": "input.topic"
      },
      "output_mapping": {
        "generated_content": "intermediate.draft"
      }
    },
    {
      "name": "Review Content",
      "step_type": "prompt",
      "prompt_id": "content-reviewer",
      "input_mapping": {
        "content": "intermediate.draft"
      },
      "output_mapping": {
        "final_content": "output.final"
      }
    }
  ],
  "error_strategy": "fail_fast"
}
```

## ⚙️ Example Configurations

### 1. Provider Configuration
**File**: [configurations/providers.json](configurations/providers.json)

Configuration for multiple LLM providers.

```json
{
  "providers": [
    {
      "name": "OpenAI",
      "display_name": "OpenAI",
      "base_url": "https://api.openai.com/v1",
      "supported_models": [
        "gpt-4",
        "gpt-3.5-turbo",
        "gpt-4-turbo"
      ],
      "default_parameters": {
        "temperature": 0.7,
        "max_tokens": 1000
      }
    },
    {
      "name": "Anthropic",
      "display_name": "Anthropic",
      "base_url": "https://api.anthropic.com/v1",
      "supported_models": [
        "claude-3-opus",
        "claude-3-sonnet",
        "claude-3-haiku"
      ],
      "default_parameters": {
        "temperature": 0.7,
        "max_tokens": 1000
      }
    }
  ]
}
```

## 📊 Usage

To import examples into your PromptPilot instance:

1. **Import a prompt**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/prompts/import \
     -H "Content-Type: application/json" \
     -d @examples/prompts/email-generator.json
   ```

2. **Import a pipeline**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/pipelines/import \
     -H "Content-Type: application/json" \
     -d @examples/pipelines/content-creation.json
   ```

3. **Import configurations**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/settings/providers/import \
     -H "Content-Type: application/json" \
     -d @examples/configurations/providers.json
   ```

## 🤝 Contributing Examples

We welcome contributions of new examples! To contribute:

1. Fork the repository
2. Add your example to the appropriate directory
3. Update this README with documentation
4. Submit a pull request

Make sure your examples:
- Are well-documented
- Follow best practices
- Include sample input/output when applicable
- Are tested and working

## 📚 Resources

- [PromptPilot Documentation](../docs/README.md)
- [API Reference](../docs/API.md)
- [User Guide](../docs/USER_GUIDE.md)