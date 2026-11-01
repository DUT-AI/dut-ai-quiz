from datetime import datetime

import httpx
from fastapi import HTTPException
from loguru import logger

from app.config import settings
from app.domain.entities.manage_service import (
    ManageAuthTokens,
    ManageTeamEntity,
    ManageUserEntity,
    ManageUserProfile,
)
from app.domain.interfaces import IDUTAIManageCache, IManageService


class DUTAIManageService(IManageService):
    def __init__(self, client: httpx.AsyncClient, cache: IDUTAIManageCache) -> None:
        self._client = client
        self._cache = cache
        self._base_url = settings.manage_base_url.rstrip("/")
        self._headers = {"Authorization": f"Bearer {settings.manage_api_key}"}

        self._users_url = f"{self._base_url}/api/v1/users"

    async def login(self, payload_dict: dict) -> ManageAuthTokens | None:
        try:
            login_url = f"{self._base_url}/api/v1/auth/login"
            logger.info(f"Proxying login request to: {login_url}")
            response = await self._client.post(
                login_url, json=payload_dict, timeout=15.0
            )
            if response.status_code != 200:
                logger.warning(
                    f"Manage API returned {response.status_code}: {response.text}"
                )
                return None
            res_json = response.json()
            if not res_json or not res_json.get("is_success"):
                return None

            data = res_json.get("data") or {}
            return ManageAuthTokens(
                access_token=data.get("access_token") or "",
                refresh_token=data.get("refresh_token") or "",
                token_type=data.get("token_type") or "bearer",
            )
        except Exception as e:
            logger.error(f"Error during proxy login to Manage Service: {e}")
            return None

    async def get_own_profile(
        self, dut_ai_user_access_token: str
    ) -> ManageUserProfile | None:
        headers = {"Authorization": f"Bearer {dut_ai_user_access_token}"}
        try:
            me_url = f"{self._base_url}/api/v1/auth/me"
            response = await self._client.get(me_url, headers=headers, timeout=15.0)
            if response.status_code != 200:
                logger.error(
                    f"Failed to fetch own profile from Manage Service: {response.text}"
                )
                return None
            res_json = response.json()
            if not res_json or not res_json.get("is_success"):
                return None

            data = res_json.get("data") or {}
            return ManageUserProfile(
                id=int(data.get("id") or 0),
                name=data.get("name") or "",
                email=data.get("email") or "",
                avatar_url=data.get("avatar_url"),
                role_names=data.get("role_names") or [],
                permissions=data.get("permissions") or [],
            )
        except Exception as e:
            logger.error(f"Error fetching own profile from Manage Service: {e}")
            return None

    async def get_profile(self, user_id: int) -> ManageUserProfile | None:
        url = f"{self._users_url}/{user_id}"
        headers = {"Authorization": f"Bearer {settings.manage_api_key}"}
        try:
            response = await self._client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                logger.warning(
                    f"Failed to fetch user {user_id} profile from Manage Service: {response.text}"
                )
                return None
            res_json = response.json()
            if not res_json or not res_json.get("is_success"):
                return None

            data = res_json.get("data") or {}
            return ManageUserProfile(
                id=int(data.get("id") or user_id),
                name=data.get("name") or "",
                email=data.get("email") or "",
                avatar_url=data.get("avatar_url"),
                role_names=data.get("role_names") or [],
                permissions=data.get("permissions") or [],
            )
        except Exception as e:
            logger.error(f"Error fetching profile from Manage Service: {e}")
            return None

    async def find_user_by_email(self, email: str) -> list[ManageUserProfile]:
        headers = {"Authorization": f"Bearer {settings.manage_api_key}"}
        params = {"search": email, "email": email}
        try:
            response = await self._client.get(
                self._users_url, headers=headers, params=params, timeout=15.0
            )
            if response.status_code != 200:
                logger.warning(
                    f"Failed to find user by email on Manage Service: {response.text}"
                )
                return []
            res_json = response.json()
            if not res_json or not res_json.get("is_success"):
                return []

            users_list = res_json.get("data")
            if not users_list or not isinstance(users_list, list):
                return []

            output: list[ManageUserProfile] = []
            for user in users_list:
                output.append(
                    ManageUserProfile(
                        id=int(user.get("id") or 0),
                        name=user.get("name") or "",
                        email=user.get("email") or "",
                        avatar_url=user.get("avatar_url"),
                        role_names=user.get("role_names") or [],
                        permissions=user.get("permissions") or [],
                    )
                )
            return output
        except Exception as e:
            logger.error(f"Error finding user by email on Manage Service: {e}")
            return []

    async def get_teams(self) -> list[ManageTeamEntity]:
        # 1. Check cache first
        try:
            cached_teams = await self._cache.get_teams()
            if cached_teams is not None:
                logger.debug("DUT AI Manage Service: returning cached teams")
                return cached_teams
        except Exception as e:
            logger.warning(f"Failed to read teams cache: {e}")

        # 2. Call external API
        url = f"{self._base_url}/api/v1/teams?skip=0&limit=100"
        try:
            response = await self._client.get(url, headers=self._headers)
            logger.debug(f"Proxy teams response status: {response.status_code}")
            response.raise_for_status()

            res_json = response.json()
            teams_data = res_json.get("data", [])

            entities = []
            for t in teams_data:
                members = [
                    ManageUserEntity(
                        user_id=m["user_id"],
                        user_name=m["user_name"],
                        email=m["email"],
                        user_avatar_url=m.get("user_avatar_url"),
                    )
                    for m in t.get("members", [])
                ]
                entities.append(
                    ManageTeamEntity(
                        id=t["id"],
                        team_name=t["team_name"],
                        created_at=datetime.fromisoformat(t["created_at"]),
                        updated_at=datetime.fromisoformat(t["updated_at"]),
                        member_count=t["member_count"],
                        members=members,
                    )
                )

            # 3. Write cache asynchronously
            try:
                await self._cache.set_teams(entities)
            except Exception as cache_err:
                logger.warning(f"Failed to write teams cache: {cache_err}")

            return entities
        except httpx.HTTPStatusError as e:
            logger.error(
                f"External API error get_teams: {e.response.status_code} - {e.response.text[:500]}"
            )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"External teams error: {e.response.text[:200]}",
            ) from e
        except Exception as e:
            logger.error(f"Proxy error get_teams: {str(e)}")
            raise HTTPException(
                status_code=500, detail="External API returned invalid response"
            ) from e

    async def get_users(self) -> list[ManageUserEntity]:
        # 1. Check cache first
        try:
            cached_users = await self._cache.get_users()
            if cached_users is not None:
                logger.debug("DUT AI Manage Service: returning cached users")
                return cached_users
        except Exception as e:
            logger.warning(f"Failed to read users cache: {e}")

        # 2. Call external API
        url = f"{self._base_url}/api/v1/users"
        try:
            response = await self._client.get(url, headers=self._headers)
            logger.debug(f"Proxy users response status: {response.status_code}")
            response.raise_for_status()

            res_json = response.json()
            users_data = (
                res_json.get("data") if isinstance(res_json, dict) else res_json
            )
            if not isinstance(users_data, list):
                users_data = []

            entities = []
            for u in users_data:
                user_id = u.get("user_id") or u.get("id")
                user_name = (
                    u.get("user_name") or u.get("name") or u.get("full_name") or ""
                )
                email = u.get("email") or ""
                entities.append(
                    ManageUserEntity(
                        user_id=int(user_id) if user_id is not None else 0,
                        user_name=user_name,
                        email=email,
                        user_avatar_url=u.get("user_avatar_url") or u.get("avatar_url"),
                    )
                )

            # 3. Write cache asynchronously
            try:
                await self._cache.set_users(entities)
            except Exception as cache_err:
                logger.warning(f"Failed to write users cache: {cache_err}")

            return entities
        except httpx.HTTPStatusError as e:
            logger.error(
                f"External API error get_users: {e.response.status_code} - {e.response.text[:500]}"
            )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"External users error: {e.response.text[:200]}",
            ) from e
        except Exception as e:
            logger.error(f"Proxy error get_users: {str(e)}")
            raise HTTPException(
                status_code=500, detail="External API returned invalid response"
            ) from e
