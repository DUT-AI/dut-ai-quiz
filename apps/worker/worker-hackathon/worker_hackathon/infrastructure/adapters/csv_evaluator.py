import csv
import math
import os
from typing import Any

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
    def calculate_accuracy(y_true: list[str], y_pred: list[str]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        correct = sum(1 for gt, pred in zip(y_true, y_pred) if gt.strip() == pred.strip())
        return correct / len(y_true)

    @staticmethod
    def calculate_rmse(y_true: list[float], y_pred: list[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        mse = sum((gt - pred) ** 2 for gt, pred in zip(y_true, y_pred)) / len(y_true)
        return math.sqrt(mse)

    @staticmethod
    def calculate_f1(y_true: list[str], y_pred: list[str], positive_label: str = "1") -> float:
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

    def evaluate(self, ground_truth_path: str, prediction_path: str, metric_type: str) -> float:
        metric_lower = metric_type.lower()

        if self._cupy is not None:
            try:
                return self._evaluate_gpu(ground_truth_path, prediction_path, metric_lower)
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
            raise RuntimeError("GPU evaluation is required but CuPy/CUDA is not available.")

        return self._evaluate_cpu(ground_truth_path, prediction_path, metric_lower)

    def _evaluate_gpu(
        self, ground_truth_path: str, prediction_path: str, metric_lower: str
    ) -> float:
        if metric_lower == "accuracy":
            y_true, y_pred = self._read_numeric_columns_gpu(ground_truth_path, prediction_path)
            return self._gpu_accuracy(y_true, y_pred)

        if metric_lower == "rmse":
            y_true, y_pred = self._read_numeric_columns_gpu(ground_truth_path, prediction_path)
            return self._gpu_rmse(y_true, y_pred)

        if metric_lower in ("f1", "f1_score"):
            y_true, y_pred = self._read_numeric_columns_gpu(ground_truth_path, prediction_path)
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
        if metric_lower == "rmse":
            try:
                y_true_float = [float(x) for x in y_true]
                y_pred_float = [float(x) for x in y_pred]
                return self.calculate_rmse(y_true_float, y_pred_float)
            except ValueError as exc:
                raise ValueError("RMSE metric requires numeric values in columns.") from exc
        if metric_lower in ("f1", "f1_score"):
            return self.calculate_f1(y_true, y_pred)
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
        with open(path, encoding="utf-8") as f:
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
