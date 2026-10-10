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

## pgvector & 2-Stage Retrieval (Dense + Rerank)

1. **Stage 1 - Dense Retrieval (Vector Search)**:
   - Migration bật extension `vector`, chuyển embeddings sang `vector(1024)` (`BAAI/bge-m3`) và tạo HNSW index với `vector_cosine_ops`.
   - Repository chạy cosine nearest-neighbour ngay trong PostgreSQL (`ORDER BY embedding <=> query`) để lọc ra top candidate nhanh chóng.

2. **Stage 2 - Cross-Encoder Reranking**:
   - Các ứng viên được gửi tới mô hình cross-encoder `BAAI/bge-reranker-v2-m3` để tính điểm tương quan trực tiếp giữa câu hỏi và từng đoạn văn bản (`/rerank`).
   - Kết quả được sắp xếp lại theo reranker score giúp nâng cao độ chính xác đáng kể.

Docker Compose dùng image `pgvector/pgvector:pg16`. Nếu đổi embedding dimensions,
cần tạo migration đổi cả hai cột `lesson_chunks.embedding` và `questions.embedding`;
không chỉ đổi biến môi trường.

## Cấu hình

```env
# Embedding
EMBEDDING_ENABLED=true
EMBEDDING_PROVIDER=dutai
EMBEDDING_API_URL=https://textembedding.dutai.io.vn/embed
EMBEDDING_API_KEY=
EMBEDDING_MODEL=BAAI/bge-m3
EMBEDDING_DIMENSIONS=1024
LESSON_CHUNK_TARGET_TOKENS=250
LESSON_CHUNK_MAX_TOKENS=400
RELATED_LESSON_MIN_SCORE=0.25
RELATED_QUESTION_MIN_SCORE=0.5

# Reranking
RERANK_ENABLED=true
RERANK_PROVIDER=dutai
RERANK_API_URL=https://textembedding.dutai.io.vn/rerank
RERANK_API_KEY=
RERANK_MODEL=BAAI/bge-reranker-v2-m3
```

Provider `dutai` gọi dịch vụ Hugging Face Text Embeddings Inference (TEI) tối ưu cho tiếng Việt:
- **Embedding**: `BAAI/bge-m3` (1024 dimensions, context 8192 tokens)
- **Reranking**: `BAAI/bge-reranker-v2-m3` (Cross-encoder, context 8192 tokens)

## API và worker

- `GET /api/v1/questions/{question_id}/related-lessons?limit=3`: chỉ dành cho câu
  hỏi `PRACTICE`, dùng cached question embedding kết hợp cross-encoder reranking.
- `GET /api/v1/questions/{question_id}/relative-documents?limit=3`: trả về tài liệu markdown
  và các chunk liên quan đã qua rerank.
- `POST /api/v1/questions/related`: nhận nội dung câu hỏi, tạo embedding bằng
  provider hiện tại, query các question embedding đã cache và rerank kết quả.
  Response không chứa đáp án đúng hoặc lời giải. User thường chỉ được tìm trong
  pool `PRACTICE`; admin/mentor có thể truyền `pool_type`.
- `POST /api/v1/lessons/{lesson_id}/embeddings/reindex`: enqueue job và trả
  `{"lesson_id": "...", "status": "queued"}`.

Ví dụ:

```http
POST /api/v1/questions/related
Content-Type: application/json

{
  "content": "Batch normalization có tác dụng gì?",
  "limit": 10,
  "min_score": 0.5,
  "pool_type": "PRACTICE"
}
```

Sau khi cập nhật code:

```bash
cd apps/api
uv run alembic upgrade head
```

API và worker phải cùng trỏ vào Redis/PostgreSQL. Với Docker Compose, worker đã phụ
thuộc healthcheck của cả hai service.
