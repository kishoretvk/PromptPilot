from typing import Dict, Any, List, Optional
from datetime import datetime

class RunRecord:
    def __init__(
        self,
        prompt_id: str,
        version: str,
        input_vars: Dict[str, Any],
        output: Any,
        llm_response: Any,
        status: str,
        started_at: Optional[str] = None,
        finished_at: Optional[str] = None,
        metrics: Optional[Dict[str, Any]] = None,
    ):
        self.prompt_id = prompt_id
        self.version = version
        self.input_vars = input_vars
        self.output = output
        self.llm_response = llm_response
        self.status = status  # SUCCESS, FAILURE, TIMEOUT, etc.
        self.started_at = started_at or datetime.utcnow().isoformat()
        self.finished_at = finished_at or self.started_at
        self.metrics = metrics or {}

class RunTracker:
    def __init__(self):
        self.runs: List[RunRecord] = []

    def log_run(self, run: RunRecord):
        self.runs.append(run)

    def get_runs(self, prompt_id: Optional[str] = None) -> List[RunRecord]:
        if prompt_id:
            return [r for r in self.runs if r.prompt_id == prompt_id]
        return self.runs

    def get_latest_run(self, prompt_id: str) -> Optional[RunRecord]:
        runs = [r for r in self.runs if r.prompt_id == prompt_id]
        if runs:
            return sorted(runs, key=lambda r: r.started_at)[-1]
        return None
