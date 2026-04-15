# Lưu trữ đối tượng (MinIO / S3-compatible)

Dự án dùng **MinIO** (API tương thích S3) cho ảnh đính kèm câu hỏi; database chỉ lưu **URL** công khai hoặc path trong bucket.

## Biến môi trường (gợi ý)

| Biến | Mô tả |
| ---- | ----- |
| `MINIO_ENDPOINT` | Host API (không gồm scheme), ví dụ `minio.dutai.site` |
| `MINIO_SECURE` | `True` nếu client dùng **HTTPS** (`https://...`) |
| `MINIO_ACCESS_KEY` | Access key (S3 API) |
| `MINIO_SECRET_KEY` | Secret key |
| `MINIO_BUCKET_NAME` | Tên bucket chứa object (ảnh quiz, v.v.) |
| `MINIO_CONSOLE_PORT` | Cổng **console** MinIO (vận hành), không nhất thiết dùng trong app |

**Gốc tài khoản server MinIO** (tạo bucket, vận hành) — thường chỉ dùng khi bootstrap, không nhúng trực tiếp vào code path upload của app nếu đã dùng access key riêng:

| Biến | Mô tả |
| ---- | ----- |
| `MINIO_ROOT_USER` | User root của MinIO |
| `MINIO_ROOT_PASSWORD` | Mật khẩu root |

Khuyến nghị: dùng **access key / secret** riêng cho ứng dụng (policy chỉ bucket cần thiết), không dùng root trong app production.

## Ứng dụng Quiz

- Endpoint upload: `POST /api/v1/uploads/presign` (xem [api.md](api.md)) — backend ký URL (presigned PUT) hoặc upload server-side tùy triển khai.
- URL lưu trong `questions` / metadata: chuỗi đầy đủ hoặc base URL + key — thống nhất một quy ước khi code.

## Bảo mật

- **Không** commit file `.env` chứa mật khẩu thật; dùng `.env.example` (placeholder) trong repo.
- Xoay key định kỳ nếu lộ; hạn chế policy bucket theo prefix (`quiz/`).

## Mẫu tên biến (đồng bộ với môi trường dev)

Sao chép nội dung sau vào `.env` (giá trị thật chỉ giữ local) hoặc vào `.env.example` với placeholder:

```env
# MinIO Storage
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
MINIO_ENDPOINT=minio.dutai.site
MINIO_CONSOLE_PORT=10001
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET_NAME=dut-ai-manager-dev
MINIO_SECURE=True
```

`MINIO_SECURE=True` → client SDK dùng **HTTPS** tới `MINIO_ENDPOINT`.
