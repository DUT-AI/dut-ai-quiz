# Tổng hợp thay đổi luồng nộp bài Hackathon

Ngày cập nhật: 2026-07-09

Tài liệu này tổng hợp các thay đổi đã thực hiện cho luồng nộp bài hackathon, realtime bảng điểm và worker chấm bài. Phạm vi sửa bám theo các lỗ hổng đã nêu: race condition giữa DB transaction và queue, bypass quota, payload queue dư thừa, bắt buộc model weights chưa hợp lý, submission bị kẹt, log sandbox gây OOM, và việc dùng WebSocket khi Server-Sent Events phù hợp hơn.

## Tóm tắt kết quả

- Chuyển realtime bảng điểm từ WebSocket sang Server-Sent Events (SSE).
- API `/submit` chỉ nhận `submission_id`; worker tự query DB để lấy toàn bộ thông tin cần chấm.
- Bước presign tạo sẵn bản ghi submission `UPLOADING` và commit ngay.
- Queue ARQ chỉ truyền `submission_id`, không truyền `script_s3_key`, `ground_truth_s3_key`, `metric_type`.
- Quota được kiểm tra lại ở `/submit`, có advisory lock để chống submit song song vượt giới hạn.
- Quota chỉ tính các trạng thái thực sự đã vào hàng chấm hoặc có kết quả, không tính `FAILED`, `CANCELLED`, `UPLOADING`.
- Model weights chuyển thành optional.
- Worker có cơ chế quét submission bị kẹt và mark `FAILED`.
- Docker sandbox chỉ đọc tail logs để tránh giữ log lớn trong RAM.
- Frontend bỏ polling/refetchInterval cho submission active, dùng SSE để server chủ động đẩy update.

## Mapping lỗi cũ và cách sửa

| Lỗi/vấn đề cũ | Cách sửa | Lợi ích sau khi sửa |
| --- | --- | --- |
| Worker có thể chạy trước khi transaction API commit, dẫn tới `Submission not found`. | Presign tạo bản ghi `UPLOADING` và commit ngay; `/submit` commit trạng thái queued trước khi enqueue. | Worker luôn đọc được submission từ DB, giảm crash/race condition. |
| `/submit` có thể bị gọi trực tiếp để bypass quota vì quota chỉ nằm ở presign. | `/submit` kiểm tra quota lại ngay trước khi queue. | Không thể bỏ qua presign để vượt giới hạn nộp bài. |
| Submit song song có thể cùng thấy quota còn trống và vượt `max_submissions`. | Thêm PostgreSQL advisory lock theo `task_id + participant`. | Chặn race condition khi nhiều request submit cùng lúc. |
| `FAILED` do lỗi hệ thống vẫn bị tính quota, làm thí sinh mất lượt oan. | `count_submissions` chỉ tính `EXTRACTING`, `RUNNING`, `EVALUATING`, `PUBLISHED`. | Lỗi nền tảng không làm mất lượt nộp bài của thí sinh. |
| Queue payload truyền nhiều dữ liệu có thể lệch với DB (`script_s3_key`, `metric_type`, private test...). | Queue chỉ truyền `submission_id`; worker query submission/task từ DB. | DB trở thành single source of truth, dễ retry/debug hơn. |
| API bắt buộc model weights trong khi worker đã cho phép không có model. | `model_filename`, presigned model info và frontend model file đều optional. | Hỗ trợ bài hackathon chỉ cần script/rule-based/statistical baseline. |
| Submission có thể kẹt mãi ở `UPLOADING`, `EXTRACTING`, `RUNNING`, `EVALUATING`. | Worker thêm cron sweep stale submissions và mark `FAILED`. | Thí sinh/admin nhìn thấy trạng thái kết thúc rõ ràng thay vì quay vô hạn. |
| Sandbox đọc toàn bộ logs vào RAM, có nguy cơ OOM nếu script spam stdout/stderr. | Docker sandbox chỉ đọc tail logs theo `settings.log_max_lines`. | Giảm rủi ro worker bị hạ vì log quá lớn. |
| WebSocket phức tạp trong khi chỉ cần server đẩy update một chiều. | Thay router WebSocket bằng SSE endpoint. | Code đơn giản hơn, phù hợp use case bảng điểm server-to-client. |

