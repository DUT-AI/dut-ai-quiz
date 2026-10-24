# Tasks: Sửa lỗi chấm sai đáp án trong Game Arena (Fix Game Answer Verification & Timer Desync)

**Input**: Design documents from `specs/005-fix-game-answer-verification/`
**Prerequisites**: [plan.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/005-fix-game-answer-verification/plan.md), [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/005-fix-game-answer-verification/spec.md), [research.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/005-fix-game-answer-verification/research.md), [data-model.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/005-fix-game-answer-verification/data-model.md), [contracts/timer-and-answer-contracts.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/005-fix-game-answer-verification/contracts/timer-and-answer-contracts.md)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to user stories US1, US2, US3 from spec.md

---

## Phase 1: Setup (Preparation & Verification)

**Purpose**: Xác minh môi trường và kiểm tra cấu trúc hiện tại của Game Arena

- [X] T001 Khảo sát hiện trạng logic chấm điểm và các mốc timer trong `apps/api/app/application/use_cases/game/patch_game_answer.py` và `apps/web/features/game/components/game-question-card.tsx`

---

## Phase 2: Foundational (Core Timer State Helpers)

**Purpose**: Bổ sung helper quản lý trạng thái timer câu hỏi trong Domain Model làm nền tảng cho tất cả User Stories

- [X] T002 Cập nhật `GamificationState` trong `apps/api/app/domain/value_objects/gamification.py` để hỗ trợ đặt `current_question_started_at = None` (idle state giữa 2 câu) và hàm kiểm tra `is_question_timer_stale(time_limit, buffer=10.0)`

**Checkpoint**: Nền tảng domain sẵn sàng cho các use case xử lý thời gian.

---

## Phase 3: User Story 1 - Chấm điểm chuẩn xác & Hiển thị đáp án đúng (Priority: P1) 🎯 MVP

**Goal**: Đảm bảo người dùng chọn đáp án đúng luôn được hệ thống chấm đúng (`is_correct: true`), cộng điểm và hiển thị viền xanh lá; khi chọn sai hiển thị viền đỏ và highlight đáp án đúng thực sự.

**Independent Test**: Vào một câu hỏi bất kỳ, chọn đúng đáp án C `[2]`, hệ thống xác nhận chính xác, không bị ghi đè timeout sai sót.

- [X] T003 [US1] Sửa đổi `PatchGameAnswerUseCase` trong `apps/api/app/application/use_cases/game/patch_game_answer.py` để đảm bảo `is_correct` kiểm tra đối chiếu chính xác `q_db.options` và chỉ áp dụng anti-cheat khi timer câu hỏi đang thực sự kích hoạt
- [X] T004 [P] [US1] Cập nhật styling trong `apps/web/features/game/components/game-question-card.tsx` để hiển thị viền xanh lá (`border-emerald-500`) khi đúng, và khi người dùng chọn sai thì hiển thị viền xanh lá nổi bật kèm icon checkmark cho `option.id === correctOptionId`
- [X] T005 [US1] Kiểm tra thực tế luồng nộp câu hỏi với đáp án đúng và đáp án sai trong `apps/web/features/game/components/game-container.tsx`

**Checkpoint**: User Story 1 hoàn thành độc lập - người dùng trả lời câu hỏi bình thường được chấm đúng 100%.

---

## Phase 4: User Story 2 - Tải lại hoặc tiếp tục phiên chơi dở dang không bị phạt hết giờ (Priority: P1)

**Goal**: Người chơi tải lại trang (F5) hoặc mở lại phiên chơi dở dang từ trước đó không bị phạt timeout oan uổng ở câu hỏi hiện tại.

**Independent Test**: Đang làm một câu hỏi, tải lại trang trình duyệt sau 2 phút, chọn đáp án đúng và hệ thống vẫn chấm đúng bình thường.

- [X] T006 [US2] Cập nhật `GetActiveGameSessionUseCase` trong `apps/api/app/application/use_cases/game/get_active_game_session.py` để tự động làm mới `current_question_started_at` thành `now_ict().isoformat()` nếu timer chưa được set hoặc đã bị quá hạn (stale session resume)
- [X] T007 [US2] Cập nhật router `get_active_game` trong `apps/api/app/presentation/api/routers/game.py` để lưu lại snapshot phiên chơi vào cơ sở dữ liệu khi timer được làm mới lúc nạp active session
- [X] T008 [US2] Kiểm tra kịch bản resume session cũ bằng cách nạp lại phiên hoạt động và xác nhận câu hỏi đầu tiên không bị phạt hết giờ

