import asyncio

from app.main import app
from app.presentation.api.deps import UserContext, get_current_user
from httpx import AsyncClient


async def test():
    # Bypass auth by overriding get_current_user dependency
    app.dependency_overrides[get_current_user] = lambda: UserContext(
        id=17,
        roles=["student"]
    )

    import httpx
    transport = httpx.ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/game/sessions", json={"lesson_slug": "cnn-co-ban"})
        print("POST Response status:", response.status_code)
        print("POST Response body:", response.json() if response.status_code == 200 else response.text)

asyncio.run(test())
