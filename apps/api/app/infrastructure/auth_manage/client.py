import httpx

from app.config import settings


async def fetch_me(cookie_header: str | None) -> dict:
    url = f"{settings.manage_base_url.rstrip('/')}{settings.manage_auth_me_path}"
    headers: dict[str, str] = {}
    if cookie_header:
        headers["Cookie"] = cookie_header
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=15.0)
    response.raise_for_status()
    body = response.json()
    if not body.get("is_success", True):
        raise httpx.HTTPStatusError("Auth me failed", request=response.request, response=response)
    data = body.get("data")
    if data is None:
        raise ValueError("Invalid /auth/me payload: missing data")
    return data
