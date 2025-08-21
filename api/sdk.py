import requests
from typing import List, Dict, Any, Optional

class PromptPilotSDK:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    def create_prompt(self, prompt: Dict[str, Any]) -> Dict[str, Any]:
        resp = requests.post(f"{self.base_url}/prompts/", json=prompt)
        resp.raise_for_status()
        return resp.json()

    def list_prompts(self) -> List[str]:
        resp = requests.get(f"{self.base_url}/prompts/")
        resp.raise_for_status()
        return resp.json()

    def delete_prompt(self, prompt_id: str) -> Dict[str, Any]:
        resp = requests.delete(f"{self.base_url}/prompts/{prompt_id}")
        resp.raise_for_status()
        return resp.json()
