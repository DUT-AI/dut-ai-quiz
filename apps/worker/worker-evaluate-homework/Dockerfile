FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (libarchive-tools for archive extraction)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libarchive-tools \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set Vietnam timezone
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy workspace configuration and lockfile
COPY pyproject.toml uv.lock ./
COPY apps/api/pyproject.toml apps/api/README.md ./apps/api/
COPY apps/worker/worker-hackathon/pyproject.toml ./apps/worker/worker-hackathon/
COPY apps/worker/worker-lesson-index/pyproject.toml ./apps/worker/worker-lesson-index/
COPY apps/worker/worker-evaluate-homework/pyproject.toml ./apps/worker/worker-evaluate-homework/
COPY apps/worker/worker-pdf-import/pyproject.toml ./apps/worker/worker-pdf-import/

# Sync only this package and its dependencies
RUN uv sync --package dut-ai-quiz-worker-evaluate-homework --frozen --no-cache

# Copy source code of required packages
COPY apps/api ./apps/api
COPY apps/worker/worker-evaluate-homework ./apps/worker/worker-evaluate-homework

# Set working directory to worker app to run arq
WORKDIR /app/apps/worker/worker-evaluate-homework

# Run arq worker
CMD ["uv", "run", "arq", "worker_evaluate_homework.presentation.arq_tasks.WorkerSettings"]
