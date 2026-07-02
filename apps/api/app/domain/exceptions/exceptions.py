class AppException(Exception):
    status_code: int = 500
    message: str = "An unexpected error occurred"

    def __init__(
        self, message: str | None = None, status_code: int | None = None
    ) -> None:
        super().__init__(message or self.message)
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code


class AttemptNotFoundException(AppException):
    status_code = 404
    message = "Not found or not completed"


class NotFoundException(AppException):
    def __init__(self, message: str):
        super().__init__(message, 404)


class AttemptNotCompletedException(AppException):
    status_code = 400
    message = "Attempt is not completed"


class ReviewLockedException(AppException):
    status_code = 403
    message = "Chưa đến thời gian xem đáp án. Vui lòng chờ đến khi kỳ thi kết thúc."


class ExamNotFoundException(AppException):
    status_code = 404
    message = "Exam not found"


class ExamNotStartedException(AppException):
    status_code = 403
    message = "Exam not started yet"


class ExamEndedException(AppException):
    status_code = 403
    message = "Exam ended"


class MaxAttemptsReachedException(AppException):
    status_code = 403
    message = "Max attempts reached"


class ExamNoQuestionsException(AppException):
    status_code = 400
    message = "No questions in exam"
