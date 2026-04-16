from datetime import datetime, timezone, timedelta

# Vietnam uses ICT (UTC+7)
VIETNAM_TZ = timezone(timedelta(hours=7))


def now_ict() -> datetime:
    """Returns the current datetime in Vietnam time (ICT)."""
    return datetime.now(VIETNAM_TZ).replace(tzinfo=None)


def utc_to_ict(dt: datetime) -> datetime:
    """Converts a UTC datetime to ICT."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(VIETNAM_TZ)
