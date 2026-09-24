from abc import ABC, abstractmethod


class IEvaluator(ABC):
    @abstractmethod
    def evaluate(self, ground_truth_path: str, prediction_path: str, metric_type: str) -> float:
        """
        Evaluates a prediction file against the ground truth and returns a score.
        """
        pass
