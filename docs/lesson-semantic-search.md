# Nội dung bài học và semantic search

## Luồng dữ liệu

Markdown của bài học được lưu tại `lessons.content_md`. API đọc trực tiếp database
của quiz và không gọi `blog-dut-ai`.

Khi tạo bài học hoặc thay đổi `name`, `description`, `content_md`, API chỉ enqueue
job `index_lesson_job` vào ARQ/Redis. Worker lấy phiên bản mới nhất của lesson, tạo
chunks, gọi embedding provider và thay toàn bộ index của lesson trong một transaction.
Do đó request lưu bài học không phải chờ embedding.

`source_hash` là SHA-256 của `name + description + content_md`. Nó là version của
nguồn dữ liệu dùng để tạo embedding. Trong khoảng thời gian worker chưa xử lý xong
một bản sửa mới, API bỏ qua chunks có hash cũ để không trả kết quả stale.

Question embedding được tính khi tạo/cập nhật `content` hoặc `options`, rồi lưu tại
`questions.embedding`. Endpoint related-lessons sử dụng vector đã lưu và không gọi
embedding provider trong read request. Dữ liệu cũ cần được save lại một lần để có
question embedding.

## Hierarchical Markdown chunking

`markdown-it-py` parse tài liệu thành token stream có source map. Chunker thực hiện:

1. Heading-aware split: H1/H2/H3 tạo section riêng, không trộn nội dung giữa hai
   heading.
2. Block-aware split: chỉ ghép nguyên paragraph, list, blockquote, code, formula,
   table và image trong cùng section.
3. Semantic split: mục tiêu 180 tokens, tối đa 220 tokens tính cả breadcrumb và
   context enrichment. Giới hạn này chừa headroom cho tokenizer của Vietnamese SBERT,
   vốn có `max_seq_length=256`. Một paragraph đơn lẻ quá dài chỉ được tách ở sentence
   boundary; formula/table/code không bị cắt.
4. Context enrichment: prepend breadcrumb `[H1] ...`, `[H2] ...` và `[SECTION] ...`
   vào text dùng để embedding.

Markdown gốc vẫn được giữ trong `lesson_chunks.content`. Text đã enrich được lưu ở
`contextual_content` để debug/re-index. Metadata gồm `document`, `lesson_name`,
`chunk_id`, `heading_path`, `h1`, `h2`, `h3`.

- LaTeX: giữ nguyên bản gốc và bổ sung bản readable, ví dụ
  `N = \frac{H \cdot W}{P^2}` thành `N = (H * W) / P²`.
- Table: giữ Markdown table và thêm từng row dưới dạng `Column=value`.
- Image: giữ Markdown image và thêm `source` + `caption` nếu có.

## pgvector

Migration bật extension `vector`, chuyển lesson embeddings sang `vector(768)` và
tạo HNSW index với `vector_cosine_ops`. Repository chạy cosine nearest-neighbour ngay
trong PostgreSQL (`ORDER BY embedding <=> query`) thay vì tải toàn bộ vectors về API.

Docker Compose dùng image `pgvector/pgvector:pg16`. Nếu đổi embedding dimensions,
cần tạo migration đổi cả hai cột `lesson_chunks.embedding` và `questions.embedding`;
không chỉ đổi biến môi trường.

## Cấu hình

```env
EMBEDDING_ENABLED=true
EMBEDDING_PROVIDER=dutai
EMBEDDING_API_URL=https://embedding.dutai.site/v1/embeddings
EMBEDDING_API_KEY=
EMBEDDING_MODEL=keepitreal/vietnamese-sbert
EMBEDDING_DIMENSIONS=768
LESSON_CHUNK_TARGET_TOKENS=180
LESSON_CHUNK_MAX_TOKENS=220
RELATED_LESSON_MIN_SCORE=0.25
```

Provider `dutai` gọi service Sentence Transformers của câu lạc bộ và mặc định dùng
Vietnamese SBERT 768 chiều. Provider `local` vẫn có thể dùng khi phát triển offline;
nếu đổi model thì phải migrate vector dimension, re-index lessons và save lại questions.

## API và worker

- `GET /api/v1/questions/{question_id}/related-lessons?limit=3`: chỉ dành cho câu
  hỏi `PRACTICE`, dùng cached question embedding.
- `POST /api/v1/lessons/{lesson_id}/embeddings/reindex`: enqueue job và trả
  `{"lesson_id": "...", "status": "queued"}`.

Sau khi cập nhật code:

```bash
cd apps/api
uv run alembic upgrade head
```

API và worker phải cùng trỏ vào Redis/PostgreSQL. Với Docker Compose, worker đã phụ
thuộc healthcheck của cả hai service.
