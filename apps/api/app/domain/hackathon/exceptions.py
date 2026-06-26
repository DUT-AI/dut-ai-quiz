class HackathonError(Exception):
    pass


class CompetitionNotFoundError(HackathonError):
    pass


class TaskNotFoundError(HackathonError):
    pass


class SubmissionNotFoundError(HackathonError):
    pass


class HackathonCooldownError(HackathonError):
    pass


class HackathonQuotaExceededError(HackathonError):
    pass


class SubmissionNotCancelableError(HackathonError):
    pass
