from datetime import timedelta

import pytest
from worker_evaluate_homework.domain.retry import GradingRetryPolicy


@pytest.fixture
def retry_policy():
    return GradingRetryPolicy(max_attempts=3, lease_duration=timedelta(minutes=16))
