# Hướng dẫn upload MinIO/S3 và chạy worker chấm bài Hackathon

Tài liệu này hướng dẫn cách tự upload file đề bài lên MinIO/S3, lấy URL điền vào form và kích hoạt worker chấm bài. Không cần truy cập MinIO Console bằng trình duyệt.

## 1. Xác định terminal đang sử dụng

Nếu dấu nhắc lệnh giống như sau thì bạn đang dùng **Command Prompt (CMD)**:

```text
C:\dut-ai-quiz>
(.worker-venv) C:\dut-ai-quiz>
```

Các hướng dẫn chính trong tài liệu này dành cho CMD. Trong CMD:

- Viết mỗi lệnh trên một dòng.
- Không dùng dấu backtick `` ` `` để xuống dòng.
- Dùng các file có đuôi `.cmd` trong thư mục `scripts`.

Nếu dấu nhắc bắt đầu bằng `PS`, ví dụ `PS C:\dut-ai-quiz>`, bạn đang dùng PowerShell. Xem phần PowerShell ở cuối tài liệu.

## 2. Chuẩn bị môi trường một lần

Mở CMD và đi đến thư mục dự án:

```bat
cd /d C:\dut-ai-quiz
```

Kiểm tra Python của worker:

```bat
if exist .worker-venv\Scripts\python.exe (echo Worker environment OK) else (echo Worker environment NOT FOUND)
```

Nếu hiện `Worker environment OK`, không cần cài lại.

Nếu hiện `Worker environment NOT FOUND`, chạy lần lượt:

```bat
python -m venv .worker-venv
```

```bat
.worker-venv\Scripts\python.exe -m pip install -e apps\api -e apps\worker
```

File `C:\dut-ai-quiz\.env` phải có các biến sau:

```text
MINIO_ENDPOINT
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET_NAME
MINIO_SECURE
```

Không đưa access key hoặc secret key vào source code, ảnh chụp hay tài liệu công khai.

## 3. Upload file lên MinIO/S3 bằng CMD

Cú pháp chung:

```bat
scripts\upload-minio.cmd "ĐƯỜNG_DẪN_FILE" "OBJECT_KEY"
```

Ví dụ upload public test:

```bat
scripts\upload-minio.cmd "docs\hackathon-churn-sample\public_test.csv" "hackathons/churn-demo-2026/public_test.csv"
```

Ví dụ upload private answer:

```bat
scripts\upload-minio.cmd "docs\hackathon-churn-sample\private_answer.csv" "hackathons/churn-demo-2026/private_answer.csv"
```

Không cần kích hoạt `.worker-venv` trước. File `upload-minio.cmd` tự sử dụng đúng Python tại `.worker-venv`.

Khi thành công, terminal hiển thị:

```text
Upload successful
S3 key: s3://lms-dev/hackathons/churn-demo-2026/public_test.csv
URL for the task form: https://minio.dutai.site/lms-dev/hackathons/churn-demo-2026/public_test.csv
```

Sao chép đúng dòng `URL for the task form` để điền vào Public Test URL hoặc Private Test URL.

Nếu mở URL trong trình duyệt và nhận `403 Forbidden`, đó là bình thường vì bucket đang ở chế độ private. Worker tải file bằng tài khoản MinIO trong `.env`.

Mỗi đề nên dùng một thư mục riêng để tránh ghi đè dữ liệu:

```text
hackathons/<ma-de>/public_test.csv
hackathons/<ma-de>/private_answer.csv
```

Ví dụ khi tạo đề khác, thay `churn-demo-2026` bằng tên riêng như `sentiment-demo-2026`.

## 4. Điền URL vào form tạo đề bài

Với bộ đề churn mẫu, điền:

```text
Tên đề bài: Dự đoán khách hàng rời bỏ
Metric: Accuracy
Số lượt nộp tối đa: 10

Public Test URL:
https://minio.dutai.site/lms-dev/hackathons/churn-demo-2026/public_test.csv

Private Test URL:
https://minio.dutai.site/lms-dev/hackathons/churn-demo-2026/private_answer.csv
```

Ý nghĩa các file:

- Public test là dữ liệu đầu vào. Worker đặt file này trong sandbox với tên `hidden_test_input.csv`.
- Private test là đáp án đúng. Worker đặt file này ngoài sandbox với tên `ground_truth.csv`.
- Script của thí sinh phải tạo `predict.csv` trong thư mục đang chạy.
- Với Accuracy, hệ thống so sánh cột đầu tiên của `predict.csv` với cột đầu tiên của `ground_truth.csv`.

## 5. Worker tự động chấm bài

Trước khi bật worker, cần bảo đảm:

- Docker Desktop đang chạy.
- Redis đang chạy.
- PostgreSQL đang chạy.
- Backend API đang chạy tại `http://localhost:8000`.

