# Tài liệu dự án — dut-ai-quiz

Mục lục tài liệu kỹ thuật (tách file để dễ bảo trì).

| Tài liệu | Nội dung |
| -------- | -------- |
| [homework-submission-system.md](homework-submission-system.md) | Giao bài, nộp bài, chấm tự động và kiến trúc ba worker |
| [lesson-semantic-search.md](lesson-semantic-search.md) | Nội dung bài học nội bộ, chunk embedding và API bài học liên quan |
| [general.md](general.md) | SRS tổng quan: mục tiêu, tech stack, quy tắc nghiệp vụ cốt lõi |
| [auth.md](auth.md) | Tích hợp Auth (`manage.dutai.io.vn`), cookie, domain, map vai trò |
| [data-model.md](data-model.md) | Lược đồ PostgreSQL + bổ sung đã chốt (shuffle, tab-out) |
| [api.md](api.md) | REST API Quiz service (`/api/v1`) |
| [scoring-and-shuffle.md](scoring-and-shuffle.md) | Chấm điểm thang 10, leaderboard, shuffle server-side, practice |
| [anti-cheat-tab-out.md](anti-cheat-tab-out.md) | Tab-out / auto-submit đồng bộ server |
| [implementation-roadmap.md](implementation-roadmap.md) | Giai đoạn triển khai (Monorepo → FE) |
| [storage.md](storage.md) | MinIO / biến môi trường lưu trữ ảnh |

Luồng đọc gợi ý: `general.md` → `auth.md` + `data-model.md` → `api.md` → `scoring-and-shuffle.md` + `anti-cheat-tab-out.md`.
