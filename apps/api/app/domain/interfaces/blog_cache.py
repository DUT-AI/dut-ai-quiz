from typing import Any, Protocol


class IBlogCache(Protocol):
    """Interface protocol for caching blog details by slug."""

    async def get(self, blog_slug: str) -> dict[str, Any] | None:
        """
        Retrieve blog detail from cache.

        :param blog_slug: The slug of the blog.
        :return: Cached blog dictionary or None if not found.
        """
        ...

    async def set(self, blog_slug: str, blog_data: dict[str, Any]) -> None:
        """
        Store blog detail in cache.

        :param blog_slug: The slug of the blog.
        :param blog_data: The blog dictionary to cache.
        """
        ...
