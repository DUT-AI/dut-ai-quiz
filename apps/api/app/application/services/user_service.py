import asyncio

from app.application.dtos.user import UserOut
from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.domain.interfaces import IManageService, IUserRepository
from loguru import logger
from redis.asyncio import Redis


class UserService:
    def __init__(
        self, user_repo: IUserRepository, manage_client: IManageService, redis: Redis | None = None
    ):
        self.user_repo = user_repo
        self.manage_client = manage_client
        self._redis = redis

    async def get_user_info(self, user_id: int) -> UserOut | None:
        """Lấy thông tin user từ Local DB -> Redis Cache -> Manage Service (Service-A)."""
        # 1. Dev bypass check
        if settings.auth_dev_bypass and user_id == settings.auth_dev_user_id:
            rn = settings.auth_dev_role_name
            role = rn if isinstance(rn, str) else (rn[0] if rn else "admin")
            return UserOut(
                id=user_id,
                name=f"Dev User ({role})",
                email="dev@dutai.site",
                avatar_url=None,
                role=role,
            )

        # 2. Local database check
        u = await self.user_repo.get_by_id(user_id)
        if u:
            return UserOut(
                id=u.id or 0,
                name=u.name or u.email,
                email=u.email,
                avatar_url=u.avatar_url,
                role=u.role or "guest",
            )

        # 3. Redis cache check
        cache_key = f"user:info:{user_id}"
        if self._redis:
            try:
                cached_data = await self._redis.get(cache_key)
                if cached_data:
                    return UserOut.model_validate_json(cached_data)
            except Exception as e:
                logger.warning(f"Error reading user cache for {user_id}: {e}")

        # 4. Fallback to Manage Service
        try:
            profile = await self.manage_client.get_profile(user_id)
            if profile:
                quiz_role = "guest"
                try:
                    quiz_role = quiz_role_from_manage(profile.role_names)
                except Exception:
                    pass

                user_out = UserOut(
                    id=user_id,
                    name=profile.name,
                    email=profile.email,
                    avatar_url=profile.avatar_url,
                    role=quiz_role,
                )

                # Cache in Redis for 10 minutes (600s)
                if self._redis:
                    try:
                        await self._redis.set(cache_key, user_out.model_dump_json(), ex=600)
                    except Exception as e:
                        logger.warning(f"Error caching user info for {user_id}: {e}")

                return user_out
        except Exception as e:
            logger.warning(f"Error fetching profile from Manage Service for user {user_id}: {e}")

        # 5. Dev fallback if enabled
        if settings.auth_dev_bypass:
            return UserOut(
                id=user_id,
                name=f"User #{user_id}",
                email=f"user{user_id}@dutai.site",
                avatar_url=None,
                role="guest",
            )

        return None

    async def resolve_authors(self, comments: list) -> None:
        """Phân giải động thông tin của tác giả cho danh sách bình luận song song."""
        if not comments:
            return

        user_ids = set()

        def collect_ids(c):
            user_ids.add(c.user_id)
            if c.replies:
                for r in c.replies:
                    collect_ids(r)

        for c in comments:
            collect_ids(c)

        async def resolve_one(uid: int):
            try:
                return uid, await self.get_user_info(uid)
            except Exception as e:
                logger.error(f"Error resolving profile for user {uid}: {e}")
                return uid, None

        results = await asyncio.gather(*(resolve_one(uid) for uid in user_ids))
        user_map = {uid: u for uid, u in results if u}

        def populate(c):
            user = user_map.get(c.user_id)
            if user:
                c.user_name = user.name
                c.user_avatar = user.avatar_url
                c.user_role = user.role
            else:
                c.user_role = "guest"

            if c.replies:
                for r in c.replies:
                    populate(r)

        for c in comments:
            populate(c)
