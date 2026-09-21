import httpx
from loguru import logger

from app.config import settings


class GoogleOAuthClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client
        self._token_url = "https://oauth2.googleapis.com/token"
        self._userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"

    def get_authorization_url(self) -> str:
        return (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?response_type=code"
            f"&client_id={settings.google_client_id}"
            f"&redirect_uri={settings.google_redirect_uri}"
            f"&scope=openid%20email%20profile"
        )

    async def exchange_code(self, code: str) -> str | None:
        token_data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        }
        try:
            response = await self._client.post(self._token_url, data=token_data, timeout=15.0)
            if response.status_code != 200:
                logger.error(f"Google Token Exchange failed: {response.text}")
                return None
            tokens = response.json()
            return tokens.get("access_token")
        except Exception as e:
            logger.error(f"Error during Google Token Exchange: {e}")
            return None

    async def get_user_info(self, access_token: str) -> dict | None:
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            response = await self._client.get(self._userinfo_url, headers=headers, timeout=15.0)
            if response.status_code != 200:
                logger.error(f"Google Userinfo fetch failed: {response.text}")
                return None
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching Google user info: {e}")
            return None
