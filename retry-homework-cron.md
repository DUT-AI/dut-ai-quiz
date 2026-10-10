# Kế hoạch triển khai Cron Job Retry Homework và Homework Submission

## Mục tiêu
Triển khai cron job chạy định kỳ trong `worker-evaluate-homework` (sử dụng ARQ cron) để tự động quét và chạy lại:
1. Các Homework chưa có `grading_status = 'READY'` (trong phạm vi 7 ngày gần nhất).
2. Các Homework Submission có `status != 'GRADED'` (trong phạm vi 7 ngày gần nhất, với các bài `FAILED` chỉ retry nếu lỗi do LLM/timeout, bỏ qua lỗi định dạng file nộp).

---

## Danh sách công việc (Tasks)

- [x] Task 1: Định nghĩa interface truy vấn trong `worker_evaluate_homework/domain/interfaces.py`
  - Thêm phương thức `list_stale_homework_ids(stale_minutes: int, days_limit: int, limit: int) -> list[UUID]`
  - Thêm phương thức `list_stale_submission_ids(stale_minutes: int, days_limit: int, limit: int) -> list[UUID]`
  → Verify: Type check và domain model hợp lệ.

- [x] Task 2: Cài đặt truy vấn trong `PostgresHomeworkGradingRepository`
  - Query homework: `grading_status IN ('PENDING', 'FAILED')` hoặc `PROCESSING` quá stale threshold (10p), trong 7 ngày, chưa archived.
  - Query submission: Thuộc homework `READY`, `status IN ('UPLOADED')` hoặc `GRADING` quá stale threshold (15p) hoặc `FAILED` do LLM/timeout (loại trừ `InvalidArtifactError`), trong 7 ngày.
  → Verify: Viết hàm query và đảm bảo không có cú pháp SQL sai.

- [x] Task 3: Tạo Use Case `RetryStaleHomeworkUseCase`
  - Quản lý logic: Gọi repository lấy danh sách homeworks cần retry ➔ enqueue `register_homework_job`; lấy danh sách submissions cần retry ➔ enqueue `evaluate_homework_job`.
  → Verify: Đảm bảo batch limit và thứ tự ưu tiên (Homework trước, Submission sau).

- [x] Task 4: Tích hợp cron job vào `arq_tasks.py` của `worker-evaluate-homework`
  - Thêm function `sweep_stale_homework_and_submissions_job(ctx)`
  - Thêm `cron(sweep_stale_homework_and_submissions_job, minute={0, 10, 20, 30, 40, 50})` vào `WorkerSettings.cron_jobs`.
  → Verify: WorkerSettings load thành công cùng ARQ CLI.

- [x] Task 5: Viết Unit Test cho Use Case và Repository
  - Thêm test trong `apps/worker/worker-evaluate-homework/test/test_homework_grading.py` kiểm tra logic lọc stale và gọi retry.
  → Verify: Chạy test thành công.

---

## Tiêu chí hoàn thành (Done When)
- [x] Cron job được cấu hình định kỳ mỗi 10 phút trong `WorkerSettings`.
- [x] Chỉ retry các bản ghi trong vòng 7 ngày qua.
- [x] Bỏ qua các bài nộp `FAILED` do lỗi file nộp không hợp lệ (`InvalidArtifactError`).
- [x] Unit tests pass và không gây regression.
