import pytest

from worker_hackathon.infrastructure.adapters.csv_evaluator import CsvEvaluator


def test_regression_metrics() -> None:
    truth = [1.0, 2.0, 3.0]
    prediction = [1.0, 2.0, 4.0]

    assert CsvEvaluator.calculate_mae(truth, prediction) == pytest.approx(1 / 3)
    assert CsvEvaluator.calculate_mse(truth, prediction) == pytest.approx(1 / 3)
    assert CsvEvaluator.calculate_rmse(truth, prediction) == pytest.approx(
        (1 / 3) ** 0.5
    )
    assert CsvEvaluator.calculate_r2(truth, prediction) == pytest.approx(0.5)


def test_multiclass_metrics() -> None:
    truth = ["cat", "cat", "dog", "bird"]
    prediction = ["cat", "dog", "dog", "bird"]

    assert CsvEvaluator.calculate_balanced_accuracy(truth, prediction) == pytest.approx(
        (0.5 + 1 + 1) / 3
    )
    assert CsvEvaluator.calculate_multiclass_average(
        truth,
        prediction,
        average="macro",
    ) == pytest.approx((2 / 3 + 2 / 3 + 1) / 3)


def test_probability_metrics() -> None:
    truth = ["0", "0", "1", "1"]
    scores = [0.1, 0.4, 0.35, 0.8]

    assert CsvEvaluator.calculate_roc_auc(truth, scores) == pytest.approx(0.75)
    assert CsvEvaluator.calculate_log_loss(truth, scores) == pytest.approx(0.4722879538)
