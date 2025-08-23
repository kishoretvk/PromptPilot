# Contributing to PromptPilot

Thank you for your interest in contributing to PromptPilot! We welcome contributions from the community to help make this project better.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [promptpilot-team@example.com].

## 🚀 Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes with a clear message
7. Push to your fork
8. Create a pull request

## 🤝 How to Contribute

### Ways to Contribute

- **Bug Reports**: Submit detailed bug reports with reproduction steps
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Fix bugs, implement features, improve documentation
- **Documentation**: Improve existing docs or create new guides
- **Testing**: Write tests or help with manual testing
- **Community Support**: Help answer questions in discussions or issues

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/kishoretvk/PromptPilot/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) for beginner-friendly contributions.

## 💻 Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (for development)
- Redis 7+ (for development)
- Git

### Backend Setup

```bash
# Clone your fork
git clone https://github.com/your-username/PromptPilot.git
cd PromptPilot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd ui/dashboard

# Install dependencies
npm install

# Return to project root
cd ../..
```

### Database Setup

```bash
# Start PostgreSQL (using Docker)
docker-compose up -d postgres

# Run migrations
python -m alembic upgrade head
```

## 📝 Coding Standards

### Python Backend

- Follow [PEP 8](https://pep8.org/) style guide
- Use type hints for all function signatures
- Write docstrings for all public functions and classes
- Keep functions small and focused
- Use meaningful variable names
- Write unit tests for new functionality

### TypeScript/React Frontend

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for all new code
- Write JSDoc comments for complex functions
- Use functional components with hooks
- Follow component organization patterns
- Write unit tests for new components

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
feat(api): add prompt version comparison endpoint

- Implement detailed diff analysis for prompt versions
- Add field-level statistics to comparison results
- Include unit tests for new functionality

Closes #123
```

## 📥 Pull Request Process

1. **Fork and Branch**: Create a fork and work on a feature branch
2. **Code Quality**: Ensure your code follows our standards
3. **Tests**: Add or update tests as necessary
4. **Documentation**: Update documentation for any new features
5. **Commit Messages**: Use clear, descriptive commit messages
6. **Pull Request**: Submit a pull request with a clear description

### Pull Request Requirements

- All tests must pass
- Code coverage should not decrease significantly
- Documentation should be updated
- Follow the pull request template
- Be responsive to feedback during review

### Pull Request Template

```markdown
## Description

Brief description of the changes and why they're needed.

## Related Issue

Fixes #123

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Other (please describe)

## How Has This Been Tested?

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] No tests needed

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## 🐛 Reporting Issues

### Before Submitting an Issue

1. Check existing issues to avoid duplicates
2. Ensure you're using the latest version
3. Try to reproduce the issue in a clean environment

### Submitting a Good Bug Report

Include the following information:

- **Description**: Clear, concise description of the issue
- **Steps to Reproduce**: Exact steps to reproduce the problem
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: 
  - OS and version
  - Python version
  - Node.js version (for frontend issues)
  - PromptPilot version
- **Screenshots**: If applicable
- **Logs**: Relevant error messages or logs

### Feature Requests

- **Use Case**: Explain the problem you're trying to solve
- **Proposed Solution**: Describe your ideal solution
- **Alternatives Considered**: Any other approaches you've thought about
- **Additional Context**: Any other relevant information

## 🌍 Community

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and community discussion
- **Discord/Slack**: (Link to be added)
- **Twitter**: (Link to be added)

### Recognition

Contributors are recognized in:

- GitHub contributors list
- Release notes
- Project documentation

## 📚 Additional Resources

- [Documentation](docs/)
- [API Reference](http://localhost:8000/docs) (when running)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [License](LICENSE)