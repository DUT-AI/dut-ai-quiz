from typing import Any
from redis.asyncio import Redis
from loguru import logger

from app.application.dtos.user import UserOut
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IUserRepository, IManageService


class UserService:
    def __init__(self, user_repo: IUserRepository, manage_client: IManageService, redis: Redis = None):
        self.user_repo = user_repo
        self.manage_client = manage_client
        self._redis = redis

    async def get_user_info(self, user_id: int) -> UserOut:
        """Lấy thông tin user từ local DB (Google) hoặc Manage Service (Service-A)."""
        u = await self.user_repo.get_by_id(user_id)
        if u:
            return UserOut(
                id=u.id or 0,
                name=u.name or u.email,
                email=u.email,
                avatar_url=u.avatar_url,
            )

        # Fallback: lấy từ Manage Service
        profile = await self.manage_client.get_profile(user_id)
        if profile:
            return UserOut(
                id=user_id,
                name=profile.name,
                email=profile.email,
                avatar_url=profile.avatar_url,
            )

        raise AppException(
            message=f"Không tìm thấy thông tin của user {user_id}",
            status_code=404,
        )

    async def get_user_profile(self, user_id: int) -> dict[str, Any] | None:
        """Lấy profile của user từ Local DB hoặc Cache Redis hoặc Manage Service."""
        # 1. Check local repository first (e.g. Google user or admin test accounts)
        u = await self.user_repo.get_by_id(user_id)
        if u:
            return {
                "name": u.name or u.email,
                "avatar_url": u.avatar_url,
                "role": u.role or "guest"
            }

        # 2. Check Redis cache
        cache_key = f"manage:user:profile:{user_id}"
        if self._redis:
            try:
                cached_data = await self._redis.get(cache_key)
                if cached_data:
                    import json
                    return json.loads(cached_data)
            except Exception as e:
                logger.warning(f"Error reading user profile cache: {e}")

        # 3. Fallback to Manage Service
        profile = await self.manage_client.get_profile(user_id)
        if profile:
            from app.application.services.auth_roles import quiz_role_from_manage
            quiz_role = "guest"
            try:
                quiz_role = quiz_role_from_manage(profile.role_names)
            except Exception:
                pass
            
            data = {
                "name": profile.name,
                "avatar_url": profile.avatar_url,
                "role": quiz_role
            }
            
            # Cache resolved profile in Redis for 10 minutes (600s)
            if self._redis:
                try:
                    import json
                    await self._redis.set(cache_key, json.dumps(data), ex=600)
                except Exception as e:
                    logger.warning(f"Error writing user profile cache: {e}")
            return data

        return None

    async def resolve_authors(self, comments: list) -> None:
        """Phân giải động thông tin của tác giả cho danh sách bình luận (bao gồm cả các phản hồi đệ quy)."""
        if not comments:
            return

        # Thu thập tất cả user_id duy nhất
        user_ids = set()
        def collect_ids(c):
            user_ids.add(c.user_id)
            if c.replies:
                for r in c.replies:
                    collect_ids(r)

        for c in comments:
            collect_ids(c)

        # Phân giải thông tin user song song
        import asyncio
        async def resolve_one(uid: int):
            try:
                return uid, await self.get_user_profile(uid)
            except Exception as e:
                logger.error(f"Error resolving profile for user {uid}: {e}")
                return uid, None

        results = await asyncio.gather(*(resolve_one(uid) for uid in user_ids))
        user_map = {uid: profile for uid, profile in results if profile}

        # Gán thông tin user vào các thực thể comment
        def populate(c):
            profile = user_map.get(c.user_id)
            if profile:
                c.user_name = profile.get("name")
                c.user_avatar = profile.get("avatar_url")
                c.user_role = profile.get("role")
            else:
                c.user_role = "guest"

            if c.replies:
                for r in c.replies:
                    populate(r)

        for c in comments:
            populate(c)

