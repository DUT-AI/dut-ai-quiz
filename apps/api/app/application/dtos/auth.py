from pydantic import BaseModel


class LoginPayload(BaseModel):
    email: str
    password: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
