# Frontend Quiz (reference) — nối dut-ai-quiz API

Giao diện Next.js mẫu trong monorepo `dut-ai-quiz`: danh sách đề đã xuất bản, làm bài (shuffle phía server), PATCH đáp án, nộp bài, tab-out (`visibility_hidden`), hiển thị điểm thang 10.

## Cấu hình

1. API FastAPI chạy (ví dụ `http://localhost:8000`), CORS có `http://localhost:3000`.
2. Copy env:

   ```bash
   cp .env.local.example .env.local
   ```

3. **Auth dev**: để làm bài với `AUTH_DEV_BYPASS=true`, role phải là **student** (`leader` hoặc `teammate`). `admin` trong bypass được map thành **teacher** — không gọi được `POST .../attempts`. Trong `.env` API:

   ```env
   AUTH_DEV_BYPASS=true
   AUTH_DEV_ROLE_NAME=leader
   ```

4. Cần có đề **đã xuất bản** và đã gán câu hỏi trong DB.

## Chạy

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Request dùng `credentials: "include"` để gửi cookie (khi không bypass).

## Dữ liệu tĩnh

`public/data.json` không còn được dùng cho luồng chính; có thể giữ làm tham khảo.

## Next.js

Dự án dùng [Next.js](https://nextjs.org/) (App Router). Chỉnh trang tại `app/(root)/page.tsx`.