## Chi tiết theo file

### Backend API

#### `apps/api/app/application/use_cases/hackathon/submissions/presign_submit.py`

- Đổi `model_filename` thành optional.
- Nếu có model filename thì mới tạo presigned URL cho model.
- Tạo bản ghi `HackathonSubmissionEntity` ở trạng thái `UPLOADING` ngay trong bước presign.
- Commit bản ghi submission ngay sau khi tạo.

Lỗi cũ được sửa:

- API bắt buộc model weights dù worker không bắt buộc.
- Worker có thể không thấy bản ghi submission nếu job chạy trước khi request transaction commit.

Lợi ích:

- Presign trở thành bước tạo submission thật trong DB.
- `/submit` không cần nhận lại file key/url từ client.
- Hỗ trợ bài nộp không có model weights.

#### `apps/api/app/application/use_cases/hackathon/submissions/submit_task.py`

- Xóa logic tự tạo submission ở `/submit`.
- `/submit` chỉ nhận `submission_id`, sau đó load submission đã tạo ở presign.
- Validate task, hackathon, owner/team và trạng thái đăng ký.
- Kiểm tra idempotent: nếu submission đã queued/running/published thì trả về luôn.
- Lấy quota lock theo participant trước khi count quota.
- Re-read submission sau khi lấy lock để tránh stale read khi submit song song.
- Chuyển trạng thái sang `EXTRACTING`, commit DB, rồi mới enqueue ARQ job chỉ với `submission_id`.
- Nếu enqueue lỗi thì mark submission `FAILED`.

Lỗi cũ được sửa:

- Race condition DB commit vs worker.
- Bypass quota bằng cách gọi trực tiếp `/submit`.
- Submit song song vượt quota.
- Queue payload chứa dữ liệu dư và có thể lệch DB.

Lợi ích:

- Luồng submit an toàn hơn, idempotent hơn.
- Worker luôn dựa vào dữ liệu DB mới nhất.
- Quota được bảo vệ tại điểm cuối thật sự tạo job chấm.

#### `apps/api/app/domain/interfaces/submission_queue.py`

- Rút gọn `enqueue_evaluation` chỉ còn `submission_id`.

Lỗi cũ được sửa:

- Interface queue bắt client/API truyền nhiều dữ liệu chấm bài qua Redis.

Lợi ích:

- Contract queue đơn giản, ít lệch dữ liệu.

#### `apps/api/app/infrastructure/clients/arq_submission_queue.py`

- ARQ job payload chỉ còn `submission_id`.

Lỗi cũ được sửa:

- Redis job chứa `script_s3_key`, `ground_truth_s3_key`, `metric_type`, tạo nguồn dữ liệu thứ hai ngoài DB.

Lợi ích:

- Retry job chỉ cần id, worker tự query DB.

#### `apps/api/app/domain/interfaces/hackathon_repo.py`

- Thêm `acquire_quota_lock`.
- Thêm `commit`.

Lỗi cũ được sửa:

- Repository chưa có cách khóa quota theo participant.
- Use case không có điểm commit chủ động trước enqueue.

Lợi ích:

- Use case submit kiểm soát được transaction boundary đúng lúc.

#### `apps/api/app/infrastructure/repositories/hackathons.py`

- `count_submissions` chỉ tính `EXTRACTING`, `RUNNING`, `EVALUATING`, `PUBLISHED`.
- Thêm advisory lock bằng `pg_advisory_xact_lock`.
- Thêm `commit`.
- Query `get` dùng `populate_existing=True` để re-read sau lock không bị stale trong session.

Lỗi cũ được sửa:

- `FAILED` do lỗi hệ thống vẫn ăn quota.
- Submit song song bypass quota.
- Re-read cùng session có thể trả entity cũ sau khi request khác đã đổi trạng thái.

Lợi ích:

