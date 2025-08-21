from typing import Dict, List, Optional
from prompt.core import Prompt
from .base import StorageBackend

class InMemoryStorage(StorageBackend):
    def __init__(self):
        self.prompts: Dict[str, Prompt] = {}

    def save_prompt(self, prompt: Prompt) -> None:
        self.prompts[prompt.id] = prompt

    def load_prompt(self, prompt_id: str) -> Optional[Prompt]:
        return self.prompts.get(prompt_id)

    def list_prompts(self) -> List[str]:
        return list(self.prompts.keys())

    def delete_prompt(self, prompt_id: str) -> None:
        if prompt_id in self.prompts:
            del self.prompts[prompt_id]

    def save_all(self) -> None:
        # No-op for in-memory storage
        pass

    def load_all(self) -> None:
        # No-op for in-memory storage
        pass
