from pydantic import BaseModel, Field


class Message(BaseModel):
    detail: str = Field(default="ok")


class OptionIn(BaseModel):
    id: str
    text: str
    is_correct: bool = False


class FocusEventIn(BaseModel):
    event: str
    client_event_id: str
    client_ts: str | None = None
