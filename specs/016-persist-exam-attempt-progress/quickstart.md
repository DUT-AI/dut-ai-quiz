# Quickstart: Testing Resilient Exam Progress & Reload

1. **Khởi động ứng dụng**:
   - Backend: `uv run uvicorn app.main:app --reload` trong `apps/api`.
   - Frontend: `npm run dev` trong `apps/web`.

2. **Kiểm thử khôi phục câu trả lời khi F5**:
   - Đăng nhập học sinh và tham gia một bài thi.
   - Chọn nhanh một số câu trả lời (ví dụ Câu 1 chọn A, Câu 2 chọn B).
   - Nhấn F5 (Reload trang) ngay lập tức mà không cần chờ.
   - Khi trang tải lại, kiểm tra:
     - Các câu hỏi đã chọn vẫn giữ nguyên đáp án đã chọn.
     - Vị trí câu hỏi (`currentIndex`) được giữ nguyên tại câu đang làm.

3. **Kiểm thử Anti-Cheat không phạt F5**:
   - Tại trang thi toàn màn hình, nhấn F5 tải lại trang.
   - Modal cảnh báo gian lận "Rời khỏi màn hình làm bài" KHÔNG được hiển thị.
   - Số lần vi phạm `tab_out_count` trên backend không bị tăng.
