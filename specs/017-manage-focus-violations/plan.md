# Implementation Plan - Manage & Delete Focus Violations

## User Review Required

> [!NOTE]
> Tính năng cho phép Giảng viên / Quản trị viên xóa sự kiện vi phạm gian lận trên trang chi tiết lượt thi của học sinh:
> 1. Xóa 1 sự kiện vi phạm: Xóa bản ghi trong `focus_events` và tự động trừ giảm `attempts.tab_out_count -= 1` (giới hạn tối thiểu là 0).
> 2. Xóa tất cả sự kiện vi phạm: Dọn sạch mọi bản ghi `focus_events` của lượt thi đó và reset `attempts.tab_out_count = 0`.

---

## Proposed Changes

### Phase 1: Backend Domain & Repository Extension

#### `apps/api/app/domain/interfaces/focus_event_repo.py`
- Bổ sung interface:
  - `delete(event_id: UUID) -> bool`
  - `delete_for_attempt(attempt_id: UUID) -> int`

#### `apps/api/app/infrastructure/repositories/focus_events.py`
- Cài đặt thực thi `delete` và `delete_for_attempt` bằng SQLAlchemy async session.

#### `apps/api/app/application/use_cases/exams/manage_focus_events_uc.py`
- Tạo use case `DeleteFocusEventUseCase`:
  - Kiểm tra quyền Giảng viên/Admin sở hữu kỳ thi.
  - Xóa sự kiện theo `event_id`.
  - Nếu thành công, giảm `attempt.tab_out_count = max(0, attempt.tab_out_count - 1)` và lưu lại.
- Tạo use case `ClearAttemptFocusEventsUseCase`:
  - Kiểm tra quyền Giảng viên/Admin.
  - Xóa tất cả sự kiện của `attempt_id`.
  - Cập nhật `attempt.tab_out_count = 0` và lưu lại.

#### `apps/api/app/presentation/api/routers/exams.py`
- Thêm 2 endpoints:
  - `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}/focus-events/{event_id}`
  - `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}/focus-events`

#### `apps/api/app/infrastructure/di/use_cases.py`
- Đăng ký DI provider cho 2 use case mới.

---

### Phase 2: Frontend API Queries & UI Integration

#### `apps/web/features/exams/queries.ts`
- Bổ sung React Query mutations:
  - `useDeleteFocusEvent(examId, studentId)`
  - `useClearAttemptFocusEvents(examId, studentId)`
  - Khi thành công, tự động invalidate query `["student-attempts", examId, studentId]` và `["exam-stats", examId]`.

#### `apps/web/features/exams/components/exam-stats/student-attempts/attempt-focus-timeline.tsx`
- Bổ sung nút thùng rác nhỏ ở bên phải mỗi dòng vi phạm kèm tooltip / confirm.
- Bổ sung nút **"Xóa tất cả vi phạm"** ở phần tiêu đề khi `events.length > 0`.
- Hiển thị dialog xác nhận trước khi thực hiện xóa.

---

## Verification Plan

### Automated Tests
1. Viết test backend trong `apps/api/test/test_manage_focus_events.py`:
   - Test xóa 1 event $\rightarrow$ event biến mất, `tab_out_count` giảm 1.
   - Test xóa tất cả event $\rightarrow$ dọn sạch, `tab_out_count` về 0.
2. Chạy `npm run --prefix apps/web type-check`.

### Manual Testing
- Truy cập `http://localhost:3000/teacher/stats/d0f55af0-c022-4890-b9ff-f1b3cef0ceaf/students/40`
- Bấm vào tab "Nhật ký gian lận".
- Xóa 1 vi phạm $\rightarrow$ Số vi phạm giảm còn 1, `2 LẦN THOÁT TAB` giảm còn `1 LẦN THOÁT TAB`.
- Bấm "Xóa tất cả vi phạm" $\rightarrow$ Danh sách vi phạm chuyển sang khung xanh "Không ghi nhận bất kỳ vi phạm nào", thẻ học sinh không còn cảnh báo.
