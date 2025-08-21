from abc import ABC, abstractmethod
from typing import Any, List, Optional
from prompt.core import Prompt

class StorageBackend(ABC):
    @abstractmethod
    def save_prompt(self, prompt: Prompt) -> None:
        pass

    @abstractmethod
    def load_prompt(self, prompt_id: str) -> Optional[Prompt]:
        pass

    @abstractmethod
    def list_prompts(self) -> List[str]:
        pass

    @abstractmethod
    def delete_prompt(self, prompt_id: str) -> None:
        pass

    @abstractmethod
    def save_all(self) -> None:
        pass

    @abstractmethod
    def load_all(self) -> None:
        pass
