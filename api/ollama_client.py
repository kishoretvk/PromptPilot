import requests

OLLAMA_BASE_URL = "http://localhost:11434"

def list_ollama_models():
    """Fetch all available Ollama models (tags) from the local Ollama server."""
    resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
    resp.raise_for_status()
    data = resp.json()
    # Returns a list of model dicts with 'name', 'size', etc.
    return data.get("models", [])

def pull_ollama_model(model_name: str):
    """Pull a model from the Ollama registry."""
    resp = requests.post(f"{OLLAMA_BASE_URL}/api/pull", json={"name": model_name})
    resp.raise_for_status()
    return resp.json()

def generate_with_ollama(model: str, prompt: str, options: dict = None):
    """Generate a response using a specific Ollama model."""
    payload = {
        "model": model,
        "prompt": prompt,
    }
    if options:
        payload.update(options)
    resp = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
    resp.raise_for_status()
    return resp.json()

def list_running_ollama_models():
    """List currently loaded/running Ollama models."""
    resp = requests.get(f"{OLLAMA_BASE_URL}/api/ps")
    resp.raise_for_status()
    return resp.json().get("models", [])

def chat_with_ollama(model: str, messages: list, options: dict = None):
    """Chat completion with Ollama model."""
    payload = {
        "model": model,
        "messages": messages,
    }
    if options:
        payload.update(options)
    resp = requests.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
    resp.raise_for_status()
    return resp.json()
