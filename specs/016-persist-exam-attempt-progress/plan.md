# Implementation Plan - Resilient Exam Attempt Progress & Safe Page Reload

## User Review Required

> [!NOTE]
> Kế hoạch bao gồm 2 phần:
> 1. **Backend (`apps/api`)**: Cập nhật `StartAttemptUseCase` và schema `StartAttemptOut` để trả về danh sách `saved_answers` khi học sinh resume lượt thi.
> 2. **Frontend (`apps/web`)**:
>    - Giảm debounce từ 1500ms xuống 300ms + Synchronous `localStorage` cache `exam_progress_{attemptId}` trên từng click.
>    - Flush dữ liệu chưa lưu bằng `fetch(..., { keepalive: true })` khi `beforeunload`.
>    - Thêm cơ chế Reload Grace Period (10 giây) cho `useAntiCheat` qua `sessionStorage` để không phạt nhầm vi phạm / tránh auto-submit khi F5.
>    - Lưu và khôi phục vị trí câu hỏi đang làm `currentIndex`.
>    - Dọn dẹp `localStorage` khi nộp bài thành công (`COMPLETED`).

---

## Proposed Changes

### Phase 1: Backend API Enhancement

#### `apps/api/app/presentation/schemas/attempts.py`
- Bổ sung trường `saved_answers: list[AttemptSavedAnswerItem] = Field(default_factory=list)` vào schema `StartAttemptOut`.

#### `apps/api/app/application/use_cases/attempts/start_attempt_use_case.py`
- Trong nhánh `active_att` (khi resume bài thi đang làm dở):
  - Lấy danh sách `saved_answers = await self._att_repo.list_answers(active_att.id)`.
  - Trả về `saved_answers` cùng với `attempt`, `presentation`, `is_resumed`.

#### `apps/api/app/presentation/api/routers/attempts.py`
- Map trường `saved_answers` vào `StartAttemptOut` trong endpoint `POST /exams/{exam_id}/attempts`.

---

### Phase 2: Frontend State & Persistence Optimization

#### `apps/web/features/attempts/hooks/useExamSession.ts`
- **Synchronous Cache**: Ghi ngay vào `localStorage` key `exam_progress_{attemptId}` mỗi khi gọi `setAnswer`.
- **Tối ưu Debounce**: Giảm từ 1500ms xuống 300ms.
- **Reconciliation**: Khi mount, kết hợp `localStorage` và `initialAnswers` từ server một cách an toàn, tránh trigger debounce auto-save giả lập khi vừa khôi phục.
- **Unload Flush**: Đăng ký sự kiện `beforeunload`, nếu còn câu trả lời chưa lưu kịp trên server (`prevAnswersRef`), gửi ngay lập tức bằng `fetch('/api/v1/attempts/' + attemptId + '/answers', { method: 'PATCH', keepalive: true, ... })`.
- **Cleanup**: Xóa key `exam_progress_{attemptId}` khi bài thi nộp thành công (`submit` / `autoSubmit`).

#### `apps/web/hooks/use-anti-cheat.ts`
- **Grace Period khi F5**:
  - Đăng ký sự kiện `beforeunload` để lưu cờ thời gian `sessionStorage.setItem("exam_reload_grace_" + attemptId, String(Date.now()))` và đánh dấu `isUnloadingRef.current = true`.
  - Khi mount lại: Nếu phát hiện cờ trong vòng 10 giây, bỏ qua các sự kiện vi phạm ban đầu do browser render/fullscreen transition kích hoạt, đồng thời cấp cooldown 5-10s cho `stabilizedAtRef`.

#### `apps/web/app/(root)/exams/[id]/attempt/[attemptId]/page.tsx`
- Lưu `currentIndex` vào `localStorage` cùng với tiến trình bài làm.
- Khi load trang, khởi tạo `currentIndex` từ `localStorage` (có kiểm tra giới hạn trong mảng `questions`).

---

## Verification Plan

### Automated Verification
1. Chạy Backend test:
   `make test` hoặc `uv run pytest apps/api/test/ -k "test_start_attempt or test_manage_student_attempts"`
2. Chạy Frontend build & type check:
   `npm run --prefix apps/web type-check`

### Manual Testing
1. **Kiểm tra F5 trực tiếp**: Vào làm bài thi, chọn nhanh 3 câu, ấn ngay F5 $\rightarrow$ Xác nhận các đáp án vẫn giữ nguyên, câu hỏi đang làm không bị nhảy về câu 1, và KHÔNG có cảnh báo vi phạm thoát màn hình.
2. **Kiểm tra Resume từ trang chủ**: Trả lời vài câu, quay lại trang `/exams/[id]`, bấm "TIẾP TỤC LÀM BÀI" $\rightarrow$ Xác nhận toàn bộ đáp án đã làm được nạp đầy đủ.
