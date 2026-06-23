# Hướng dẫn Kiểm tra và Xác thực Dữ liệu API tại Runtime bằng Zod

Tài liệu này hướng dẫn cách khai báo, cấu trúc và sử dụng Zod Schemas để tự động kiểm tra tính toàn vẹn của dữ liệu trả về từ API (Runtime Validation) trong dự án `apps/web`.

---

## 📐 Kiến trúc Xác thực API Tập trung

Hệ thống sử dụng cơ chế **Centralized Validation Wrapper** tích hợp trực tiếp vào API Client ([apps/web/lib/api.ts](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/web/lib/api.ts)). Cơ chế này hỗ trợ tham số `schema` tùy chọn (optional) cho các hàm gọi API phổ biến:

* `apiGet<T>(path, schema?, init?)`
* `apiPost<T>(path, body, schema?)`
* `apiPatch<T>(path, body, schema?)`
* `apiClient.post<T>(path, body, schema?, options?)`
* `apiClient.put<T>(path, body, schema?, options?)`
* `apiClient.delete<T>(path, schema?)`

Để tối ưu hóa tính an toàn kiểu dữ liệu (type safety), hệ thống **hoàn toàn không sử dụng** kiểu `any` hoặc `unknown` trong chữ ký hàm công khai của API Client, thay vào đó sử dụng các kiểu dữ liệu an toàn sau:
* **`ApiBody`**: `object | string | number | boolean | null | undefined`. Đại diện cho mọi request payload (như JSON object, FormData, Blob, primitive types...) mà không cần ép kiểu.
* **`ApiClientOptions`**: Kế thừa từ `RequestInit` và bổ sung các thuộc tính cấu hình tùy chỉnh như `withCredentials?: boolean` và `baseURL?: string`.
* **`z.ZodType<T>`**: Ràng buộc trực tiếp kiểu Zod Schema tương thích hoàn toàn với kiểu generic `T` trả về.

### 🔄 Cơ chế hoạt động:
1. **Không truyền `schema`**: API Client hoạt động như cũ, trả về dữ liệu thô và ép kiểu (cast) tĩnh bằng TypeScript. Đảm bảo **tương thích ngược 100%**.
2. **Có truyền `schema`**: API Client sẽ tự động chạy `.safeParse(data)` tại runtime:
   * **Thành công**: Trả về dữ liệu sạch đã được validate.
   * **Thất bại**: Ghi log chi tiết lỗi định dạng vào Console dưới dạng `[API Validation Error] Path: <path>` và ném ra ngoại lệ (throw Error) để các Query/Mutation hooks của TanStack Query có thể bắt và xử lý.

---

## 📂 Quy chuẩn Cấu trúc Thư mục (Feature-based)

Các Types và API Queries được phân chia theo từng domain chức năng nằm trong thư mục `apps/web/features/`:

```
apps/web/features/
├── auth/
│   ├── types.ts          # Zod Schemas & Types liên quan đến Auth (UserMe,...)
│   └── queries.ts        # TanStack Queries cho Auth
├── lessons/
│   ├── types.ts          # Zod Schemas & Types cho Lessons
│   └── queries.ts        # TanStack Queries cho Lessons
├── exams/
│   ├── types.ts          # Zod Schemas & Types cho Exams
│   └── queries.ts        # TanStack Queries cho Exams
├── questions/
│   ├── types.ts          # Zod Schemas & Types cho Questions
│   └── queries.ts        # TanStack Queries cho Questions
└── attempts/
    ├── types.ts          # Zod Schemas & Types cho Attempts (Lượt làm bài)
    └── queries.ts        # TanStack Queries cho Attempts
```

---

## 🛠️ Quy trình Triển khai cho Tính năng Mới

Khi phát triển một tính năng mới hoặc cập nhật một endpoint API, hãy tuân thủ 3 bước sau:

### Bước 1: Khai báo Zod Schema & TypeScript Type
Trong file `features/{domain}/types.ts`, định nghĩa Zod Schema và sử dụng `z.infer` để tự động tạo ra kiểu dữ liệu tĩnh cho TypeScript.

