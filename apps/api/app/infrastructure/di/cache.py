from redis.asyncio import Redis, from_url
from dishka import Provider, Scope, provide

from app.config import settings
from app.infrastructure.cache.redis_client import ProfileCache

class CacheProvider(Provider):
    @provide(scope=Scope.APP)
    def redis(self) -> Redis:
        return from_url(settings.redis_url, decode_responses=True)

    @provide(scope=Scope.APP)
    def profile_cache(self, redis: Redis) -> ProfileCache:
        return ProfileCache(redis, ttl=settings.auth_cache_ttl)
