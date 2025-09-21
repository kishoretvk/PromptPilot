#!/usr/bin/env python3
import requests
import json
import time
import sys

BASE = "http://localhost:8000/api/v1"
PROMPT = {
    "name": "E2E Ollama Test Prompt",
    "description": "Created by integration runner",
    "task_type": "text-generation",
    "tags": ["integration", "e2e"],
    "developer_notes": "auto",
    "messages": [{"role": "user", "content": "Say hello from Ollama!", "priority": 1}],
    "input_variables": {},
    "model_provider": "ollama",
    "model_name": "mistral:latest",
    "parameters": {"temperature": 0.1, "max_tokens": 150}
}

def pretty(obj):
    try:
        return json.dumps(obj, indent=2)
    except Exception:
        return str(obj)

def main():
    try:
        r = requests.post(f"{BASE}/prompts", json=PROMPT, timeout=60)
        print("CREATE_STATUS", r.status_code)
        print(pretty(r.json() if r.headers.get("content-type","").startswith("application/json") else r.text))
        r.raise_for_status()
    except Exception as e:
        print("CREATE_ERROR", type(e).__name__, str(e))
        sys.exit(1)

    prompt_id = r.json().get("id")
    if not prompt_id:
        print("No prompt id returned")
        sys.exit(1)

    # short pause to allow any background processing
    time.sleep(1)

    try:
        t = requests.post(
            f"{BASE}/prompts/{prompt_id}/test",
            json={"input_variables": {}, "model_parameters": {"timeout": 300}},
            timeout=310
        )
        print("TEST_STATUS", t.status_code)
        try:
            print(pretty(t.json()))
        except Exception:
            print(t.text)
    except Exception as e:
        print("TEST_ERROR", type(e).__name__, str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
