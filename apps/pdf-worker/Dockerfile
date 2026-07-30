FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
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
COPY apps/pdf-worker/pyproject.toml ./apps/pdf-worker/

# Sync all projects in workspace
RUN uv sync --frozen --no-cache

# Copy source code of all workspace apps
COPY apps/api ./apps/api
COPY apps/pdf-worker ./apps/pdf-worker

# Set working directory to worker app to run arq
WORKDIR /app/apps/pdf-worker

# Run arq worker using worker.presentation.arq_tasks module path
CMD ["uv", "run", "arq", "worker.presentation.arq_tasks.WorkerSettings"]
