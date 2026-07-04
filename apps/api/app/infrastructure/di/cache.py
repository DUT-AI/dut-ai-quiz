from dishka import Provider, Scope, provide
from redis.asyncio import Redis, from_url

from app.config import settings
from app.domain.interfaces import IBlogCache
from app.infrastructure.cache import ProfileCache, RedisBlogCache
from app.infrastructure.cache.practice_leaderboard_cache import PracticeLeaderboardCache


class CacheProvider(Provider):
    """Dependency Injection provider for caching services."""

    @provide(scope=Scope.APP)
    def redis(self) -> Redis:
        """Provide concrete Redis client."""
        return from_url(
            f"redis://{settings.redis_host}:{settings.redis_port}",
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
    def practice_leaderboard_cache(self, redis: Redis) -> PracticeLeaderboardCache:
        return PracticeLeaderboardCache(redis, ttl=600)
