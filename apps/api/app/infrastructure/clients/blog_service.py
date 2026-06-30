import httpx
from loguru import logger
from app.config import settings


class BlogServiceClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client
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

    async def get_blog_by_id(self, blog_id: str) -> dict | None:
        """
        Get blog detail by ID from blog service.
        GET https://dut-ai-web-api.dutai.site/api/v1/blogs/{blog_id}
        """
        url = f"{self._blogs_url}/{blog_id}"
        try:
            logger.info(f"Fetching blog {blog_id} from: {url}")
            response = await self._client.get(url, timeout=15.0)
            if response.status_code != 200:
                logger.warning(
                    f"Blog API returned {response.status_code}: {response.text}"
                )
                return None
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching blog {blog_id} from Blog Service: {e}")
            return None
