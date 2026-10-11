import httpx


def is_transient_http_status(status: int) -> bool:
    return status in {408, 429} or status >= 500


def is_transient_http_error(error: httpx.HTTPError) -> bool:
    if isinstance(error, httpx.HTTPStatusError):
        return is_transient_http_status(error.response.status_code)
    return isinstance(error, httpx.TransportError)
