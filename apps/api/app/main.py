from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infrastructure.di import register_event_handlers, setup_di
from app.presentation.api.exceptions import setup_exception_handlers
from app.presentation.api.routers import (
    attempts,
    auth,
    dependency_requests,
    exams,
    external,
    hackathon_registrations,
    hackathon_tasks,
    hackathons,
    health,
    leaderboard,
    lessons,
    me,
    pdf_import,
    practice,
    questions,
    runtime_profiles,
    submissions,
    uploads,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Register event handlers that need async container
    await register_event_handlers(app.state.dishka_container)
    yield


app = FastAPI(title="dut-ai-quiz API", lifespan=lifespan)
setup_di(app)
setup_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
app.include_router(lessons.router, prefix="/api/v1")
app.include_router(hackathons.router, prefix="/api/v1")
app.include_router(hackathon_tasks.router, prefix="/api/v1")
app.include_router(hackathon_registrations.router, prefix="/api/v1")
app.include_router(runtime_profiles.router, prefix="/api/v1")
app.include_router(dependency_requests.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(exams.router, prefix="/api/v1")
app.include_router(attempts.router, prefix="/api/v1")
app.include_router(leaderboard.router, prefix="/api/v1")
app.include_router(practice.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(pdf_import.router, prefix="/api/v1")
app.include_router(external.router, prefix="/api/v1")
