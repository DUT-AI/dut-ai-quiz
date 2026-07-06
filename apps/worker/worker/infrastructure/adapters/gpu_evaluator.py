"""
GPU-accelerated metric evaluator using CuPy for array operations.
Falls back to CPU if GPU is not available.
"""
import csv
import math
from typing import List

from worker.domain.interfaces.evaluator import IEvaluator

try:
    import cupy as cp
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False
    import numpy as np


class GpuEvaluator(IEvaluator):
    """
    GPU-accelerated evaluator that replaces loop-based calculations
    with vectorized GPU operations for faster metric computation.
    """

    def __init__(self):
        self.use_gpu = GPU_AVAILABLE
        if self.use_gpu:
            print("GPU-accelerated evaluator initialized with CuPy")
        else:
            print("GPU not available, using NumPy fallback")

    @staticmethod
    def calculate_accuracy(y_true: List[str], y_pred: List[str]) -> float:
        """GPU-accelerated accuracy calculation."""
        if not y_true or len(y_true) != len(y_pred):
            return 0.0

        if GPU_AVAILABLE:
            # Convert to GPU arrays
            y_true_arr = cp.array([s.strip() for s in y_true])
            y_pred_arr = cp.array([s.strip() for s in y_pred])
            
            # Vectorized comparison on GPU
            correct = cp.sum(y_true_arr == y_pred_arr)
            return float(correct / len(y_true_arr))
        else:
            # NumPy fallback
            y_true_arr = np.array([s.strip() for s in y_true])
            y_pred_arr = np.array([s.strip() for s in y_pred])
            correct = np.sum(y_true_arr == y_pred_arr)
            return float(correct / len(y_true_arr))

    @staticmethod
    def calculate_rmse(y_true: List[float], y_pred: List[float]) -> float:
        """GPU-accelerated RMSE calculation."""
        if not y_true or len(y_true) != len(y_pred):
            return 0.0

        if GPU_AVAILABLE:
            # Convert to GPU arrays
            y_true_arr = cp.array(y_true, dtype=cp.float32)
            y_pred_arr = cp.array(y_pred, dtype=cp.float32)
            
            # Vectorized RMSE calculation on GPU
            squared_errors = (y_true_arr - y_pred_arr) ** 2
            mse = cp.mean(squared_errors)
            rmse = cp.sqrt(mse)
            return float(rmse)
        else:
            # NumPy fallback
            y_true_arr = np.array(y_true, dtype=np.float32)
            y_pred_arr = np.array(y_pred, dtype=np.float32)
            squared_errors = (y_true_arr - y_pred_arr) ** 2
            mse = np.mean(squared_errors)
            rmse = np.sqrt(mse)
            return float(rmse)

    @staticmethod
    def calculate_f1(
        y_true: List[str], y_pred: List[str], positive_label: str = "1"
    ) -> float:
        """GPU-accelerated F1 score calculation."""
        if not y_true or len(y_true) != len(y_pred):
            return 0.0

        if GPU_AVAILABLE:
            # Convert to GPU arrays
            y_true_arr = cp.array([s.strip() for s in y_true])
            y_pred_arr = cp.array([s.strip() for s in y_pred])
            pos_label = positive_label.strip()

            # Vectorized boolean masks on GPU
            true_positive_mask = (y_true_arr == pos_label) & (y_pred_arr == pos_label)
            false_positive_mask = (y_true_arr != pos_label) & (y_pred_arr == pos_label)
            false_negative_mask = (y_true_arr == pos_label) & (y_pred_arr != pos_label)

            tp = float(cp.sum(true_positive_mask))
            fp = float(cp.sum(false_positive_mask))
            fn = float(cp.sum(false_negative_mask))
        else:
            # NumPy fallback
            y_true_arr = np.array([s.strip() for s in y_true])
            y_pred_arr = np.array([s.strip() for s in y_pred])
            pos_label = positive_label.strip()

            true_positive_mask = (y_true_arr == pos_label) & (y_pred_arr == pos_label)
            false_positive_mask = (y_true_arr != pos_label) & (y_pred_arr == pos_label)
            false_negative_mask = (y_true_arr == pos_label) & (y_pred_arr != pos_label)

            tp = float(np.sum(true_positive_mask))
            fp = float(np.sum(false_positive_mask))
            fn = float(np.sum(false_negative_mask))

        if tp == 0:
            return 0.0

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

        if precision + recall == 0:
            return 0.0

        return 2 * (precision * recall) / (precision + recall)

    def evaluate(
        self, ground_truth_path: str, prediction_path: str, metric_type: str
    ) -> float:
        """
        Evaluate predictions against ground truth using GPU-accelerated metrics.
        """
        # Read ground truth
        y_true = []
        with open(ground_truth_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if row:
                    y_true.append(row[0])

        # Read predictions
        y_pred = []
        with open(prediction_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if row:
                    y_pred.append(row[0])

        if len(y_true) != len(y_pred):
            raise ValueError(
                f"Length mismatch: Ground truth has {len(y_true)} rows, "
                f"predictions have {len(y_pred)} rows."
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
