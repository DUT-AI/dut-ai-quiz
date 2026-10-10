# Kiểm thử chấm bài qua web local — 10/10/2026

Đã dùng Chromium/Playwright để chọn ZIP, bấm nộp bài trên giao diện Next.js,
upload qua presigned PUT, gọi API tạo submission, chạy queue ARQ và worker hiện tại.
LLM thật: `ggml-org/gemma-4-e4b-it-GGUF:Q4_0` tại `https://llm2.dutai.site/v1`.

| Bài mẫu tổng hợp | Kết quả | Thời gian quan sát | Xác nhận |
| --- | --- | --- | --- |
| ZIP mã Python nhỏ | 10/10, GRADED | Khoảng 5 giây | JSON hợp lệ, UI đã chấm |
| ZIP chứa 176.052 ký tự mã | 10/10, GRADED | Khoảng 156 giây | Đọc đủ 8 phần; chấm được hàm cuối file |
| Notebook có 928.915 ký tự log Epoch | 10/10, GRADED | Khoảng 10 giây | Rút gọn log, giữ code và kết quả cuối |

Sau sửa payload, cả ba bài nộp thành công đều có `grading_attempts=1`,
`grading_error=NULL`, `grading_started_at=NULL`. UI hiển thị “Đã chấm điểm”,
không còn “Đang chấm điểm”. Playwright không ghi nhận lỗi JavaScript trên trang.

Thử bài lớn trước khi sửa payload đã phát hiện lỗi thứ hai bên cạnh giới hạn
context: request có khoảng 24.341 token đầu vào nhưng server dùng hết 4.096 token
đầu ra và trả `finish_reason=length`; JSON bị cắt. Worker dừng sau 3 lần thử,
không tiếp tục retry vô hạn.

Payload mới gửi JSON schema và tắt thinking trong request chấm. Tokenizer dùng
cùng tùy chọn. Sau sửa, 8 request đọc phần đều kết thúc bằng `stop`, dùng
62–165 token đầu ra; request tổng hợp dùng 1.521 token đầu vào và 133 token đầu ra.
Notebook dùng 4.429 token đầu vào và 105 token đầu ra. ZIP nhỏ dùng 680 token
đầu vào và 104 token đầu ra. Các số token đếm trước khớp `usage.prompt_tokens`.

Kiểm thử worker và API queue: **57 passed**. Ruff và `git diff --check` đạt.
Không sửa code frontend hoặc chính sách điểm khi lỗi.

## Môi trường và giới hạn

API chạy ở `127.0.0.1:8076`, web ở `127.0.0.1:3000`. PostgreSQL local dùng
schema riêng `codex_homework_web_20261010`, Redis local dùng database 14 và queue
`arq:codex-homework-web-test`. S3 local được mô phỏng bằng Moto ở port 9011.
Đăng nhập dùng dev bypass trong process kiểm thử; không sửa `.env` của dự án.

Các bài là dữ liệu tổng hợp, rubric mẫu đã sẵn sàng. Lượt kiểm thử này xác nhận
luồng nộp và chấm bài; không xác nhận deploy, migration hoặc bài lỗi trên production.
Không truy cập server qua SSH. Các dịch vụ local được giữ chạy để xem kết quả.

Kết quả bài lớn:
http://127.0.0.1:3000/lessons/local-grading-test/homework/30303030-3030-4030-8030-303030303030

Script, kết quả JSON, ảnh trước/sau chấm và log nằm trong thư mục
`%TEMP%\codex-homework-web-test`. Log `worker.err.log` giữ các lần thử lỗi ban đầu;
`worker2.err.log` chứa các lần chấm sau sửa payload. Lỗi khóa ngoại trong lượt setup
đầu tiên thuộc fixture schema riêng và đã được sửa trước khi đánh giá LLM.
