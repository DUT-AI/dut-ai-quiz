# dut-ai-quiz

Monorepo: **FastAPI** (`apps/api`) + **Next.js** (`apps/web`). Tài liệu: [docs/README.md](docs/README.md).

## Yêu cầu

- Docker (PostgreSQL)
- Python 3.11+
- Node.js 20+

## Chạy nhanh (local)

1. Copy env:

   ```bash
   cp .env.example .env
   ```

   Chỉnh `DATABASE_URL` nếu cần.

2. Khởi động Postgres:

   ```bash
   docker compose up -d postgres
   ```

3. Backend (UV):

   ```bash
   cd apps/api
   uv sync --group dev
   # Tạo bảng (dev): khởi động API sẽ gọi create_all, hoặc dùng Alembic khi đã cấu hình
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Chi tiết cấu trúc module (DDD nhẹ): [apps/api/README.md](apps/api/README.md).

4. Frontend (terminal khác):

   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

- API: http://localhost:8000  
- API docs: http://localhost:8000/docs  
- Web: http://localhost:3000  

## Auth

Ứng dụng quiz không có form đăng nhập: đăng nhập qua **manage** (`MANAGE_BASE_URL`), cookie `Domain=.dutai.site` gửi kèm request tới API quiz. Dev có thể dùng `AUTH_DEV_BYPASS=true` (xem `.env.example`).

## Code Quality & Pre-commit Hooks

Dự án đã tích hợp Git Pre-commit Hook để tự động kiểm tra chất lượng code của tất cả các module trước khi `git commit`:

1. **Kích hoạt hook (chỉ cần chạy 1 lần)**:
   ```bash
   make hooks-install
   # hoặc: bash scripts/setup-hooks.sh
   ```

2. **Chạy kiểm tra thủ công**:
   - Kiểm tra toàn diện mọi module: `make check`
   - Linting (Python + Web): `make lint`
   - Tự động sửa lỗi lint: `make lint-fix`
   - Kiểm tra kiểu dữ liệu frontend TypeScript: `make type-check`

## Tham chiếu UI

[reference/frontend-quizz-app](reference/frontend-quizz-app) — chỉ tham khảo; luồng dữ liệu thật qua REST `/api/v1`.

