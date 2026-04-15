# Hướng dẫn triển khai (lộ trình)

Tài liệu tham chiếu kỹ thuật: [README.md](README.md).

## Giai đoạn 1 — Thiết lập dự án

- Khởi tạo **Monorepo**: Next.js (App Router) + FastAPI.
- **Docker Compose**: PostgreSQL. MinIO dùng **hạ tầng có sẵn** — biến `MINIO_*`: [storage.md](storage.md). Không commit file `.env` (chứa secret); khi có repo code, dùng `.env.example`.
- Cấu hình biến môi trường (URL Auth, DB, CORS, MinIO).

## Giai đoạn 2 — Cơ sở dữ liệu & domain

- Model SQLModel / migration **Alembic** theo [data-model.md](data-model.md).
- Schema Pydantic v2 cho request/response.

## Giai đoạn 3 — Backend core

- Dependency injection (session DB async).
- Middleware Auth: gọi `manage` `/auth/me`, map `quiz_role` — [auth.md](auth.md).
- Triển khai endpoint theo [api.md](api.md).
- Logic chấm điểm, shuffle, tab-out — [scoring-and-shuffle.md](scoring-and-shuffle.md), [anti-cheat-tab-out.md](anti-cheat-tab-out.md).

## Giai đoạn 4 — Frontend

- Teacher: quản lý câu hỏi / kỳ thi.
- Student: làm bài, visibility/tab-out, đếm ngược.
- **KaTeX** / MathJax cho LaTeX.
- TanStack Query + `credentials` khi gọi API (cookie).

## Sau MVP

- OpenAPI 3 xuất từ FastAPI hoặc file riêng.
- Audit `focus_events` nếu cần.
