from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infrastructure.di import setup_di, register_event_handlers
from app.presentation.api.routers import (
    attempts,
    auth,
    exams,
    health,
    leaderboard,
    me,
    practice,
    questions,
    uploads,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Register event handlers that need async container
    await register_event_handlers(app.state.dishka_container)
    yield


app = FastAPI(title="dut-ai-quiz API", lifespan=lifespan)
setup_di(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(exams.router, prefix="/api/v1")
app.include_router(attempts.router, prefix="/api/v1")
app.include_router(leaderboard.router, prefix="/api/v1")
app.include_router(practice.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