Có thể kiểm tra container Docker:

```bat
docker ps
```

Worker là một service trong `docker-compose.yml` và có chính sách `restart: unless-stopped`. Khi stack ứng dụng được bật, worker tự chạy, tiếp tục chạy nền và tự khởi động lại cùng Docker Desktop.

Khởi động toàn bộ stack ứng dụng:

```bat
docker compose up -d
```

Chỉ cần chạy lệnh này khi cài đặt hoặc cập nhật stack. Sau đó không cần mở terminal riêng cho worker mỗi lần có hackathon.

Kiểm tra worker:

```bat
docker compose ps worker
```

Xem log worker:

```bat
docker compose logs -f --tail 100 worker
```

Khi thấy dòng tương tự sau, worker đã sẵn sàng:

```text
Starting worker for 2 functions: evaluate_submission_job, cron:sweep_stale_submissions_job
```

Lần chạy đầu tiên có thể lâu hơn vì Docker cần tải image `python:3.12-slim`.

## 6. Quy trình sau khi thí sinh nộp bài

Sau khi nhấn **Nộp bài và Chấm điểm**, không cần chạy thêm lệnh nào:

```text
Frontend upload script lên MinIO
-> API tạo job trong Redis
-> Worker nhận job
-> Worker tải script, public test và private answer
-> Docker chạy predict.py
-> Script tạo predict.csv
-> Worker tính điểm và lưu kết quả
-> Bảng xếp hạng được cập nhật
```

Bài mẫu nhỏ thường hoàn thành trong 10-30 giây. Sau đó tải lại trang để xem điểm và bảng xếp hạng.

## 7. Test bộ đề churn mẫu

Sau khi tạo hackathon và đề bài:

1. Kiểm tra worker đang `Up` bằng `docker compose ps worker`.
2. Tham gia hackathon bằng tài khoản thí sinh.
3. Tại Predict Script, chọn `C:\dut-ai-quiz\docs\hackathon-churn-sample\predict_good.py`.
4. Để trống Model Weight.
5. Nộp bài và chờ khoảng 10-30 giây.
6. `predict_good.py` dự kiến đạt Accuracy `1.0`.
7. Nộp tiếp `predict_bad.py` để kiểm tra kết quả thấp hơn, dự kiến Accuracy `0.5`.

## 8. Kiểm tra khi bài bị treo ở “Đang xử lý”

Kiểm tra worker có chạy không:

```bat
docker compose ps worker
```

Nếu không có tiến trình worker, chạy lại:

```bat
docker compose up -d worker
```

Theo dõi log worker bằng CMD:

```bat
docker compose logs -f --tail 100 worker
```

Nhấn `Ctrl+C` để ngừng theo dõi.

Các dấu hiệu thường gặp:

- Không xuất hiện `Received submission job`: API hoặc Redis chưa đưa job đến worker.
- Có `HTTP Error 403`: URL MinIO hoặc quyền truy cập object có vấn đề.
- Có `predict.csv was not created`: script không tạo file kết quả đúng tên.
- Có `Job completed successfully` và `scored`: bài đã chấm xong.

## 9. Vì sao Execution Logs trên web trống?

`Execution Logs` trên trang nộp bài không phải log hoạt động của worker.

- Thí sinh chỉ được xem log khi bài có trạng thái `FAILED`.
- Nội dung này chỉ chứa `stdout/stderr` của script chạy trong Docker sandbox.
- Khi bài thành công (`PUBLISHED`), hệ thống lưu điểm và xóa log sandbox nên cửa sổ trống là bình thường.
- Nếu lỗi xảy ra trước khi sandbox chạy, ví dụ tải MinIO thất bại, hệ thống có thể có `error_message` nhưng không có `stdout/stderr`.

Muốn xem toàn bộ quá trình chấm bài, dùng `docker compose logs -f --tail 100 worker`.

## 10. Lệnh dành cho PowerShell

Chỉ sử dụng phần này nếu dấu nhắc terminal bắt đầu bằng `PS`.

Upload file bằng một dòng:

```powershell
.\scripts\upload-minio.ps1 -FilePath ".\docs\hackathon-churn-sample\public_test.csv" -ObjectKey "hackathons/churn-demo-2026/public_test.csv"
```

```powershell
.\scripts\upload-minio.ps1 -FilePath ".\docs\hackathon-churn-sample\private_answer.csv" -ObjectKey "hackathons/churn-demo-2026/private_answer.csv"
```

Khởi động stack và worker nền:

```powershell
docker compose up -d
```

Để tránh lỗi khi sao chép lệnh, nên viết mỗi lệnh PowerShell trên một dòng giống ví dụ trên.
