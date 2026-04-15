# Tài liệu dự án — dut-ai-quiz

Mục lục tài liệu kỹ thuật (tách file để dễ bảo trì).

| Tài liệu | Nội dung |
| -------- | -------- |
| [general.md](general.md) | SRS tổng quan: mục tiêu, tech stack, quy tắc nghiệp vụ cốt lõi |
| [auth.md](auth.md) | Tích hợp Auth (`manage.dutai.site`), cookie, domain, map vai trò |
| [data-model.md](data-model.md) | Lược đồ PostgreSQL + bổ sung đã chốt (shuffle, tab-out) |
| [api.md](api.md) | REST API Quiz service (`/api/v1`) |
| [scoring-and-shuffle.md](scoring-and-shuffle.md) | Chấm điểm thang 10, leaderboard, shuffle server-side, practice |
| [anti-cheat-tab-out.md](anti-cheat-tab-out.md) | Tab-out / auto-submit đồng bộ server |
| [implementation-roadmap.md](implementation-roadmap.md) | Giai đoạn triển khai (Monorepo → FE) |
| [storage.md](storage.md) | MinIO / biến môi trường lưu trữ ảnh |

Luồng đọc gợi ý: `general.md` → `auth.md` + `data-model.md` → `api.md` → `scoring-and-shuffle.md` + `anti-cheat-tab-out.md`.
