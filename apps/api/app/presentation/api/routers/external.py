import httpx
from fastapi import APIRouter, HTTPException
from app.presentation.api.deps import AdminOrMentorUser
from app.config import settings
from loguru import logger

router = APIRouter(prefix="/external", tags=["external"])


@router.get("/teams")
async def get_external_teams(user: AdminOrMentorUser):
    headers = {"Authorization": f"Bearer {settings.manage_api_key}"}
    url = f"{settings.manage_base_url}/api/v1/teams?skip=0&limit=100"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            logger.debug(f"Proxy response status: {response.status_code}")
            response.raise_for_status()
            try:
                return response.json()
            except Exception as json_err:
                logger.error(
                    f"Failed to parse JSON: {json_err}. Content: {response.text[:500]}"
                )
                raise HTTPException(
                    status_code=500, detail="External API returned invalid JSON"
                )
        except Exception as e:
            if isinstance(e, httpx.HTTPStatusError):
                logger.error(
                    f"External API error: {e.response.status_code} - {e.response.text[:500]}"
                )
            else:
                logger.error(f"Proxy error: {str(e)}")
            raise e


@router.get("/users")
async def get_external_users(user: AdminOrMentorUser):
    headers = {"Authorization": f"Bearer {settings.manage_api_key}"}
    url = f"{settings.manage_base_url}/api/v1/users"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            logger.debug(f"Proxy response status: {response.status_code}")
            response.raise_for_status()
            try:
                return response.json()
            except Exception as json_err:
                logger.error(
                    f"Failed to parse JSON: {json_err}. Content: {response.text[:500]}"
                )
                raise HTTPException(
                    status_code=500, detail="External API returned invalid JSON"
                )
        except Exception as e:
            if isinstance(e, httpx.HTTPStatusError):
                logger.error(
                    f"External API error: {e.response.status_code} - {e.response.text[:500]}"
                )
            else:
                logger.error(f"Proxy error: {str(e)}")
            raise e
