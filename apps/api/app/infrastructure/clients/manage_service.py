import httpx
from loguru import logger
from app.config import settings


class ManageServiceClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client
        self._base_url = settings.manage_base_url.rstrip("/")
        self._login_url = f"{self._base_url}/api/v1/auth/login"
        self._me_url = f"{self._base_url}/api/v1/auth/me"
        self._users_url = f"{self._base_url}/api/v1/users"

    async def login(self, payload_dict: dict) -> dict | None:
        try:
            logger.info(f"Proxying login request to: {self._login_url}")
            response = await self._client.post(
                self._login_url, json=payload_dict, timeout=15.0
            )
            if response.status_code != 200:
                logger.warning(
                    f"Manage API returned {response.status_code}: {response.text}"
                )
                return None
            return response.json()
        except Exception as e:
            logger.error(f"Error during proxy login to Manage Service: {e}")
            return None

    async def get_own_profile(self, service_a_access_token: str) -> dict | None:
        headers = {"Authorization": f"Bearer {service_a_access_token}"}
        try:
            response = await self._client.get(self._me_url, headers=headers, timeout=15.0)
            if response.status_code != 200:
                logger.error(f"Failed to fetch own profile from Manage Service: {response.text}")
                return None
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching own profile from Manage Service: {e}")
            return None

    async def get_profile(self, user_id: int) -> dict | None:
        url = f"{self._users_url}/{user_id}"
        headers = {"Authorization": f"Bearer {settings.manage_api_key}"}
        try:
            response = await self._client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch user {user_id} profile from Manage Service: {response.text}")
                return None
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching profile from Manage Service: {e}")
            return None

    async def find_user_by_email(self, email: str) -> dict | None:
        headers = {"Authorization": f"Bearer {settings.manage_api_key}"}
        params = {"search": email, "email": email}
        try:
            response = await self._client.get(
                self._users_url, headers=headers, params=params, timeout=15.0
            )
            if response.status_code != 200:
                logger.warning(f"Failed to find user by email on Manage Service: {response.text}")
                return None
            return response.json()
        except Exception as e:
            logger.error(f"Error finding user by email on Manage Service: {e}")
            return None
