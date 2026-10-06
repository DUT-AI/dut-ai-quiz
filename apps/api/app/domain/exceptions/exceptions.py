class AppException(Exception):
    status_code: int = 500
    message: str = "An unexpected error occurred"

    def __init__(self, message: str | None = None, status_code: int | None = None) -> None:
        super().__init__(message or self.message)
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code


class DomainValidationException(AppException):
    status_code = 400
    message = "Dữ liệu không hợp lệ"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message, 400)


class BadRequestException(DomainValidationException):
    pass


class NotFoundException(AppException):
    status_code = 404
    message = "Không tìm thấy dữ liệu"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message, 404)


class EntityNotFoundException(NotFoundException):
    pass


class ForbiddenException(AppException):
    status_code = 403
    message = "Không có quyền truy cập"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message, 403)


class InsufficientResourceException(AppException):
    status_code = 400
    message = "Tài nguyên không đủ để thực hiện hành động này"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message, 400)


class ResourceConflictException(AppException):
    status_code = 409
    message = "Xung đột dữ liệu"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message, 409)


class ServiceUnavailableException(AppException):
    status_code = 503
    message = "Dịch vụ hiện không khả dụng"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message, 503)


class HomeworkWorkerUnavailableException(ServiceUnavailableException):
    message = "Worker chấm bài chưa sẵn sàng. Vui lòng thử lại sau."


class AttemptNotFoundException(NotFoundException):
    message = "Not found or not completed"


class AttemptNotCompletedException(DomainValidationException):
    message = "Attempt is not completed"


class ReviewLockedException(ForbiddenException):
    message = "Chưa đến thời gian xem đáp án. Vui lòng chờ đến khi kỳ thi kết thúc."


class ExamNotFoundException(NotFoundException):
    message = "Exam not found"


class ExamNotStartedException(ForbiddenException):
    message = "Exam not started yet"


class ExamEndedException(ForbiddenException):
    message = "Exam ended"


class MaxAttemptsReachedException(ForbiddenException):
    message = "Max attempts reached"


class ExamNoQuestionsException(DomainValidationException):
    message = "No questions in exam"
