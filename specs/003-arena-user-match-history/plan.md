# Implementation Plan: Arena User Match History (Lịch Sử Thi Đấu Dũng Sĩ)

**Branch**: `003-arena-user-match-history` | **Date**: 2026-10-19 | **Spec**: [specs/003-arena-user-match-history/spec.md](spec.md)

**Input**: Feature specification from `specs/003-arena-user-match-history/spec.md`

## Summary
Triển khai tính năng xem lịch sử thi đấu của dũng sĩ trực tiếp trên modal "Bảng Vàng Dũng Sĩ" trong phòng đấu trường Arena (`/lessons/[lesson-slug]/arena`). Cho phép người dùng click vào một dũng sĩ bất kỳ trong danh sách xếp hạng để xem danh sách tổng quan tất cả các lượt thi của người đó trong bài học hiện tại, và click tiếp vào một lượt thi cụ thể để xem các chỉ số thống kê chuyên sâu (điểm, vàng, thời gian, số câu đúng/sai, độ chính xác %, max streak, v.v.) mà hoàn toàn không để lộ văn bản câu hỏi và đáp án nhằm bảo mật dữ liệu thi. Toàn bộ thao tác chuyển đổi view diễn ra nội bộ trong modal hiện tại kèm thanh Breadcrumb điều hướng đa cấp.

## Technical Context

**Language/Version**: Python 3.11+ (Backend API), TypeScript 5+ (Frontend Next.js 15)

**Primary Dependencies**:
- Backend: FastAPI, Dishka (DI), SQLAlchemy (async), Pydantic v2
- Frontend: Next.js (App Router), React 19, Tailwind CSS, TanStack React Query v5, Framer Motion, Lucide React

**Storage**: PostgreSQL (bảng `game_sessions`, cột `snapshot` JSONB, `tags_filter` ARRAY)

**Testing**: pytest (Backend use case & endpoint tests), React Testing Library / manual verification

**Target Platform**: Web (Desktop & Mobile Responsive)

**Project Type**: Full-stack Web Application (Monorepo `apps/api` + `apps/web`)

**Performance Goals**: Tải danh sách lượt thi < 300ms, chuyển đổi view nội bộ modal tức thì (smooth framer-motion transition < 250ms).

**Constraints**:
- Không thay đổi thiết kế visual của bục Top 3 Podium; bục Top 3 KHÔNG gắn sự kiện click.
- Tuyệt đối không serialize hay truyền nội dung text câu hỏi và đáp án về client.
- In-modal view transition: Không mở popup lồng nhau (nested modals) và không mở drawer bên ngoài.

**Scale/Scope**: Áp dụng cho toàn bộ các bài học có tính năng Arena Quiz.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Không làm ảnh hưởng kiến trúc Clean Architecture của Backend (Domain Entity -> Use Case -> Presentation/Router).
- [x] Đảm bảo tính nhất quán của Design System trên Frontend (Tailwind tokens, dark mode support, framer motion).
- [x] Tuân thủ quy định bảo mật: Không rò rỉ đề bài câu hỏi / đáp án trắc nghiệm trong API response lịch sử thi đấu.

## Project Structure

### Documentation (this feature)

```text
specs/003-arena-user-match-history/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── get-user-match-history.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Impact Layout

```text
apps/api/
├── app/
│   ├── domain/
│   │   └── interfaces/
│   │       └── game_session_repo.py                 # Thêm method list_completed_by_user_and_lesson
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── game_sessions.py                     # Implement query DB cho user game sessions
│   ├── application/
│   │   └── use_cases/
│   │       └── game/
│   │           └── get_user_match_history.py        # Use case tính toán metrics lượt thi
│   └── presentation/
│       ├── schemas/
│       │   └── game.py                              # Thêm schema UserMatchHistoryItem, UserMatchHistoryResponse
│       └── api/
│           └── routers/
│               └── game.py                          # Thêm GET /{lesson_slug}/history/{user_id}
└── test/
    └── test_get_user_match_history.py               # Unit tests cho use case

apps/web/
├── features/
│   └── game/
│       ├── types.ts                                 # Zod schema & TypeScript type cho Match History
│       ├── queries.ts                               # hook useUserMatchHistory(lessonSlug, userId)
│       └── components/
│           ├── game-leaderboard-modal.tsx           # Quản lý view state (LEADERBOARD | MATCH_HISTORY | MATCH_METRICS)
│           ├── game-user-match-history-view.tsx     # View Tầng 2: Danh sách các lượt thi
│           └── game-user-match-metrics-view.tsx     # View Tầng 3: Chi tiết các chỉ số của 1 lượt thi
```

## Structure Decision
Phân tách rõ ràng:
1. Backend: Tận dụng dữ liệu hiện có trong `game_sessions` với JSONB snapshot để trích xuất `gamification` state và các chỉ số (streak, accuracy, lives, score, gold), đóng gói thành use case chuyên biệt `GetUserMatchHistoryUseCase`.
2. Frontend: Tách các view của modal thành các component con (`game-user-match-history-view.tsx`, `game-user-match-metrics-view.tsx`) để giữ cho `game-leaderboard-modal.tsx` luôn gọn gàng, dễ bảo trì và dễ animation chuyển cảnh.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Không có vi phạm | N/A | Thiết kế bám sát kiến trúc sẵn có, không phát sinh bảng DB mới |
