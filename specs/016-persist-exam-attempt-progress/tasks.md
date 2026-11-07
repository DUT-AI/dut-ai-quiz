# Tasks: Resilient Exam Attempt Progress & Safe Page Reload

**Feature**: `016-persist-exam-attempt-progress`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`

---

## Phase 1: Setup & Foundational Infrastructure

**Purpose**: Nâng cấp Backend contract để endpoint `POST /exams/{id}/attempts` (resume) trả về `saved_answers`.

- [x] T001 [Backend] Thêm trường `saved_answers: list[AttemptSavedAnswerItem] = Field(default_factory=list)` vào schema `StartAttemptOut` trong `apps/api/app/presentation/schemas/attempts.py`.
- [x] T002 [Backend] Cập nhật use case `StartAttemptUseCase` trong `apps/api/app/application/use_cases/attempts/start_attempt_use_case.py` để nạp `saved_answers = await self._att_repo.list_answers(active_att.id)` khi `is_resumed=True`.
- [x] T003 [Backend] Cập nhật router `start_attempt_route` trong `apps/api/app/presentation/api/routers/attempts.py` để map `saved_answers` vào `StartAttemptOut`.
- [x] T004 [Contract Sync] Chạy `make generate-api` để cập nhật TypeScript types trong `apps/web/types/api.generated.d.ts`.

---

## Phase 2: User Story 1 - Instant Local & Server Dual-Sync on Answer Selection (Priority: P1) 🎯 MVP

**Goal**: Học sinh chọn đáp án được lưu tức thì vào `localStorage` (`exam_progress_{attempt_id}`), debounce gửi server giảm xuống 300ms, và flush bằng `fetch(..., { keepalive: true })` khi F5 hoặc đóng tab.

- [x] T005 [P] [US1] Cập nhật hook `useExamSession` trong `apps/web/features/attempts/hooks/useExamSession.ts`:
  - Thêm logic đọc và ghi đồng bộ `localStorage` (`exam_progress_{attemptId}`).
  - Hợp nhất (`reconcile`) an toàn giữa `initialAnswers` từ server và `localStorage` khi mount mà không kích hoạt debounce giả lập.
- [x] T006 [US1] Giảm thời gian debounce auto-save từ 1500ms xuống 300ms trong `apps/web/features/attempts/hooks/useExamSession.ts`.
- [x] T007 [US1] Bổ sung sự kiện `beforeunload` trong `useExamSession.ts` để flush ngay các câu chưa kịp gửi lên server qua `fetch(..., { keepalive: true })`.
- [x] T008 [US1] Dọn dẹp key `exam_progress_{attemptId}` trong `localStorage` khi bài thi được nộp thành công (`submit` / `autoSubmit`).

---

## Phase 3: User Story 2 - Safe Page Reload Without Anti-Cheat Penalty (Priority: P1)

**Goal**: Loại bỏ phạt nhầm vi phạm gian lận (thực chất là F5 hoặc tải lại trang) gây tự động nộp bài oan với 0 điểm.

- [x] T009 [US2] Cập nhật hook `useAntiCheat` trong `apps/web/hooks/use-anti-cheat.ts`:
  - Bắt sự kiện `beforeunload`, đặt cờ ân hạn `sessionStorage.setItem("exam_reload_grace_" + attemptId, String(Date.now()))` và gán cờ `isUnloadingRef.current = true` để bỏ qua các event blur/mouseleave khi trang bắt đầu dỡ bỏ (teardown).
  - Khi mount lại: Nếu phát hiện cờ trong vòng 10 giây (`Date.now() - timestamp < 10000`), triệt tiêu các sự kiện vi phạm ban đầu và gia hạn cooldown `stabilizedAtRef` (thêm 5s) để giao diện và chế độ fullscreen ổn định.

---

## Phase 4: User Story 3 - Restore Last Active Question Index on Resume (Priority: P2)

**Goal**: Ghi nhớ câu hỏi học sinh đang xem hoặc làm dở, phục hồi đúng câu hỏi đó khi reload hoặc vào lại.

- [x] T010 [US3] Cập nhật `apps/web/app/(root)/exams/[id]/attempt/[attemptId]/page.tsx`:
  - Lưu `currentIndex` vào `localStorage` khi học sinh chuyển câu hỏi.
  - Khởi tạo `currentIndex` từ `localStorage` khi trang load xong câu hỏi (có clamp từ 0 đến `questions.length - 1`).

---

## Phase 5: Verification & Polish

**Purpose**: Đảm bảo toàn bộ hệ thống hoạt động trơn tru, đúng chuẩn và không có lỗi kiểu dữ liệu.

- [x] T011 Chạy test backend `test_manage_student_attempts.py` và kiểm tra `StartAttemptUseCase`.
- [x] T012 Chạy `npm run --prefix apps/web type-check` để đảm bảo code frontend không có lỗi TypeScript.
- [x] T013 Thực hiện kiểm thử thủ công theo kịch bản trong `specs/016-persist-exam-attempt-progress/quickstart.md`.
