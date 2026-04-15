# Đặc tả yêu cầu hệ thống (SRS) — Tổng quan

**Hệ thống kiểm tra & luyện tập trong lớp học** (nền tảng web nội bộ).

Tài liệu chi tiết đã tách: xem [README.md](README.md).

---

## 1. Tổng quan dự án

- **Mục tiêu**: Nền tảng web để kiểm tra và luyện tập nội bộ.
- **Người dùng**: Giáo viên (người tạo/quản trị nội dung) và học viên (làm bài).
- **Auth bên ngoài**: Đã có service xác thực; DB user thuộc hệ thống Auth. **Ứng dụng quiz không triển khai đăng ký/đăng nhập** — dùng phiên đăng nhập hiện có (cookie/session) và xác định người dùng qua API Auth; `user_id` kiểu **int** dùng làm khóa ngoại trong DB của quiz. Chi tiết: [auth.md](auth.md).

---

## 2. Kiến trúc & công nghệ (tech stack)

- Monorepo; **Docker Compose** (local).
- **Backend**: Python, **FastAPI** (REST), Clean Architecture & DDD.
- **ORM**: SQLModel (async); validate: **Pydantic v2**.
- **Database**: PostgreSQL; migration: **Alembic**.
- **Frontend**: **Next.js** (App Router, TypeScript), **Tailwind CSS**.
- **Data fetching**: TanStack Query + Axios.
- **Toán/LaTeX**: KaTeX hoặc MathJax.
- **Ảnh**: MinIO (S3-compatible; có thể host sẵn — xem [storage.md](storage.md)) hoặc file tĩnh MVP — DB chỉ lưu URL.

---

## 3. Quy tắc nghiệp vụ cốt lõi

- **Kho câu hỏi**: Tách **Practice pool** và **Exam pool**; câu dùng cho kỳ thi không xuất hiện trong luyện tập.
- **Nội dung câu**: Hỗ trợ văn bản (Markdown), URL ảnh, LaTeX, lời giải (xem solution theo policy sau nộp).
- **Thời gian**: Đếm ngược phía client; **hết giờ** thì thu bài (đồng bộ server — xem [api.md](api.md), [anti-cheat-tab-out.md](anti-cheat-tab-out.md)).
- **Xáo trộn**: Do **server** khi bắt đầu attempt; client chỉ render theo payload. Chi tiết: [scoring-and-shuffle.md](scoring-and-shuffle.md).
- **Chống gian lận / tab-out**: Theo dõi visibility tab; lần 1 cảnh báo, lần 2 auto-submit — **bộ đếm nguồn sự thật server**. Chi tiết: [anti-cheat-tab-out.md](anti-cheat-tab-out.md).

### Phân quyền (RBAC trong app quiz)

Ánh xạ từ `role_name` hệ Auth: xem [auth.md](auth.md).

- **Teacher**: CRUD câu hỏi, tạo/kỳ thi, xem lịch sử làm bài & leaderboard.
- **Student**: Làm thi, luyện tập, xem lịch sử cá nhân và lời giải (theo policy sau nộp).

---

## 4. Lược đồ & API

- Schema PostgreSQL và các cột bổ sung: [data-model.md](data-model.md).
- REST API: [api.md](api.md).

---

## 5. Lộ trình triển khai

Xem [implementation-roadmap.md](implementation-roadmap.md) (thay cho tham chiếu “Phần 5” cũ chỉ nói chung chung).