- Quota công bằng hơn.
- Chặn oversubmit do request song song.
- Idempotency của `/submit` đáng tin hơn.

#### `apps/api/app/presentation/schemas/submissions.py`

- `PresignSubmitIn.model_filename` optional.
- `PresignSubmitOut.model` optional.
- `SubmitTaskIn` chỉ còn `submission_id`.

Lỗi cũ được sửa:

- Schema vẫn ép model weights và ép client gửi lại file URL/key khi submit.

Lợi ích:

- API contract khớp mục tiêu: submit chỉ gửi id.

#### `apps/api/app/presentation/api/routers/hackathon_submissions.py`

- Route `/submit` chỉ truyền `submission_id`, `task_id`, `user_id` vào use case.

Lỗi cũ được sửa:

- Router chuyển tiếp `script_s3_key`, `script_url`, `model_s3_key`, `model_url` từ client.

Lợi ích:

- Client không còn quyết định dữ liệu chấm bài sau presign.

#### `apps/api/app/presentation/api/routers/hackathon_realtime.py`

- Xóa WebSocket endpoint `/leaderboard/ws`.
- Thêm SSE endpoint `/leaderboard/events`.
- SSE gửi snapshot leaderboard ban đầu.
- Khi Redis pub/sub nhận event cùng `task_id`, SSE gửi snapshot mới.
- Thêm heartbeat `: keep-alive`.

Lỗi cũ được sửa:

- WebSocket phức tạp hơn nhu cầu thực tế vì bảng điểm chỉ cần server đẩy update một chiều.

Lợi ích:

- Realtime đơn giản hơn.
- Dễ vận hành qua HTTP streaming.
- Client tự nhận update khi server phát event.

### Worker

#### `apps/worker/worker/application/use_cases/evaluate_submission.py`

- `execute` chỉ nhận `submission_id`.
- Worker tự load submission và task từ DB.
- Download script từ `submission.script_url`.
- Download private test và metric từ task trong DB.
- Publish event khi chuyển trạng thái `EXTRACTING`, `RUNNING`, `EVALUATING`.
- Thêm `sweep_stale_submissions`.

Lỗi cũ được sửa:

- Worker phụ thuộc payload Redis thay vì DB.
- Trạng thái trung gian không phát event realtime.
- Submission bị kẹt không có cơ chế tự fail.

Lợi ích:

- Worker retry độc lập hơn.
- Leaderboard/submission list có thể cập nhật realtime theo trạng thái.
- Hạn chế trạng thái treo vô hạn.

#### `apps/worker/worker/domain/interfaces/submission_repository.py`

- Thêm `list_stale_active_submissions`.

Lỗi cũ được sửa:

- Chưa có repository contract để worker tìm submission bị kẹt.

Lợi ích:

- Worker use case có thể sweep stale submissions mà không phụ thuộc chi tiết DB.

#### `apps/worker/worker/infrastructure/adapters/postgres_submission_repository.py`

- Implement `list_stale_active_submissions`.
- Query các submission:
  - `UPLOADING` quá hạn theo `created_at`.
  - `EXTRACTING`, `RUNNING`, `EVALUATING` quá hạn theo `coalesce(updated_at, created_at)`.

Lỗi cũ được sửa:

- Không có cơ chế tìm submission đang chạy quá lâu.

Lợi ích:

- Worker có thể tự dọn submission kẹt.

#### `apps/worker/worker/presentation/arq_tasks.py`

- `evaluate_submission_job` chỉ nhận `submission_id`.
- Khởi tạo `DockerSandbox` với `log_tail_lines=settings.log_max_lines`.
- Thêm cron `sweep_stale_submissions_job` chạy mỗi 5 phút.

Lỗi cũ được sửa:

- ARQ job signature còn nhận payload dư.
- Không có job định kỳ xử lý stuck submissions.
- Sandbox log limit chưa được truyền từ settings.

Lợi ích:

- Job queue gọn hơn.
- Worker tự phục hồi trạng thái kẹt.
- Log handling nhất quán với cấu hình.

#### `apps/worker/worker/infrastructure/adapters/docker_sandbox.py`

