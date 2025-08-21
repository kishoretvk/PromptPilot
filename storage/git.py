import os
import json
import subprocess
from typing import List, Optional
from model.prompt import Prompt
from .base import StorageBackend

class GitStorage(StorageBackend):
    def __init__(self, directory: str = "prompts"):
        self.directory = directory
        os.makedirs(self.directory, exist_ok=True)
        if not os.path.exists(os.path.join(self.directory, ".git")):
            subprocess.run(["git", "init"], cwd=self.directory)

    def _get_path(self, prompt_id: str) -> str:
        return os.path.join(self.directory, f"{prompt_id}.json")

    def save_prompt(self, prompt: Prompt) -> None:
        path = self._get_path(prompt.id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(prompt.to_dict(), f, indent=2)
        subprocess.run(["git", "add", path], cwd=self.directory)
        subprocess.run(
            ["git", "commit", "-m", f"Update prompt {prompt.id}"], cwd=self.directory
        )

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
            subprocess.run(["git", "rm", path], cwd=self.directory)
            subprocess.run(
                ["git", "commit", "-m", f"Delete prompt {prompt_id}"], cwd=self.directory
            )

    def save_all(self) -> None:
        subprocess.run(["git", "add", "."], cwd=self.directory)
        subprocess.run(["git", "commit", "-m", "Save all prompts"], cwd=self.directory)

    def load_all(self) -> None:
        # No-op for git storage (prompts are loaded individually)
        pass
