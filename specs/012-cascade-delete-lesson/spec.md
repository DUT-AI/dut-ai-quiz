# Feature Specification: Lesson Deletion & Question Relocation (Quản lý câu hỏi khi xóa bài học)

## 1. Bối cảnh & Vấn đề (Context & Problem Statement)
Hiện tại, khi giáo viên xóa một bài học (`DELETE /api/v1/lessons/{lesson_id}`), PostgreSQL gặp lỗi ngoại lệ khóa ngoại:
```
ForeignKeyViolationError: update or delete on table "questions" violates foreign key constraint "exam_questions_question_id_fkey" on table "exam_questions"
```
Nguyên nhân là do các câu hỏi thuộc bài học này đang được dùng trong các đề thi (`exam_questions`). Nếu xóa bài học dẫn đến xóa câu hỏi, đề thi sẽ bị mất câu hỏi. Hơn nữa, việc tự động xóa toàn bộ câu hỏi khi xóa bài học là rủi ro mất mát dữ liệu lớn đối với ngân hàng câu hỏi của giáo viên.

## 2. Yêu cầu nghiệp vụ (Business Requirements)
- **FR-001 (Tùy chọn xử lý câu hỏi khi xóa bài học)**:
  Khi giáo viên thực hiện xóa một bài học, hệ thống MUST cung cấp các lựa chọn xử lý các câu hỏi thuộc bài học đó bằng ngôn ngữ nghiệp vụ rõ ràng, dễ hiểu:
  1. **Chuyển toàn bộ câu hỏi sang bài học khác**:
     - Cho phép chọn bài học đích từ danh sách các bài học hiện có (ngoại trừ bài học đang xóa).
     - Toàn bộ câu hỏi thuộc bài học cần xóa sẽ được cập nhật thuộc về bài học mới được chọn.
  2. **Gỡ liên kết (Lưu câu hỏi ở trạng thái "Chưa phân loại")**:
     - Giữ nguyên toàn bộ câu hỏi trong ngân hàng câu hỏi và các đề thi đã tạo.
     - Câu hỏi chỉ được gỡ liên kết khỏi bài học bị xóa và chuyển sang danh mục câu hỏi chưa phân loại để giáo viên có thể sắp xếp lại sau.
  3. **Xóa luôn tất cả câu hỏi thuộc bài học này**:
     - Tùy chọn này chỉ xóa được nếu các câu hỏi chưa từng được đưa vào bất kỳ đề thi nào. Nếu đã có trong đề thi, hệ thống sẽ cảnh báo an toàn.

- **FR-002 (Giao diện xác nhận xóa chuyên dụng - DeleteLessonModal)**:
  - Thay thế hộp thoại xác nhận xóa đơn giản bằng modal chuyên nghiệp `DeleteLessonModal`.
  - Hiển thị tên bài học cần xóa và số lượng câu hỏi hiện có trong bài học đó.
  - Cung cấp radio options bằng ngôn ngữ nghiệp vụ thân thiện:
    - `(•) Chuyển toàn bộ câu hỏi sang bài học khác`: hiển thị Dropdown chọn bài học đích.
    - `( ) Gỡ liên kết (Lưu vào danh sách câu hỏi chưa phân loại)`: với chú thích *"Câu hỏi vẫn được bảo lưu an toàn trong hệ thống và các đề thi đã tạo"*.
    - `( ) Xóa toàn bộ câu hỏi cùng với bài học`: với chú thích *"Các câu hỏi thuộc bài học này sẽ bị xóa khỏi ngân hàng câu hỏi"*.

- **FR-003 (Backend API & Database Cascade)**:
  - Cập nhật endpoint `DELETE /api/v1/lessons/{lesson_id}` hỗ trợ tham số:
    - `reassign_to_lesson_id: UUID | None` (nếu chọn chuyển sang bài học khác).
    - `action: "reassign" | "unassign" | "delete"` (mặc định là `"unassign"` để bảo vệ dữ liệu).
  - Cập nhật ràng buộc khóa ngoại `questions_lesson_id_fkey` sang `ON DELETE SET NULL` thông qua Alembic migration để đảm bảo toàn vẹn dữ liệu ở cấp cơ sở dữ liệu.
