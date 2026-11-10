from pydantic import BaseModel


class LoginPayload(BaseModel):
    email: str
    password: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int = 0
    refresh_expires_in: int = 0