> [!TIP]
> Tránh định nghĩa thủ công cả TypeScript interface và Zod Schema để ngăn ngừa sự không đồng bộ giữa kiểu dữ liệu tĩnh và kiểm tra runtime. Hãy luôn dùng `z.infer` để tự sinh kiểu từ Zod.

```typescript
// apps/web/features/example/types.ts
import { z } from "zod";

// 1. Định nghĩa Zod Schema đại diện cho dữ liệu trả về từ API
export const ExampleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  view_count: z.number().default(0),
  created_at: z.string(),
});

// 2. Tự động suy luận ra TypeScript Type từ Schema
export type ExampleItem = z.infer<typeof ExampleItemSchema>;
```

### Bước 2: Tích hợp Schema vào Queries/Mutations Hook
Trong file `features/{domain}/queries.ts`, import Schema và Type rồi truyền Schema vào tham số tương ứng của API Client.

#### 1. Sử dụng với các hàm API Client dạng helper (`apiGet`, `apiPost`, `apiPatch`)

```typescript
// apps/web/features/example/queries.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { ExampleItemSchema, type ExampleItem } from "./types";
import { z } from "zod";

// GET danh sách items (Mảng đối tượng - dùng z.array)
export function useExampleItems() {
  return useQuery<ExampleItem[]>({
    queryKey: ["example-items"],
    queryFn: () => apiGet<ExampleItem[]>("/api/v1/examples", z.array(ExampleItemSchema)),
  });
}

// POST tạo mới item (Đối tượng đơn lẻ)
export function useCreateExampleItem() {
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      apiPost<ExampleItem>("/api/v1/examples", body, ExampleItemSchema),
  });
}
```

#### 2. Sử dụng với `apiClient` (`post`, `put`, `delete`)
`apiClient.post` và `apiClient.put` hỗ trợ chữ ký hàm linh hoạt. Bạn có thể truyền `schema` làm tham số thứ 3, hoặc truyền `options` (chứa headers, config...) làm tham số thứ 3/4. API client sẽ tự động phân tích và xử lý chính xác tại runtime.

```typescript
// POST với Header tùy chọn (ví dụ: upload file, multipart/form-data)
export function useUploadDocument() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<ExampleItem>(
        "/api/v1/examples/upload", 
        formData, 
        ExampleItemSchema, // Schema validation (Vị trí thứ 3)
        { headers: {} }    // RequestInit options (Vị trí thứ 4)
      ).then(r => r.data),
  });
}

// DELETE tài nguyên và validate phản hồi
export function useDeleteExampleItem() {
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/examples/${id}`, z.object({ success: z.boolean() }))
        .then(r => r.data),
  });
}
```

### Bước 3: Đăng ký Barrel Export
Đảm bảo xuất lại các module vừa viết tại các file trung tâm để các component khác trong dự án có thể import một cách dễ dàng và đồng bộ:
* Thêm export vào [apps/web/lib/types.ts](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/web/lib/types.ts):
  ```typescript
  export * from "../features/example/types";
  ```
* Thêm export vào [apps/web/lib/queries.ts](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/web/lib/queries.ts):
  ```typescript
  export * from "../features/example/queries";
  ```

---

## 🔬 Debug lỗi sai lệch dữ liệu (Schema Validation Failure)

Khi Backend thay đổi cấu trúc dữ liệu hoặc trả về trường thiếu/sai kiểu, frontend sẽ lập tức báo lỗi tại Console.

### Cách đọc lỗi log:
Tại Console tab của Developer Tools, bạn sẽ thấy thông báo:
```
[API Validation Error] Path: /api/v1/me
{
  "fullname": {
    "_errors": ["Required"]
  }
}
```
Lỗi trên chỉ ra rằng API `/api/v1/me` bị thiếu trường `fullname` (Backend không trả về hoặc trả về `undefined`), trong khi Zod Schema khai báo nó là bắt buộc (`z.string()`).

### Cách khắc phục:
1. Nếu trường đó là tùy chọn (có thể null hoặc không có): Cập nhật Zod Schema thành `z.string().nullable().optional()`.
2. Nếu trường đó là bắt buộc: Yêu cầu Backend sửa đổi định dạng JSON phản hồi đúng chuẩn cam kết API.
