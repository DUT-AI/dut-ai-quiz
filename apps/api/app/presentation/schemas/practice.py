from pydantic import BaseModel

class GamificationStartIn(BaseModel):
    lesson_slug: str
