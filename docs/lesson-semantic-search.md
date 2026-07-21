# Nội dung bài học và semantic search

## Luồng dữ liệu

Nội dung Markdown của bài học được lưu trực tiếp ở `lessons.content_md`. API
`GET /api/v1/lessons/by-slug/{slug}` chỉ đọc database của quiz và không còn gọi
`blog-dut-ai`.

Khi tạo hoặc sửa `content_md`, API chia nội dung theo đoạn với overlap, gọi một
OpenAI-compatible embeddings endpoint, rồi thay toàn bộ các hàng tương ứng trong
`lesson_chunks`. Mỗi chunk giữ `source_hash`; kết quả có hash cũ sẽ bị bỏ qua nếu
nội dung bài học đã thay đổi nhưng provider chưa re-index thành công.

`ILessonChunkRepository` và `IEmbeddingService` là hai interface dùng chung. Worker
có thể dùng lại application service `LessonEmbeddingIndexer` khi chuyển việc
re-index sang background job sau này.

## Cấu hình

Embedding được lưu dưới dạng PostgreSQL `double precision[]`, vì vậy database
không cần cài extension riêng. Repository hiện tính cosine similarity trong
application; khi dữ liệu lớn hơn có thể thay adapter bằng pgvector mà không đổi
use case hoặc API.

```env
EMBEDDING_ENABLED=true
EMBEDDING_PROVIDER=local
EMBEDDING_API_URL=https://api.openai.com/v1/embeddings
EMBEDDING_API_KEY=...
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
RELATED_LESSON_MIN_SCORE=0.25
```

`EMBEDDING_DIMENSIONS` phải khớp với số chiều provider trả về. PostgreSQL array
không khóa cứng số chiều, nhưng service sẽ từ chối vector sai kích thước.

Provider `local` không cần API key và dùng word/bigram/character hashing để tạo
vector ổn định, phù hợp chạy development ngay lập tức. Khi cần semantic quality
cao hơn, đổi `EMBEDDING_PROVIDER=openai_compatible`, cấu hình endpoint/key rồi
re-index các bài học.

## API

- `GET /api/v1/questions/{question_id}/related-lessons?limit=3`: chỉ áp dụng cho
  câu hỏi `PRACTICE`; trả các lesson tốt nhất sau khi gom nhiều chunk theo lesson.
- `POST /api/v1/lessons/{lesson_id}/embeddings/reindex`: admin/mentor chủ động
  re-index một bài học.

Sau khi cập nhật code, chạy migration:

```bash
cd apps/api
uv run alembic upgrade head
```

Các bài học được sửa hoặc tạo sau khi bật embedding sẽ tự re-index. Với dữ liệu
cũ, gọi endpoint re-index cho từng lesson sau khi đã nhập `content_md`.
