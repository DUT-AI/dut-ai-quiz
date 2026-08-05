# Hackathon Background Worker Implementation Summary

File này tóm tắt các thay đổi đã code cho hệ thống AI Hackathon theo design backend chấm điểm tự động.

## Phạm vi đã làm

- Tập trung chính vào `apps/worker`.
- Có chỉnh `apps/api` sau khi được duyệt để thêm realtime WebSocket leaderboard.
- Không chỉnh `apps/web`.
- Có chỉnh `docker-compose.yml` để Docker sandbox chạy đúng khi worker dùng Docker socket.

## Worker Pipeline

File chính:

- `apps/worker/worker_hackathon/application/use_cases/evaluate_submission.py`
- `apps/worker/worker_hackathon/presentation/arq_tasks.py`

Worker hiện xử lý job `evaluate_submission_job` theo luồng:

1. Nhận job từ Redis/ARQ với `submission_id`, `script_s3_key`, `ground_truth_s3_key`, `metric_type`.
2. Load submission từ PostgreSQL.
3. Chuyển status lần lượt:
   - `EXTRACTING`
   - `RUNNING`
   - `EVALUATING`
   - `PUBLISHED`, `FAILED`, hoặc `CANCELLED`
4. Tải artifact từ MinIO/S3:
   - `predict.py`
   - model file nếu submission có `model_url`
   - hidden input từ `task.public_test_url`
   - ground truth từ `ground_truth_s3_key`
5. Ground truth được lưu trong thư mục private của worker, không mount vào Docker sandbox.
6. Docker sandbox chỉ nhận thư mục có script/model/hidden input và sinh `predict.csv`.
7. Worker chấm `predict.csv` với ground truth bên ngoài sandbox.
8. Upload lại `predict.csv` vào MinIO/S3 cùng folder submission.
9. Cập nhật PostgreSQL với score/status/logs.
10. Publish Redis event qua channel `hackathon:submission-events`.

## Clean Architecture Worker Adapters

Đã thêm các interface domain:

- `apps/worker/worker_hackathon/domain/interfaces/artifact_store.py`
- `apps/worker/worker_hackathon/domain/interfaces/cancellation.py`
- `apps/worker/worker_hackathon/domain/interfaces/event_publisher.py`
- `apps/worker/worker_hackathon/domain/interfaces/submission_repository.py`

Đã thêm các adapter infrastructure:

- `apps/worker/worker_hackathon/infrastructure/adapters/minio_artifact_store.py`
- `apps/worker/worker_hackathon/infrastructure/adapters/postgres_submission_repository.py`
- `apps/worker/worker_hackathon/infrastructure/adapters/redis_cancellation.py`
- `apps/worker/worker_hackathon/infrastructure/adapters/redis_event_publisher.py`

Mục tiêu là giữ application use case không phụ thuộc trực tiếp vào boto3, SQLAlchemy, Redis concrete logic.

## Docker Sandbox

File chính:

- `apps/worker/worker_hackathon/infrastructure/adapters/docker_sandbox.py`

Đã nâng sandbox để hỗ trợ:

- `network_mode="none"` để chặn internet.
- `mem_limit` theo config.
- `nano_cpus` theo config.
- Timeout.
- Poll Redis cancel key qua callback.
- Kill container khi cancel/timeout.
- Label/name container theo `submission_id`.
- Cleanup stale/running container.
- Capture logs để worker trim và lưu khi failed.

## Docker Compose Runtime Fix

File:

- `docker-compose.yml`

Đã thêm:

- `WORKER_SANDBOX_ROOT=${WORKER_SANDBOX_ROOT:-/tmp/dut-ai-worker}`
- Bind mount `${WORKER_SANDBOX_ROOT}:${WORKER_SANDBOX_ROOT}`

Lý do: worker container dùng Docker socket để tạo sandbox container. Nếu temp file chỉ nằm trong filesystem nội bộ của worker container, Docker daemon phía host không thấy path đó. Shared sandbox root giúp worker và sandbox container cùng nhìn thấy file `predict.py`, model và hidden input.

## Realtime WebSocket Leaderboard

Đã chỉnh API sau khi được duyệt.

Files chính:

