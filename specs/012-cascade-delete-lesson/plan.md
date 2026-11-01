# Implementation Plan: Lesson Deletion & Question Relocation

## 1. Kiến trúc & Công nghệ (Architecture)
- **Backend**: FastAPI, SQLAlchemy Async, Alembic.
- **Frontend**: Next.js, React Hook Form / React state, Tailwind CSS, TanStack Query.
- **Branch/Feature Dir**: `specs/012-cascade-delete-lesson`

---

## 2. Kế hoạch triển khai chi tiết (Phases)

### Giai đoạn 1: Database Migration (Alembic)
1. Tạo migration `update_questions_lesson_id_fk_on_delete.py`:
   - Đổi ràng buộc `questions_lesson_id_fkey` từ `ON DELETE CASCADE` thành `ON DELETE SET NULL`.
   - Giúp bảo vệ dữ liệu ở tầng DB: nếu bài học bị xóa, `questions.lesson_id` tự động chuyển thành `NULL` thay vì xóa các câu hỏi đang dùng trong `exam_questions`.
2. Cập nhật model `Question` trong `apps/api/app/infrastructure/persistence/models/question.py`:
   - `ForeignKey("lessons.id", ondelete="SET NULL")`.

### Giai đoạn 2: Backend API & Use Case
1. **Schema request**:
   - `apps/api/app/presentation/schemas/lessons.py`:
     ```python
     class LessonDeleteAction(str, Enum):
         REASSIGN = "reassign"
         UNASSIGN = "unassign"
         DELETE = "delete"

     class LessonDeleteQuery:
         action: LessonDeleteAction = LessonDeleteAction.UNASSIGN
         reassign_to_lesson_id: UUID | None = None
     ```
2. **Use Case `DeleteLessonUseCase`**:
   - Nhận `lesson_id`, `action`, `reassign_to_lesson_id`.
   - Nếu `action == "reassign"` và `reassign_to_lesson_id`:
     - Cập nhật toàn bộ câu hỏi của bài học sang `reassign_to_lesson_id`.
   - Nếu `action == "unassign"`:
     - Gỡ liên kết toàn bộ câu hỏi của bài học (`lesson_id = None`).
   - Nếu `action == "delete"`:
     - Thử xóa câu hỏi; nếu câu hỏi đang nằm trong đề thi (`exam_questions`), ném `HTTPException(400, "Không thể xóa các câu hỏi đã được sử dụng trong đề thi. Vui lòng chọn gỡ liên kết hoặc chuyển bài học.")`.
   - Xóa bài học `lessons` và các phụ thuộc trực tiếp (`Comment`, `LessonChunk`, `LessonVideo`, `Homework`).
3. **Router**:
   - Cập nhật `DELETE /api/v1/lessons/{lesson_id}` nhận query parameters `action` và `reassign_to_lesson_id`.

### Giai đoạn 3: Frontend UI (`DeleteLessonModal`)
1. **Tạo component `DeleteLessonModal`** tại `apps/web/features/lessons/components/delete-lesson-modal.tsx`:
   - Hiển thị tiêu đề: **Xác nhận xóa bài học "[Tên bài học]"**.
   - Thống kê: *"Bài học này hiện có [N] câu hỏi trong hệ thống"*.
   - Nhóm Radio Options với nội dung nghiệp vụ thân thiện:
     - `(•) Chuyển toàn bộ câu hỏi sang bài học khác`: Dropdown chọn bài học đích (loại trừ bài học đang xóa).
     - `( ) Gỡ liên kết (Lưu vào danh sách câu hỏi chưa phân loại)`: *"Toàn bộ câu hỏi vẫn được bảo lưu an toàn trong hệ thống và các đề thi đã tạo."*
     - `( ) Xóa luôn tất cả câu hỏi thuộc bài học này`: *"Lưu ý: Chỉ thực hiện được nếu các câu hỏi chưa được sử dụng trong bất kỳ đề thi nào."*
2. **Cập nhật mutation `useDeleteLesson`**:
   - Chấp nhận `{ id: string; action?: string; reassign_to_lesson_id?: string }`.
3. **Tích hợp vào `apps/web/app/(root)/teacher/lessons/page.tsx`**:
   - Thay thế `ConfirmModal` cũ bằng `DeleteLessonModal`.

### Giai đoạn 4: Kiểm thử & Đảm bảo chất lượng
1. Viết test case trong `apps/api/test/test_delete_lesson.py`:
   - Test xóa lesson với `action="reassign"`.
   - Test xóa lesson với `action="unassign"`.
   - Test xóa lesson khi có câu hỏi trong `exam_questions`.
2. Chạy `make check` xác nhận toàn bộ checks PASS.
