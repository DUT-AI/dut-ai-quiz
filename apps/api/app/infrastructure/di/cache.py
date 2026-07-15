from dishka import Provider, Scope, provide
from redis.asyncio import Redis, from_url

from app.config import settings
from app.domain.interfaces import IBlogCache, IDUTAIManageCache, IHackathonLeaderboardCache
from app.infrastructure.cache import (
    DUTAIManageCache,
    ProfileCache,
    RedisBlogCache,
    RedisHackathonLeaderboardCache,
)
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache


class CacheProvider(Provider):
    """Dependency Injection provider for caching services."""

    @provide(scope=Scope.APP)
    def redis(self) -> Redis:
        """Provide concrete Redis client."""
        return from_url(
            settings.redis_url,
            decode_responses=True,
        )

    @provide(scope=Scope.APP)
    def profile_cache(self, redis: Redis) -> ProfileCache:
        """Provide ProfileCache wrapper."""
        return ProfileCache(redis, ttl=settings.auth_cache_ttl)

    @provide(scope=Scope.APP)
    def blog_cache(self, redis: Redis) -> IBlogCache:
        """Provide IBlogCache interface mapped to RedisBlogCache implementation."""
        return RedisBlogCache(redis, ttl=300)

    @provide(scope=Scope.APP)
    def get_dut_ai_manage_cache(self, redis: Redis) -> IDUTAIManageCache:
        """Provide IDUTAIManageCache interface mapped to DUTAIManageCache implementation."""
        return DUTAIManageCache(redis, ttl=300)

    @provide(scope=Scope.APP)
    def game_leaderboard_cache(self, redis: Redis) -> GameLeaderboardCache:
        return GameLeaderboardCache(redis, ttl=600)

    @provide(scope=Scope.APP)
    def hackathon_leaderboard_cache(
        self, redis: Redis
    ) -> IHackathonLeaderboardCache:
        return RedisHackathonLeaderboardCache(redis, ttl=5)
