import csv
import math
import os
from typing import Any, List

from loguru import logger

from worker_hackathon.domain.interfaces.evaluator import IEvaluator


class CsvEvaluator(IEvaluator):
    def __init__(self, prefer_gpu: bool = True) -> None:
        self._prefer_gpu = prefer_gpu
        self._require_gpu = os.getenv("CSV_EVALUATOR_REQUIRE_GPU", "").lower() in {
            "1",
            "true",
            "yes",
        }
        self._cupy = self._load_cupy() if prefer_gpu else None

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
    def calculate_mse(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        return sum((gt - pred) ** 2 for gt, pred in zip(y_true, y_pred)) / len(y_true)

    @staticmethod
    def calculate_mae(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        return sum(abs(gt - pred) for gt, pred in zip(y_true, y_pred)) / len(y_true)

    @staticmethod
    def calculate_r2(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        mean_true = sum(y_true) / len(y_true)
        total = sum((value - mean_true) ** 2 for value in y_true)
        residual = sum((gt - pred) ** 2 for gt, pred in zip(y_true, y_pred))
        return 0.0 if total == 0 else 1 - residual / total

    @staticmethod
    def calculate_mape(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        epsilon = 1e-15
        return sum(
            abs((gt - pred) / max(abs(gt), epsilon)) for gt, pred in zip(y_true, y_pred)
        ) / len(y_true)

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

    @staticmethod
    def calculate_precision(
        y_true: List[str], y_pred: List[str], positive_label: str = "1"
    ) -> float:
        tp = sum(
            gt.strip() == positive_label and pred.strip() == positive_label
            for gt, pred in zip(y_true, y_pred)
        )
        fp = sum(
            gt.strip() != positive_label and pred.strip() == positive_label
            for gt, pred in zip(y_true, y_pred)
        )
        return tp / (tp + fp) if tp + fp else 0.0

    @staticmethod
    def calculate_recall(
        y_true: List[str], y_pred: List[str], positive_label: str = "1"
    ) -> float:
        tp = sum(
            gt.strip() == positive_label and pred.strip() == positive_label
            for gt, pred in zip(y_true, y_pred)
        )
        fn = sum(
            gt.strip() == positive_label and pred.strip() != positive_label
            for gt, pred in zip(y_true, y_pred)
        )
        return tp / (tp + fn) if tp + fn else 0.0

    @classmethod
    def calculate_multiclass_average(
        cls,
        y_true: List[str],
        y_pred: List[str],
        *,
        average: str,
    ) -> float:
        labels = sorted({value.strip() for value in y_true})
        if not labels:
            return 0.0
        values: list[tuple[float, int]] = []
        for label in labels:
            precision = cls.calculate_precision(y_true, y_pred, label)
            recall = cls.calculate_recall(y_true, y_pred, label)
            f1 = (
                2 * precision * recall / (precision + recall)
                if precision + recall
                else 0.0
            )
            support = sum(value.strip() == label for value in y_true)
            values.append((f1, support))
        if average == "weighted":
            total = sum(support for _, support in values)
            return sum(value * support for value, support in values) / total
        return sum(value for value, _ in values) / len(values)

    @classmethod
    def calculate_balanced_accuracy(cls, y_true: List[str], y_pred: List[str]) -> float:
        labels = sorted({value.strip() for value in y_true})
        if not labels:
            return 0.0
        return sum(
            cls.calculate_recall(y_true, y_pred, label) for label in labels
        ) / len(labels)

    @staticmethod
    def calculate_log_loss(y_true: List[str], probabilities: List[float]) -> float:
        if not y_true or len(y_true) != len(probabilities):
            return 0.0
        labels = {value.strip() for value in y_true}
        if len(labels) != 2:
            raise ValueError("Log Loss currently requires binary ground-truth labels.")
        positive_label = "1" if "1" in labels else sorted(labels)[-1]
        epsilon = 1e-15
        losses = []
        for label, probability in zip(y_true, probabilities):
            if not math.isfinite(probability) or not 0 <= probability <= 1:
                raise ValueError(
                    "Log Loss predictions must be probabilities in [0, 1]."
                )
            probability = min(max(probability, epsilon), 1 - epsilon)
            target = 1.0 if label.strip() == positive_label else 0.0
            losses.append(
                -(
                    target * math.log(probability)
                    + (1 - target) * math.log(1 - probability)
                )
            )
        return sum(losses) / len(losses)

    @staticmethod
    def calculate_roc_auc(y_true: List[str], scores: List[float]) -> float:
        if not y_true or len(y_true) != len(scores):
            return 0.0
        labels = {value.strip() for value in y_true}
        if len(labels) != 2:
            raise ValueError("ROC-AUC currently requires binary ground-truth labels.")
        if any(not math.isfinite(score) for score in scores):
            raise ValueError("ROC-AUC predictions must be finite numeric scores.")
        positive_label = "1" if "1" in labels else sorted(labels)[-1]
        pairs = sorted(zip(scores, y_true), key=lambda item: item[0])
        rank_sum = 0.0
        index = 0
        while index < len(pairs):
            end = index + 1
            while end < len(pairs) and pairs[end][0] == pairs[index][0]:
                end += 1
            average_rank = (index + 1 + end) / 2
            rank_sum += average_rank * sum(
                label.strip() == positive_label for _, label in pairs[index:end]
            )
            index = end
        positives = sum(label.strip() == positive_label for label in y_true)
        negatives = len(y_true) - positives
        if not positives or not negatives:
            raise ValueError("ROC-AUC requires both positive and negative samples.")
        return (rank_sum - positives * (positives + 1) / 2) / (positives * negatives)

    def evaluate(
        self, ground_truth_path: str, prediction_path: str, metric_type: str
    ) -> float:
        metric_lower = metric_type.lower()

        gpu_metrics = {"accuracy", "rmse", "mse", "mae", "r2", "mape", "f1", "f1_score"}
        if self._cupy is not None and metric_lower in gpu_metrics:
            try:
                return self._evaluate_gpu(
                    ground_truth_path, prediction_path, metric_lower
                )
            except ValueError:
                raise
            except Exception as exc:
                if self._require_gpu:
                    raise RuntimeError(
                        f"GPU evaluation failed while GPU is required: {exc}"
                    ) from exc
                logger.warning(
                    f"GPU evaluation unavailable for metric {metric_lower}: {exc}. "
                    "Falling back to CPU evaluator."
                )

        if self._require_gpu:
            raise RuntimeError(
                "GPU evaluation is required but CuPy/CUDA is not available."
            )

        return self._evaluate_cpu(ground_truth_path, prediction_path, metric_lower)

    def _evaluate_gpu(
        self, ground_truth_path: str, prediction_path: str, metric_lower: str
    ) -> float:
        if metric_lower == "accuracy":
            y_true, y_pred = self._read_numeric_columns_gpu(
                ground_truth_path, prediction_path
            )
            return self._gpu_accuracy(y_true, y_pred)

        if metric_lower == "rmse":
            y_true, y_pred = self._read_numeric_columns_gpu(
                ground_truth_path, prediction_path
            )
            return self._gpu_rmse(y_true, y_pred)

        if metric_lower == "mse":
            y_true, y_pred = self._read_numeric_columns_gpu(
                ground_truth_path, prediction_path
            )
            return float(self._cupy.mean((y_true - y_pred) ** 2).get())

        if metric_lower == "mae":
            y_true, y_pred = self._read_numeric_columns_gpu(
                ground_truth_path, prediction_path
            )
            return float(self._cupy.mean(self._cupy.abs(y_true - y_pred)).get())

        if metric_lower == "r2":
            y_true, y_pred = self._read_numeric_columns_gpu(
                ground_truth_path, prediction_path
            )
            total = self._cupy.sum((y_true - self._cupy.mean(y_true)) ** 2)
            if float(total.get()) == 0:
                return 0.0
            residual = self._cupy.sum((y_true - y_pred) ** 2)
            return float((1 - residual / total).get())

        if metric_lower == "mape":
            y_true, y_pred = self._read_numeric_columns_gpu(
                ground_truth_path, prediction_path
            )
            denominator = self._cupy.maximum(self._cupy.abs(y_true), 1e-15)
            return float(
                self._cupy.mean(self._cupy.abs((y_true - y_pred) / denominator)).get()
            )

        if metric_lower in ("f1", "f1_score"):
            y_true, y_pred = self._read_numeric_columns_gpu(
                ground_truth_path, prediction_path
            )
            return self._gpu_f1(y_true, y_pred)

        raise ValueError(f"Unsupported metric: {metric_lower}")

    def _evaluate_cpu(
        self, ground_truth_path: str, prediction_path: str, metric_lower: str
    ) -> float:
        y_true = self._read_csv_first_column(ground_truth_path)
        y_pred = self._read_csv_first_column(prediction_path)

        if len(y_true) != len(y_pred):
            raise ValueError(
                f"Length mismatch: Ground truth has {len(y_true)} rows, "
                f"predictions have {len(y_pred)} rows."
            )

        if metric_lower == "accuracy":
            return self.calculate_accuracy(y_true, y_pred)
        if metric_lower in {"rmse", "mse", "mae", "r2", "mape"}:
            try:
                y_true_float = [float(x) for x in y_true]
                y_pred_float = [float(x) for x in y_pred]
                calculators = {
                    "rmse": self.calculate_rmse,
                    "mse": self.calculate_mse,
                    "mae": self.calculate_mae,
                    "r2": self.calculate_r2,
                    "mape": self.calculate_mape,
                }
                return calculators[metric_lower](y_true_float, y_pred_float)
            except ValueError as exc:
                raise ValueError(
                    f"{metric_lower.upper()} metric requires numeric values in columns."
                ) from exc
        if metric_lower == "precision":
            return self.calculate_precision(y_true, y_pred)
        if metric_lower == "recall":
            return self.calculate_recall(y_true, y_pred)
        if metric_lower in ("f1", "f1_score"):
            return self.calculate_f1(y_true, y_pred)
        if metric_lower == "f1_macro":
            return self.calculate_multiclass_average(y_true, y_pred, average="macro")
        if metric_lower == "f1_weighted":
            return self.calculate_multiclass_average(y_true, y_pred, average="weighted")
        if metric_lower == "balanced_accuracy":
            return self.calculate_balanced_accuracy(y_true, y_pred)
        if metric_lower in {"log_loss", "roc_auc"}:
            try:
                scores = [float(value) for value in y_pred]
            except ValueError as exc:
                raise ValueError(
                    f"{metric_lower.upper()} predictions must be numeric."
                ) from exc
            if metric_lower == "log_loss":
                return self.calculate_log_loss(y_true, scores)
            return self.calculate_roc_auc(y_true, scores)
        raise ValueError(f"Unsupported metric: {metric_lower}")

    def _read_numeric_columns_gpu(
        self, ground_truth_path: str, prediction_path: str
    ) -> tuple[Any, Any]:
        y_true = self._read_numeric_column_gpu(ground_truth_path)
        y_pred = self._read_numeric_column_gpu(prediction_path)
        if int(y_true.size) != int(y_pred.size):
            raise ValueError(
                f"Length mismatch: Ground truth has {int(y_true.size)} rows, "
                f"predictions have {int(y_pred.size)} rows."
            )
        return y_true, y_pred

    def _read_numeric_column_gpu(self, path: str) -> Any:
        cp = self._cupy
        if cp is None:
            raise RuntimeError("CuPy is not available.")

        try:
            values = cp.loadtxt(path, delimiter=",", skiprows=1, usecols=0)
        except Exception as exc:
            raise RuntimeError(
                "GPU evaluator requires numeric labels/scores. "
                "Install cuDF for GPU string CSV evaluation or use numeric labels."
            ) from exc

        return cp.atleast_1d(values)

    def _gpu_accuracy(self, y_true: Any, y_pred: Any) -> float:
        cp = self._cupy
        if int(y_true.size) == 0:
            return 0.0
        return float(cp.mean(y_true == y_pred).get())

    def _gpu_rmse(self, y_true: Any, y_pred: Any) -> float:
        cp = self._cupy
        if int(y_true.size) == 0:
            return 0.0
        return float(cp.sqrt(cp.mean((y_true - y_pred) ** 2)).get())

    def _gpu_f1(self, y_true: Any, y_pred: Any) -> float:
        cp = self._cupy
        if int(y_true.size) == 0:
            return 0.0

        positive_label = 1
        true_positive = cp.sum((y_true == positive_label) & (y_pred == positive_label))
        false_positive = cp.sum((y_true != positive_label) & (y_pred == positive_label))
        false_negative = cp.sum((y_true == positive_label) & (y_pred != positive_label))

        tp = float(true_positive.get())
        fp = float(false_positive.get())
        fn = float(false_negative.get())
        if tp == 0:
            return 0.0

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)

    def _read_csv_first_column(self, path: str) -> list[str]:
        values = []
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if row:
                    values.append(row[0])
        return values

    def _load_cupy(self) -> Any | None:
        try:
            import cupy as cp

            if cp.cuda.runtime.getDeviceCount() < 1:
                return None
            return cp
        except Exception as exc:
            if self._require_gpu:
                raise RuntimeError("CuPy/CUDA is not available.") from exc
            return None
