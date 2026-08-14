FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libarchive-tools \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set Vietnam timezone
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy workspace pyproject and locks
COPY pyproject.toml uv.lock ./
COPY apps/api/pyproject.toml apps/api/README.md ./apps/api/
COPY apps/worker/pyproject.toml ./apps/worker/

# Sync all projects in workspace
RUN uv sync --frozen --no-cache

# Copy source code of all workspace apps
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker

# Set working directory to worker app to run arq
WORKDIR /app/apps/worker

# Default to the hackathon worker. Compose overrides this command for the
# lesson-index and homework-evaluation worker processes.
CMD ["uv", "run", "arq", "worker_hackathon.presentation.arq_tasks.WorkerSettings"]
