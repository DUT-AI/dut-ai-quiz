# Tasks: Manage & Delete Attempt Focus Violations

**Feature**: `017-manage-focus-violations`  
**Prerequisites**: `spec.md`, `plan.md`

---

## Phase 1: Setup & Foundational Infrastructure

**Purpose**: Bổ sung repository method xóa `focus_event` và use case xử lý logic giảm `tab_out_count`.

- [x] T001 [Backend] Thêm phương thức `delete(event_id: UUID) -> bool` và `delete_for_attempt(attempt_id: UUID) -> int` vào interface `IFocusEventRepository` trong `apps/api/app/domain/interfaces/focus_event_repo.py`.
- [x] T002 [Backend] Thực thi `delete` và `delete_for_attempt` trong `apps/api/app/infrastructure/repositories/focus_events.py`.
- [x] T003 [Backend] Tạo use cases `DeleteFocusEventUseCase` và `ClearAttemptFocusEventsUseCase` trong `apps/api/app/application/use_cases/exams/manage_focus_events_uc.py`:
  - `DeleteFocusEventUseCase`: Xóa focus event, giảm `tab_out_count = max(0, tab_out_count - 1)` trên attempt.
  - `ClearAttemptFocusEventsUseCase`: Xóa sạch focus events của attempt, đặt `tab_out_count = 0`.
- [x] T004 [Backend] Đăng ký DI providers trong `apps/api/app/infrastructure/di/use_cases.py`.
- [x] T005 [Backend] Tạo endpoints trong `apps/api/app/presentation/api/routers/exams.py`:
  - `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}/focus-events/{event_id}`
  - `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}/focus-events`

---

## Phase 2: User Story 1 - Delete Individual Focus Event (Priority: P1) 🎯 MVP

**Goal**: Giảng viên có thể xóa 1 sự kiện vi phạm giả lập, hệ thống xóa sự kiện và giảm `tab_out_count` đi 1.

- [x] T006 [P] [US1] Thêm mutation `useDeleteFocusEvent(examId, studentId)` trong `apps/web/features/exams/queries.ts`.
- [x] T007 [US1] Bổ sung icon thùng rác nhỏ trên từng dòng vi phạm trong `apps/web/features/exams/components/exam-stats/student-attempts/attempt-focus-timeline.tsx` với xác nhận confirm trước khi gọi mutation.

---

## Phase 3: User Story 2 - Clear All Focus Violations for Attempt (Priority: P2)

**Goal**: Giảng viên có thể bấm "Xóa tất cả vi phạm" để xóa toàn bộ bản ghi vi phạm của lượt thi và đưa `tab_out_count` về 0.

- [x] T008 [P] [US2] Thêm mutation `useClearAttemptFocusEvents(examId, studentId)` trong `apps/web/features/exams/queries.ts`.
- [x] T009 [US2] Thêm nút "Xóa tất cả vi phạm" ở thanh header của `attempt-focus-timeline.tsx`, mở dialog xác nhận trước khi xóa.

---

## Phase 4: Verification & Polish

**Purpose**: Đảm bảo toàn bộ luồng hoạt động chuẩn xác và không có lỗi kiểu dữ liệu.

- [x] T010 [Backend] Viết unit test cho cả 2 use case trong `apps/api/test/test_manage_focus_events.py`.
- [x] T011 [Frontend] Chạy `npm run --prefix apps/web type-check`.
