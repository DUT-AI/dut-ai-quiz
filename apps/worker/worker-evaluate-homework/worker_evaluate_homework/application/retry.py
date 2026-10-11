class RetryGradingRequested(RuntimeError):
    """Ask the task adapter to schedule the next persisted grading attempt."""

    def __init__(self, delay_seconds: int) -> None:
        super().__init__("Grading failed temporarily")
        self.delay_seconds = delay_seconds