**Checkpoint**: User Story 2 hoàn thành - F5 trang hoặc tiếp tục chơi sau nhiều giờ không còn gây mất mạng oan.

---

## Phase 5: User Story 3 - Chuyển tiếp câu hỏi mượt mà không hao hụt thời gian suy nghĩ (Priority: P2)

**Goal**: Người chơi dừng lại ở màn hình kết quả câu $N$ (xem hoạt ảnh, đọc giải thích) không làm tiêu hao quỹ thời gian của câu $N+1$.

**Independent Test**: Trả lời xong câu 1, nán lại ở màn hình kết quả 35 giây trước khi nhấn "TIẾP TỤC HÀNH TRÌNH", sau đó bước vào câu 2 và trả lời trong 10 giây; hệ thống chấm đúng bình thường.

- [X] T009 [US3] Cập nhật `PatchGameAnswerUseCase` trong `apps/api/app/application/use_cases/game/patch_game_answer.py` để gán `state.current_question_started_at = None` sau khi ghi nhận câu trả lời, trì hoãn việc đếm giờ câu kế tiếp cho đến khi người chơi thực sự chuyển câu
- [X] T010 [US3] Đồng bộ sự kiện chuyển câu trong `apps/web/features/game/hooks/use-game-turn.ts` để đảm bảo `refetchActiveSession()` nạp câu mới và đồng bộ lại bộ đếm thời gian với máy chủ
- [X] T011 [US3] Kiểm tra kịch bản chờ đợi ở màn hình kết quả câu cũ > 30s trước khi chuyển sang câu tiếp theo

**Checkpoint**: Hoàn thành toàn bộ 3 User Stories.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Rà soát chất lượng mã nguồn, kiểm tra type và xác thực toàn bộ kịch bản

- [X] T012 [P] Chạy kiểm tra TypeScript compilation `npx tsc --noEmit` trong thư mục `apps/web` đảm bảo không có lỗi kiểu dữ liệu
- [X] T013 Thực thi kiểm tra xác nhận đầy đủ 5 kịch bản trong `specs/005-fix-game-answer-verification/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)** $\rightarrow$ **Phase 2 (Foundational)**: Thiết lập nền tảng helper timer trong domain.
- **Phase 2** $\rightarrow$ **Phase 3 (User Story 1 - MVP)**: Triển khai logic chấm điểm chính xác và giao diện đáp án đúng.
- **Phase 3** $\rightarrow$ **Phase 4 (User Story 2)**: Xử lý resume phiên chơi cũ không bị timeout.
- **Phase 4** $\rightarrow$ **Phase 5 (User Story 3)**: Hoàn thiện đồng bộ chuyển câu mượt mà.
- **Phase 5** $\rightarrow$ **Phase 6 (Polish & Validation)**: Kiểm tra tổng thể type check và E2E scenarios.

### Parallel Opportunities
- `T004` (Cập nhật giao diện `GameQuestionCard`) có thể thực hiện song song với `T003` (Cập nhật backend `PatchGameAnswerUseCase`).
- `T012` (Kiểm tra TypeScript) có thể chạy độc lập.

---

## Implementation Strategy (MVP First)

1. **MVP Scope (Phase 1, 2, 3)**:
   - Sửa lỗi cốt lõi: Đảm bảo đáp án đúng đối chiếu chính xác từ database, không bị đè sai do timer khi đang ở trong câu hỏi.
   - Hiển thị trực quan đáp án đúng khi người dùng chọn sai.
2. **Incremental Delivery (Phase 4 & 5)**:
   - Thêm cơ chế Lazy Timer và Auto-Refresh khi nạp lại phiên chơi dở dang.
   - Thử nghiệm các kịch bản F5 và chờ đợi lâu giữa các câu.
3. **Final Validation (Phase 6)**:
   - Xác nhận toàn bộ 5 kịch bản kiểm thử trong quickstart.md.
