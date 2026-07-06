import csv
import math
from typing import List

from worker.domain.interfaces.evaluator import IEvaluator


class CsvEvaluator(IEvaluator):
    @staticmethod
    def calculate_accuracy(y_true: List[str], y_pred: List[str]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        correct = sum(
            1 for gt, pred in zip(y_true, y_pred) if gt.strip() == pred.strip()
        )
        return correct / len(y_true)

    @staticmethod
    def calculate_rmse(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        mse = sum((gt - pred) ** 2 for gt, pred in zip(y_true, y_pred)) / len(y_true)
        return math.sqrt(mse)

    @staticmethod
    def calculate_f1(
        y_true: List[str], y_pred: List[str], positive_label: str = "1"
    ) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0

        tp = fp = fn = 0
        for gt, pred in zip(y_true, y_pred):
            gt_val = gt.strip()
            pred_val = pred.strip()
            if gt_val == positive_label and pred_val == positive_label:
                tp += 1
            elif gt_val != positive_label and pred_val == positive_label:
                fp += 1
            elif gt_val == positive_label and pred_val != positive_label:
                fn += 1

        if tp == 0:
            return 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0

        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)

    def evaluate(
        self, ground_truth_path: str, prediction_path: str, metric_type: str
    ) -> float:
        y_true = []
        with open(ground_truth_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if row:
                    y_true.append(row[0])

        y_pred = []
        with open(prediction_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if row:
                    y_pred.append(row[0])

        if len(y_true) != len(y_pred):
            raise ValueError(
                f"Length mismatch: Ground truth has {len(y_true)} rows, predictions have {len(y_pred)} rows."
            )

        metric_lower = metric_type.lower()
        if metric_lower == "accuracy":
            return self.calculate_accuracy(y_true, y_pred)
        elif metric_lower == "rmse":
            try:
                y_true_float = [float(x) for x in y_true]
                y_pred_float = [float(x) for x in y_pred]
                return self.calculate_rmse(y_true_float, y_pred_float)
            except ValueError:
                raise ValueError("RMSE metric requires numeric values in columns.")
        elif metric_lower in ("f1", "f1_score"):
            return self.calculate_f1(y_true, y_pred)
        else:
            raise ValueError(f"Unsupported metric: {metric_type}")
