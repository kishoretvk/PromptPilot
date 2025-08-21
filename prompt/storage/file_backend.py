import os
import json
from typing import List, Optional
from prompt.core import Prompt
from .base import StorageBackend

class FileStorage(StorageBackend):
    def __init__(self, directory: str = "prompts"):
        self.directory = directory
        os.makedirs(self.directory, exist_ok=True)

    def _get_path(self, prompt_id: str) -> str:
        return os.path.join(self.directory, f"{prompt_id}.json")

    def save_prompt(self, prompt: Prompt) -> None:
        path = self._get_path(prompt.id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(prompt.to_dict(), f, indent=2)

    def load_prompt(self, prompt_id: str) -> Optional[Prompt]:
        path = self._get_path(prompt_id)
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # For now, return the raw dict; integration with Prompt class can be improved
        return data

    def list_prompts(self) -> List[str]:
        return [
            fname[:-5]
            for fname in os.listdir(self.directory)
            if fname.endswith(".json")
        ]

    def delete_prompt(self, prompt_id: str) -> None:
        path = self._get_path(prompt_id)
        if os.path.exists(path):
            os.remove(path)

    def save_all(self) -> None:
        # No-op for file storage (each prompt is saved individually)
        pass

    def load_all(self) -> None:
        # No-op for file storage (prompts are loaded individually)
        pass
