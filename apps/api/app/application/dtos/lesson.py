from pydantic import BaseModel


class LessonMetadataOutDTO(BaseModel):
    slug: str
    name: str
    has_coding: bool
    has_game: bool
    coding_count: int
    game_question_count: int
    is_ready: bool
