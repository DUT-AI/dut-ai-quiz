import httpx
from loguru import logger

from app.domain.interfaces import IBlogCache


class BlogServiceClient:
    """Client for communicating with the external blog service."""

    def __init__(self, client: httpx.AsyncClient, cache: IBlogCache) -> None:
        self._client = client
        self._cache = cache
        self._base_url = "https://dut-ai-web-api.dutai.site/api/v1"
        self._blogs_url = f"{self._base_url}/blogs"

    async def get_all_blogs(self) -> list[dict] | None:
        """
        Get all blogs from blog service.
        GET https://dut-ai-web-api.dutai.site/api/v1/blogs
        """
        try:
            logger.info(f"Fetching all blogs from: {self._blogs_url}")
            response = await self._client.get(self._blogs_url, timeout=15.0)
            if response.status_code != 200:
                logger.warning(
                    f"Blog API returned {response.status_code}: {response.text}"
                )
                return None
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching blogs from Blog Service: {e}")
            return None

    async def get_blog_by_slug(self, blog_slug: str) -> dict | None:
        """
        Get blog detail by slug from blog service with caching.
        GET https://dut-ai-web-api.dutai.site/api/v1/blogs/by-slug/{blog_slug}
        """
        cached_data = await self._cache.get(blog_slug)
        if cached_data:
            logger.info(f"Cache hit for blog slug: {blog_slug}")
            return cached_data

        url = f"{self._blogs_url}/by-slug/{blog_slug}"
        try:
            logger.info(f"Fetching blog by slug {blog_slug} from: {url}")
            response = await self._client.get(url, timeout=15.0)
            if response.status_code != 200:
                logger.warning(
                    f"Blog API returned {response.status_code}: {response.text}"
                )
                return None
            blog_data = response.json()

            if blog_data:
                await self._cache.set(blog_slug, blog_data)

            return blog_data
        except Exception as e:
            logger.error(
                f"Error fetching blog by slug {blog_slug} from Blog Service: {e}"
            )
            return None