- `apps/api/app/presentation/api/routers/hackathon_realtime.py`
- `apps/api/app/application/use_cases/hackathon/submissions/get_submission_leaderboard.py`
- `apps/api/app/application/use_cases/hackathon/submissions/__init__.py`
- `apps/api/app/infrastructure/di/use_cases.py`
- `apps/api/app/main.py`

Endpoint mới:

```text
WS /api/v1/hackathons/tasks/{task_id}/leaderboard/ws
```

Cách hoạt động:

1. WebSocket xác thực bằng cookie `access_token`.
2. Có hỗ trợ query param `access_token` cho client không gửi cookie được.
3. API subscribe Redis channel `hackathon:submission-events`.
4. Chỉ xử lý event có `task_id` trùng WebSocket path.
5. Mỗi event sẽ query lại leaderboard snapshot mới nhất từ PostgreSQL.
6. API gửi JSON:

```json
{
  "type": "hackathon.leaderboard.updated",
  "task_id": "...",
  "event": {},
  "leaderboard": []
}
```

Leaderboard rule:

- Mỗi user/team lấy best submission.
- Điểm thấp hơn tốt hơn: `log_loss`, `mae`, `mse`, `rmse`, `mape`.
- Điểm cao hơn tốt hơn: `accuracy`, `balanced_accuracy`, `precision`,
  `recall`, `f1_score`, `f1_macro`, `f1_weighted`, `roc_auc`, `r2`.

## CSV Evaluator GPU-First

File:

- `apps/worker/worker_hackathon/infrastructure/adapters/csv_evaluator.py`

Đã thay logic chấm điểm từ vòng lặp CPU thuần sang GPU-first:

- Ưu tiên dùng CuPy nếu runtime có CUDA/GPU.
- Hỗ trợ GPU cho:
  - `accuracy`
  - `f1` / `f1_score`
  - `mae`, `mse`, `rmse`, `r2`, `mape`
- CPU fallback hỗ trợ toàn bộ metric, gồm cả classification nhiều lớp và
  probability metric (`roc_auc`, `log_loss`).
- Nếu không có CuPy/CUDA thì fallback CPU để dev/local không bị crash.
- Có thể ép bắt buộc GPU bằng env:

```env
CSV_EVALUATOR_REQUIRE_GPU=true
```

Lưu ý:

- GPU path hiện tối ưu cho numeric labels/scores.
- Nếu label dạng string và muốn GPU hoàn toàn, nên bổ sung cuDF hoặc chuẩn hóa task output thành numeric label.
- Repo hiện chưa thêm dependency `cupy` hoặc `cupy-cuda*` vào `pyproject.toml`/`uv.lock`, nên deployment muốn dùng GPU thật cần worker image có CUDA + CuPy.

## Verification Đã Chạy

Đã chạy:

```powershell
python -m compileall apps\api\app apps\worker
git diff --check
docker compose config
```

Kết quả:

- `compileall` OK.
- `git diff --check` OK, chỉ có warning CRLF trên Windows.
- `docker compose config` parse OK, có warning quyền đọc Docker config local nhưng không fail.

Chưa chạy được:

- `pytest`
- `ruff`
- `uv run ...`

Lý do: môi trường PowerShell hiện tại không có `uv`, `pytest`, `ruff`, và thiếu runtime dependency như `arq`, `loguru`.

## Điểm Còn Cần Duyệt Nếu Làm Tiếp

Các điểm này chưa tự ý sửa thêm:

1. Quota chính xác theo design:
   - Hiện API đang đếm mọi submission khác `CANCELLED`.
   - Design yêu cầu system error không trừ quota.
   - Nếu làm đúng tuyệt đối cần sửa API repository/use case hoặc thêm field phân loại lỗi.

2. Dataset contract rõ hơn:
   - Hiện đang dùng `public_test_url` làm hidden input.
   - Hiện đang dùng `private_test_url` làm ground truth.
   - Nếu muốn rõ ràng hơn nên đổi API model/schema thành `hidden_input_url` và `ground_truth_url`.

3. GPU production image:
   - Nếu bắt buộc chấm GPU thật, cần cập nhật worker Docker image/dependency sang CUDA + CuPy.
   - Việc này có thể làm image nặng hơn và cần lock dependency lại.
