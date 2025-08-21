from typing import List, Optional
from model.prompt import Prompt, PromptVersion
import copy

class VersionHistory:
    def __init__(self):
        self.versions: List[PromptVersion] = []
        self.prompts: List[Prompt] = []

    def add_version(self, prompt: Prompt):
        # Deep copy to preserve state at this version
        self.versions.append(copy.deepcopy(prompt.version_info))
        self.prompts.append(copy.deepcopy(prompt))

    def get_version(self, version: str) -> Optional[Prompt]:
        for p in self.prompts:
            if p.version_info.version == version:
                return copy.deepcopy(p)
        return None

    def list_versions(self) -> List[str]:
        return [v.version for v in self.versions]

    def rollback(self, version: str) -> Optional[Prompt]:
        prompt = self.get_version(version)
        if prompt:
            self.add_version(prompt)
            return copy.deepcopy(prompt)
        return None
