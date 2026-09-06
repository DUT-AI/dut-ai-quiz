import dataclasses
import json
from datetime import datetime

from redis.asyncio import Redis

from app.domain.entities.manage_service import ManageTeamEntity, ManageUserEntity
from app.domain.interfaces.manage_cache import IDUTAIManageCache


class DUTAIManageCache(IDUTAIManageCache):
    def __init__(self, redis: Redis, ttl: int = 300) -> None:
        self._redis = redis
        self._ttl = ttl
        self._teams_key = "manage:teams"
        self._users_key = "manage:users"

    async def get_teams(self) -> list[ManageTeamEntity] | None:
        data = await self._redis.get(self._teams_key)
        if not data:
            return None
        try:
            teams_list = json.loads(data)
            entities = []
            for t in teams_list:
                members = [
                    ManageUserEntity(
                        user_id=m["user_id"],
                        user_name=m["user_name"],
                        email=m["email"],
                        user_avatar_url=m.get("user_avatar_url"),
                    )
                    for m in t["members"]
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
            return entities
        except Exception:
            return None

    async def set_teams(self, data: list[ManageTeamEntity]) -> None:
        raw_list = []
        for t in data:
            raw_t = dataclasses.asdict(t)
            raw_t["created_at"] = t.created_at.isoformat()
            raw_t["updated_at"] = t.updated_at.isoformat()
            raw_list.append(raw_t)
        await self._redis.set(self._teams_key, json.dumps(raw_list), ex=self._ttl)

    async def get_users(self) -> list[ManageUserEntity] | None:
        data = await self._redis.get(self._users_key)
        if not data:
            return None
        try:
            users_list = json.loads(data)
            return [
                ManageUserEntity(
                    user_id=u["user_id"],
                    user_name=u["user_name"],
                    email=u["email"],
                    user_avatar_url=u.get("user_avatar_url"),
                )
                for u in users_list
            ]
        except Exception:
            return None

    async def set_users(self, data: list[ManageUserEntity]) -> None:
        raw_list = [dataclasses.asdict(u) for u in data]
        await self._redis.set(self._users_key, json.dumps(raw_list), ex=self._ttl)
