# Lưu trữ đối tượng S3-compatible

Dự án dùng API **S3-compatible** cho dataset hackathon, script dự đoán,
model weights, file dự đoán và ảnh đính kèm. Database chỉ lưu URL hoặc object
reference; nội dung file nằm trong bucket S3.

## Biến môi trường (gợi ý)

| Biến | Mô tả |
| ---- | ----- |
| `S3_ENDPOINT` | Endpoint đầy đủ, gồm scheme và port nếu có, ví dụ `http://localhost:9000` |
| `S3_ACCESS_KEY` | Access key |
| `S3_SECRET_KEY` | Secret key |
| `S3_REGION` | Region dùng để ký request, mặc định `us-east-1` |
| `S3_BUCKET_NAME` | Bucket chứa dataset và artifact |
| `S3_FORCE_PATH_STYLE` | `true` với MinIO và đa số S3-compatible endpoint nội bộ |

Các biến `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`,
`MINIO_BUCKET_NAME` và `MINIO_SECURE` cũ vẫn được hỗ trợ để tương thích ngược.
Khi cả hai bộ cùng tồn tại, `S3_*` được ưu tiên.

Khuyến nghị: dùng access key riêng cho ứng dụng với policy chỉ giới hạn trong
bucket cần thiết, không dùng tài khoản quản trị trong production.

## Ứng dụng Quiz

- Dataset của task được upload qua `POST /api/v1/uploads/presign`.
- Script `predict.py` và model weights được upload bằng presigned PUT do endpoint
  `POST /api/v1/hackathons/tasks/{task_id}/presign-submit` cấp.
- Worker tải các object bằng S3 SDK, chạy chấm bài và upload `predict.csv` trở lại
  cùng thư mục submission.

Object key hiện dùng các prefix:

- Dataset: `hackathons/{hackathon_id}/task-tests/{uuid}/...`
- Script/model: `hackathons/{hackathon_slug}/{sender_slug}/{submission_id}/...`
- Prediction: cùng prefix submission, tên `predict.csv`

## Bảo mật

- **Không** commit file `.env` chứa mật khẩu thật; dùng `.env.example` (placeholder) trong repo.
- Xoay key định kỳ nếu lộ; hạn chế policy bucket theo prefix (`quiz/`).

## Mẫu tên biến (đồng bộ với môi trường dev)

Sao chép nội dung sau vào `.env` (giá trị thật chỉ giữ local) hoặc vào `.env.example` với placeholder:

```env
# S3-compatible storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=us-east-1
S3_BUCKET_NAME=hackathon
S3_FORCE_PATH_STYLE=true
```

Endpoint phải truy cập được từ API, worker và trình duyệt người dùng vì frontend
upload trực tiếp bằng presigned URL. Bucket cần CORS cho phương thức `PUT` từ
origin của web app. Bucket phải được tạo trước khi khởi động luồng upload; ứng
dụng không tự tạo bucket hoặc tự thay đổi policy/CORS trên hạ tầng.