- Thêm `log_tail_lines`.
- `container.logs()` chỉ đọc tail stdout/stderr.

Lỗi cũ được sửa:

- Sandbox đọc toàn bộ log vào RAM.

Lợi ích:

- Giảm nguy cơ worker OOM khi thí sinh spam log.

### Frontend

#### `apps/web/features/hackathons/queries.ts`

- `SubmitTaskInput.modelFile` chuyển thành nullable.
- Presign gửi `model_filename` là `null` nếu không có model.
- Chỉ upload model nếu `modelFile` và `presign.model` tồn tại.
- POST `/submit` chỉ gửi `{ submission_id }`.
- Thêm hook `useTaskSubmissionEvents` dùng `EventSource`.
- Khi SSE có update, invalidate submissions query và set cache leaderboard.

Lỗi cũ được sửa:

- Client vẫn gửi toàn bộ file key/url vào `/submit`.
- Client bắt buộc model weights.
- Client phải polling để cập nhật trạng thái submission.

Lợi ích:

- Client contract khớp backend mới.
- Có realtime update bằng SSE.
- Ít request polling hơn.

#### `apps/web/features/hackathons/types.ts`

- `PresignSubmitOutSchema.model` optional/nullable.

Lỗi cũ được sửa:

- Type frontend không cho phép presign response thiếu model.

Lợi ích:

- Hỗ trợ model weights optional đúng schema backend.

#### `apps/web/features/hackathons/components/hackathon-task-submissions.tsx`

- Dùng `useTaskSubmissionEvents`.
- Bỏ `refetchInterval` polling submission active.
- Bỏ check bắt buộc `modelFile`.
- Chỉ đổi tên file progress sang model khi thật sự có model.

Lỗi cũ được sửa:

- UI bắt buộc model weights.
- UI poll liên tục khi submission active.

Lợi ích:

- UI khớp luồng model optional.
- Bảng lịch sử submission cập nhật theo event server.

#### `apps/web/features/hackathons/components/submissions/upload-form.tsx`

- Label model weights đổi thành optional.
- Nút submit chỉ yêu cầu script file.

Lỗi cũ được sửa:

- Form vẫn khóa nút submit nếu không có model.

Lợi ích:

- Thí sinh có thể submit bài chỉ có script.

### Test

#### `apps/api/test/test_submission_use_cases.py`

- Mock queue đổi sang `enqueue_evaluation(submission_id)`.
- Mock submission repository thêm `acquire_quota_lock` và `commit`.
- Test submit chuyển sang mô phỏng bản ghi `UPLOADING` đã tồn tại từ presign.
- Expect trạng thái sau submit là `EXTRACTING`.

Lỗi cũ được sửa:

- Test cũ phản ánh flow `/submit` tạo submission và queue payload nhiều field.

Lợi ích:

- Test contract khớp flow mới.

## Kiểm tra đã chạy

Đã chạy thành công:

```powershell
python -m compileall apps\api\app\application\use_cases\hackathon\submissions apps\api\app\presentation\api\routers\hackathon_realtime.py apps\api\app\presentation\schemas\submissions.py apps\api\app\domain\interfaces\submission_queue.py apps\api\app\domain\interfaces\hackathon_repo.py apps\api\app\infrastructure\clients\arq_submission_queue.py apps\api\app\infrastructure\repositories\hackathons.py apps\worker\worker
python -m compileall apps\api\test\test_submission_use_cases.py
git diff --check
```

Chưa chạy được:

- `pytest apps/api/test/test_submission_use_cases.py`: môi trường Python hiện tại không có `pytest`.
- Frontend lint/typecheck: `node_modules` chưa có local; `next`/`typescript` không khả dụng và npm bị chặn khi cố tải dependency.

## Ghi chú vận hành

- SSE endpoint mới là:

```text
/api/v1/hackathons/tasks/{task_id}/leaderboard/events
```

- ARQ job `evaluate_submission_job` giờ chỉ cần payload:

```json
{
  "submission_id": "..."
}
```

- `/submit` request body mới:

```json
{
  "submission_id": "..."
}
```

