# dut-ai-quiz — lệnh tiện dụng (Postgres Docker + API UV + Alembic)
# Dùng: make help

.PHONY: help db-up db-down db-logs api-sync api-dev api-lint \
	migrate migrate-down alembic-revision alembic-history alembic-current \
	dev-web web-dev

API_DIR := apps/api
WEB_DIR := apps/web
COMPOSE := docker compose

help:
	@echo "Targets:"
	@echo "  db-up            - docker compose: Postgres (nền)"
	@echo "  db-down          - dừng stack (compose down)"
	@echo "  db-logs          - log Postgres"
	@echo "  api-sync         - uv sync --group dev trong $(API_DIR)"
	@echo "  api-dev          - chạy FastAPI reload :8000"
	@echo "  api-lint         - ruff check $(API_DIR)"
	@echo "  migrate          - alembic upgrade head"
	@echo "  migrate-down     - alembic downgrade -1"
	@echo "  alembic-revision - autogenerate (cần MSG=\"...\")"
	@echo "  alembic-history  - lịch sử revision"
	@echo "  alembic-current  - revision hiện tại trên DB"
	@echo "  dev-web          - chạy Next.js dev server cho frontend (apps/web)"

db-up:
	$(COMPOSE) up -d postgres

db-down:
	$(COMPOSE) down

db-logs:
	$(COMPOSE) logs -f postgres

api-sync:
	cd $(API_DIR) && uv sync --group dev

api-dev: api-sync
	cd $(API_DIR) && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

api-lint:
	cd $(API_DIR) && uv run ruff check app

migrate: api-sync
	cd $(API_DIR) && uv run alembic upgrade head

migrate-down: api-sync
	cd $(API_DIR) && uv run alembic downgrade -1

# Ví dụ: make alembic-revision MSG="add column foo"
alembic-revision: api-sync
	@test -n "$(MSG)" || (echo "Đặt MSG, ví dụ: make alembic-revision MSG=add_users_table" && exit 1)
	cd $(API_DIR) && uv run alembic revision --autogenerate -m "$(MSG)"

alembic-history: api-sync
	cd $(API_DIR) && uv run alembic history

alembic-current: api-sync
	cd $(API_DIR) && uv run alembic current

dev-web web-dev:
	cd $(WEB_DIR) && npm run dev
