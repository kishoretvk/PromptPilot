from typing import Dict, Any, List, Optional
from prompt.core import Prompt
from prompt.run import RunRecord

class PromptAnalytics:
    def __init__(self):
        self.usage_stats: Dict[str, int] = {}
        self.evaluations: Dict[str, List[Dict[str, Any]]] = {}

    def record_usage(self, prompt_id: str):
        self.usage_stats[prompt_id] = self.usage_stats.get(prompt_id, 0) + 1

    def add_evaluation(self, prompt_id: str, run: RunRecord, metrics: Dict[str, Any]):
        if prompt_id not in self.evaluations:
            self.evaluations[prompt_id] = []
        self.evaluations[prompt_id].append({
            "run": run,
            "metrics": metrics
        })

    def get_usage(self, prompt_id: str) -> int:
        return self.usage_stats.get(prompt_id, 0)

    def get_evaluations(self, prompt_id: str) -> List[Dict[str, Any]]:
        return self.evaluations.get(prompt_id, [])

    def average_metric(self, prompt_id: str, metric: str) -> Optional[float]:
        evals = self.get_evaluations(prompt_id)
        values = [e["metrics"].get(metric) for e in evals if metric in e["metrics"]]
        if not values:
            return None
        return sum(values) / len(values)
