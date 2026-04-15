# dut-ai-quiz API

Backend dùng [**uv**](https://docs.astral.sh/uv/) + **FastAPI**, tổ chức theo hướng **DDD nhẹ** (không interface/ABC; tập trung nghiệp vụ ở `services`, use case chỉ điều phối):

| Thư mục | Vai trò |
| -------- | -------- |
| `presentation/` | Router FastAPI, schema Pydantic, `deps` — gọi use case |
| `application/use_cases/` | Mỗi file `execute(...)` — gọi repository + service theo từng luồng |
| `application/services/` | Logic thuần: chấm điểm, shuffle, map `role_name` → `quiz_role` |
| `infrastructure/persistence/` | SQLModel (bảng) |
| `infrastructure/repositories/` | Truy vấn/ghi DB (AsyncSession) |
| `infrastructure/auth_manage/` | HTTP client gọi `manage` `/auth/me` |
| `config.py` | Cài đặt (`pydantic-settings`) |

## Cài đặt

```bash
cd apps/api
uv sync --group dev
cp ../../.env.example ../../.env   # hoặc .env local trong apps/api
```

Chạy DB: `docker compose up -d postgres` từ root repo.

## Chạy server

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Migration (Alembic)

```bash
uv run alembic upgrade head
```

Tạo revision mới:

```bash
uv run alembic revision --autogenerate -m "message"
```
