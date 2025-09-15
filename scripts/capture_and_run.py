#!/usr/bin/env python3
import requests, subprocess, sys, time

def check_ollama():
    try:
        print("OLLAMA /api/ps:")
        print(requests.get("http://localhost:11434/api/ps", timeout=5).text)
    except Exception as e:
        print("OLLAMA /api/ps error:", e)
    try:
        print("OLLAMA /api/tags:")
        print(requests.get("http://localhost:11434/api/tags", timeout=5).text)
    except Exception as e:
        print("OLLAMA /api/tags error:", e)

if __name__ == "__main__":
    check_ollama()
    print("Starting PromptPilot API (uvicorn) in foreground — use Ctrl+C to stop")
    # Start uvicorn in the foreground so logs stream here
    subprocess.run([sys.executable, "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"])
