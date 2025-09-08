import requests

BASE_URL = "http://localhost:8000/api/v1/ollama"

def test_list_ollama_models():
    resp = requests.get(f"{BASE_URL}/models")
    assert resp.status_code == 200
    data = resp.json()
    assert "models" in data
    assert isinstance(data["models"], list)

def test_generate_with_ollama():
    # Use the first available model for testing
    models_resp = requests.get(f"{BASE_URL}/models")
    assert models_resp.status_code == 200
    models = models_resp.json().get("models", [])
    assert models, "No Ollama models available for testing"
    model_name = models[0]["name"]

    payload = {
        "model": model_name,
        "prompt": "Say hello from Ollama!",
        "options": {"temperature": 0.1}
    }
    resp = requests.post(f"{BASE_URL}/generate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "response" in data or "output" in data

def test_chat_with_ollama():
    models_resp = requests.get(f"{BASE_URL}/models")
    assert models_resp.status_code == 200
    models = models_resp.json().get("models", [])
    assert models, "No Ollama models available for testing"
    model_name = models[0]["name"]

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is the capital of France?"}
        ],
        "options": {"temperature": 0.1}
    }
    resp = requests.post(f"{BASE_URL}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data or "response" in data
