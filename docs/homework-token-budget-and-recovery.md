# Worker chấm bài: token budget và phục hồi lỗi context

Worker dùng `/props`, `/apply-template`, `/tokenize` của llama.cpp để kiểm tra
toàn bộ chat prompt trước inference. Giới hạn được lấy nhỏ hơn giữa cấu hình và
`n_ctx` của server, trừ ngân sách output và khoảng dự phòng. Endpoint không hỗ trợ
tokenizer thì dừng với lỗi cấu hình; không dùng tỷ lệ ký tự/token để đoán.

Các cấu hình mới (có thể đặt trong `.env` khi deploy):

| Biến | Mặc định | Ý nghĩa |
| --- | ---: | --- |
| `HOMEWORK_LLM_CONTEXT_TOKENS` | 66816 | Giới hạn context tối đa |
| `HOMEWORK_LLM_MAX_OUTPUT_TOKENS` | 4096 | Output JSON tối đa mỗi request |
| `HOMEWORK_LLM_TOKEN_MARGIN` | 512 | Dự phòng cho template/backend |
| `HOMEWORK_LLM_MAX_TOKENIZER_BYTES` | 48000 | Giới hạn payload native API; chia trước khi đo nếu vượt, không coi byte là token |
| `HOMEWORK_LLM_TOKENIZER_URL` | trống | Root native endpoints, suy ra từ URL chat nếu trống |
| `HOMEWORK_GRADING_TIMEOUT_SECONDS` | 900 | Thời hạn một job gồm các lượt đọc và tổng hợp |
| `HOMEWORK_GRADING_MAX_ATTEMPTS` | 3 | Tổng lượt nhận chấm, lưu trong DB kể cả cron tạo job mới |
| `HOMEWORK_GRADING_MAX_CHUNKS` | 32 | Giới hạn số phần đọc; vượt giới hạn thì dừng, không trả điểm từ một phần bài |
| `HOMEWORK_GRADING_CHUNK_CHARS` | 24000 | Kích thước phần ban đầu; tiếp tục chia nếu tokenizer báo vượt budget |
| `HOMEWORK_NOTEBOOK_OUTPUT_MAX_CHARS` | 6000 | Rút gọn stream log nhiều epoch, giữ đầu/cuối và đánh dấu phần đã lược |

Ví dụ root tokenizer cho endpoint trong log:
`HOMEWORK_LLM_TOKENIZER_URL=https://llm2.dutai.site`.
Nên đặt rõ root khi reverse proxy dùng đường dẫn khác `/v1`.

Bài dài được đọc từng phần và ghi bằng chứng cho rubric. Khi cần, bằng chứng
được hợp nhất qua nhiều lượt để prompt cuối vẫn vừa context. Chỉ lượt đánh giá
cuối cùng tính điểm; không cộng điểm của các phần. Source code và file cuối bài
không còn bị cắt ở mốc 200.000 ký tự. Arbitrary notebook output được giữ để đọc
từng phần; chỉ stream log nhận diện nhiều dòng `Epoch` mới được rút gọn.

Không thay đổi UI, public statuses hoặc chính sách ghi điểm khi hệ thống lỗi.
Lỗi context/cấu hình là lỗi không retry. Timeout/kết nối, 429, 5xx và JSON lỗi
được retry có giới hạn. Ba cột mới trên homework và submission giữ attempts,
retry policy, thời điểm bắt đầu. Worker nhận bài bằng UPDATE có điều kiện, tránh
hai worker cùng chấm. Lease tính từ lần nhận chấm và phải hết thời hạn job trước
khi cron có thể phục hồi. Nếu process bị kill ở lượt cuối trước khi lưu lỗi,
không tự đổi trạng thái/điểm; cần kiểm tra và phục hồi có chủ đích.

API và cron dùng job ID cố định `homework-register:<id>` / `homework-evaluate:<id>`.
Worker không giữ result ARQ sau khi hoàn thành, để yêu cầu chấm lại hợp lệ có thể
enqueue cùng ID. Kết quả thật vẫn được lưu trong PostgreSQL.

Request gửi JSON schema của Pydantic tới native server, gồm kiểu dữ liệu và giới
hạn độ dài bằng chứng. Chỉ đặt `json_object` không ràng buộc các giới hạn đó.
Request chấm bài tắt thinking (`reasoning_effort=none`,
`chat_template_kwargs.enable_thinking=false`) để dành ngân sách đầu ra cho JSON.
Tokenizer áp dụng cùng tùy chọn với request inference. Client vẫn từ chối
`finish_reason=length` và kiểm tra JSON; không chấp nhận phản hồi bị cắt làm điểm.
Tham khảo [API chat llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#post-v1chatcompletions-openai-compatible-chat-completions-api).

## Triển khai

Thực hiện trong checkout trên server chạy worker và dùng `.env` của server đó:

1. Dừng worker cũ trước khi đổi schema, tránh nó tiếp tục tạo retry theo policy cũ.
2. Build API và worker từ cùng commit mới.
3. Chạy migration `d76f5b913a02` trước khi khởi động API/worker mới.
4. Khởi động lại API/worker, kiểm tra health và log token budget.
5. Xem trước các bài context lỗi rồi chấm lại một nhóm nhỏ, kiểm tra kết quả.

Ví dụ Docker Compose:

```powershell
docker compose stop worker-evaluate-homework
docker compose build api worker-evaluate-homework
docker compose run --rm --no-deps api uv run alembic upgrade head
docker compose up -d api worker-evaluate-homework
docker compose logs --tail 50 worker-evaluate-homework
```

API/worker dùng model mới nên không được chạy trước migration. Migration chỉ
thêm metadata và tắt auto retry cho các lỗi lịch sử chưa có phân loại; giữ nguyên
mọi trạng thái và điểm hiện có.

## Chấm lại bài lỗi context

Chỉ chạy bằng image worker đã rebuild và sau khi worker mới healthy:

```powershell
docker compose exec -T worker-evaluate-homework uv run python scripts/retry_context_failures.py --limit 5
docker compose exec -T worker-evaluate-homework uv run python scripts/retry_context_failures.py --limit 5 --apply
```

Có thể giới hạn đúng ID bằng `--submission-id <UUID>` (lặp lại option cho nhiều
ID), hoặc đổi cửa sổ thời gian bằng `--days`. Mặc định xem trước, không ghi DB.
Khi `--apply`, chỉ reset metadata retry của các bài có lỗi context và enqueue;
không sửa điểm, trạng thái public hoặc xóa queue. Loại trừ bài đã chấm thành công,
bài đang có lease còn hạn, bài lưu trữ và homework chưa READY. Nếu enqueue bị lỗi
sau commit, metadata vẫn cho phép cron phục hồi bằng cùng job ID.

Không tăng số worker để xử lý backlog trước khi kiểm tra khả năng phục vụ đồng
thời của LLM. Xem `prompt_tokens`, `usage`, `finish_reason` và số job chờ sau mỗi nhóm.

## Kiểm chứng

Test suite gồm HTTP tokenizer giả lập, bài dài có bằng chứng ở cuối, tổng hợp
bằng chứng nhiều lượt, context/JSON/output limit, retry/dedup và cancellation.
Repository/migration tests chỉ kết nối PostgreSQL localhost, tạo và xóa schema
tạm với tên `codex_homework_test_<uuid>`; không chạy trên DB remote. Đặt
`HOMEWORK_TEST_DATABASE_URL` tới PostgreSQL local để chạy các integration tests.

Native API reference:
[llama.cpp server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md).
