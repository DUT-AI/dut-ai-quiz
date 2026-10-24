# Implementation Plan: Sửa lỗi chấm sai đáp án trong Game Arena (Fix Game Answer Verification & Timer Desync)

**Branch**: `005-fix-game-answer-verification` | **Date**: 2026-10-24 | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/005-fix-game-answer-verification/spec.md)

**Input**: Feature specification from `specs/005-fix-game-answer-verification/spec.md`

## Summary

Khắc phục triệt để lỗi người dùng chọn đáp án đúng nhưng hệ thống ghi nhận sai (`is_correct: false`) và trừ mạng. Lỗi xuất phát từ cơ chế đếm giờ trên máy chủ (`current_question_started_at`) bị trôi lệch:
1. Máy chủ kích hoạt bộ đếm câu tiếp theo ngay khi câu trước vừa kết thúc, trong khi người chơi còn đang ở màn hình kết quả câu trước.
2. Các phiên chơi dở dang khi nạp lại (`GET /sessions/active`) không được cập nhật mốc thời gian, khiến thời gian trôi qua (`elapsed`) vượt quá `time_limit + 10s`, làm kích hoạt logic chống gian lận đè `is_correct = False`.
3. Giao diện chưa hiển thị nổi bật đáp án đúng (viền xanh lá) khi người chơi trả lời sai.

Kế hoạch sẽ chuẩn hóa lại vòng đời của `current_question_started_at` trên backend (chỉ đếm giờ khi câu hỏi thực sự bắt đầu hiển thị/nạp qua `active` session hoặc chuyển câu), và hoàn thiện hiển thị đáp án đúng trên frontend `GameQuestionCard`.

## Technical Context

**Language/Version**: Python 3.12 (FastAPI backend) & TypeScript 5.x / Next.js 14+ (React 18 frontend)

**Primary Dependencies**:
- Backend: FastAPI, SQLAlchemy 2.0 (asyncpg), Dishka DI, Pydantic v2.
- Frontend: React (`useCallback`, `useState`), TanStack React Query, Sonner (`toast`), Framer Motion.

**Storage**: PostgreSQL (`quizdb_prod` / `quizdb_dev`), bảng `game_sessions` (cột `snapshot` kiểu JSONB).

**Testing**: Pytest cho use case `patch_game_answer.py` và `get_active_game_session.py`, Type-check frontend (`tsc --noEmit`), và kịch bản kiểm thử E2E trong [quickstart.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/005-fix-game-answer-verification/quickstart.md).

**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge) & Linux / macOS server.

**Project Type**: Web service (Backend API + Frontend Next.js).

**Performance Goals**: Không phát sinh thêm truy vấn DB dư thừa; thời gian phản hồi chấm điểm `< 100ms`.

**Constraints**: Giữ vững tính năng chống gian lận (Anti-cheat timer) cho các trường hợp cố tình gian lận thời gian thực sự, nhưng không được phạt oan người chơi bình thường; không phá vỡ hợp đồng dữ liệu hiện có của `/api/v1/game/*`.

**Scale/Scope**:
- Backend:
  - `apps/api/app/application/use_cases/game/patch_game_answer.py`
  - `apps/api/app/application/use_cases/game/get_active_game_session.py`
  - `apps/api/app/presentation/api/routers/game.py`
  - `apps/api/app/domain/value_objects/gamification.py`
- Frontend:
  - `apps/web/features/game/components/game-question-card.tsx`
  - `apps/web/features/game/hooks/use-game-turn.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Modularity & Clean Architecture**: Tách biệt rõ ràng giữa Domain (`GamificationState`), Use Case (`PatchGameAnswerUseCase`, `GetActiveGameSessionUseCase`), và Presentation (`routers/game.py`).
- [x] **Principle II: Zero Regression**: Giữ nguyên toàn bộ schema trả về của `GamificationAnswerResultOut` và cấu trúc snapshot.
- [x] **Principle III: Single Source of Truth for Correctness**: Tính đúng/sai của câu hỏi đối chiếu trực tiếp từ thuộc tính `opt.is_correct` trong DB, quy tắc chống gian lận chỉ can thiệp khi có bằng chứng hết giờ rõ ràng.
- [x] **Principle IV: Test-First & Verification**: Viết kịch bản kiểm thử cho trường hợp timeout hợp lệ vs trường hợp resume/transition hợp lệ.

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-game-answer-verification/
├── spec.md               # Feature specification
├── plan.md               # This implementation plan
├── research.md           # Phase 0 architectural & root-cause decisions
├── data-model.md         # Phase 1 snapshot state & entity definitions
├── contracts/            # Phase 1 API schemas & contracts
│   └── timer-and-answer-contracts.md
├── quickstart.md         # Phase 1 validation scenarios
└── checklists/
    └── requirements.md   # Spec quality checklist
```

### Source Code Layout

```text
apps/api/
├── app/
│   ├── application/use_cases/game/
│   │   ├── patch_game_answer.py           # Điều chỉnh timer reset & anti-cheat check
│   │   ├── get_active_game_session.py     # Làm mới timer khi nạp active session
│   │   └── start_game_session.py          # Khởi tạo timer câu đầu tiên
│   ├── domain/value_objects/
│   │   └── gamification.py                # Bổ sung helper đồng bộ timer
│   └── presentation/api/routers/
│       └── game.py                        # Endpoint get_active_game

apps/web/
└── features/game/
    ├── components/
    │   └── game-question-card.tsx         # Hiển thị xanh/đỏ cho correctOptionId & selectedOptionId
    └── hooks/
        └── use-game-turn.ts               # Đồng bộ sự kiện chuyển câu và nộp bài
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | Kiến trúc hiện tại đã rõ ràng; chỉ cần điều chỉnh đúng mốc kích hoạt timer và logic hiển thị. | Không cần tạo thêm bảng mới hay service phụ trợ. |
