# Quickstart Validation Guide: Game Answer Verification & Timer Synchronization

Tài liệu này cung cấp các kịch bản kiểm thử thực tế để xác thực tính năng và đảm bảo không xảy ra hiện tượng chấm sai đáp án.

## 1. Môi trường kiểm thử

- **Backend**: `http://localhost:8000` (hoặc server dev)
- **Frontend Web**: `http://localhost:3000`
- **Bài học thử nghiệm**: Bài học có các câu hỏi lập trình (ví dụ `python-numpy-fundamentals` hoặc bài học chứa câu hỏi `0dd26247-cef1-4c39-ae9a-8875f7db8e8d`).

---

## 2. Các Kịch bản Kiểm thử Chấp nhận (Acceptance Test Scenarios)

### Kịch bản 1: Trả lời đúng trong điều kiện bình thường
1. Vào chế độ **Game Arena** của bài học.
2. Tại câu hỏi đầu tiên, đọc câu hỏi và nhấp chọn đáp án đúng (ví dụ câu NumPy chọn đáp án `[2]`).
3. **Kết quả kỳ vọng**:
   - Nút đáp án đã chọn viền xanh lá (`border-emerald-500`).
   - Xuất hiện toast: `"Chính xác! Bạn nhận được vàng thưởng."`.
   - Boss/quái nhận sát thương, điểm số và vàng tăng lên.
   - Số mạng (`lives`) không bị trừ.

---

### Kịch bản 2: Dừng lại ở màn hình trung gian rồi mới sang câu kế tiếp
1. Sau khi trả lời xong Câu 1, **dừng lại ở màn hình hiển thị kết quả trong 30 giây** (không nhấn nút chuyển câu vội).
2. Sau 30 giây, nhấp vào nút **"TIẾP TỤC HÀNH TRÌNH"**.
3. Tại Câu 2, quan sát đồng hồ đếm ngược bắt đầu đếm từ đầu (ví dụ 60s).
4. Chọn đáp án đúng trong vòng 10 giây.
5. **Kết quả kỳ vọng**:
   - Hệ thống chấm **Chính xác** (is_correct = True).
   - Không bị kích hoạt quy tắc anti-cheat timeout do 30 giây chờ đợi ở câu trước.

---

### Kịch bản 3: Tải lại trang (F5 / Resume Active Session)
1. Đang ở Câu 3 của một ván chơi, nhấn **F5** để tải lại trang trình duyệt (hoặc đóng tab và mở lại sau 2 phút).
2. Hệ thống nạp lại phiên chơi dở dang qua màn hình tải phiên hoạt động.
3. Câu 3 hiển thị bình thường với đồng hồ đếm ngược đầy đủ.
4. Chọn đáp án đúng cho Câu 3.
5. **Kết quả kỳ vọng**:
   - Hệ thống chấm **Chính xác**.
   - Mốc thời gian được làm mới công bằng cho người chơi, không bị trừ mạng oan.

---

### Kịch bản 4: Trực quan hóa đáp án đúng khi người chơi chọn sai
1. Tại một câu hỏi bất kỳ, cố ý nhấp chọn một đáp án sai (ví dụ chọn `[-1, 0, 2]`).
2. **Kết quả kỳ vọng**:
   - Đáp án người chơi chọn được viền ĐỎ (`border-rose-500 bg-rose-100`).
   - **Đáp án đúng thực sự** (ví dụ `[2]`) được làm nổi bật với viền XANH LÁ (`border-emerald-500/80 bg-emerald-50/60`).
   - Người chơi bị trừ 1 mạng và hiển thị toast thông báo chọn sai.

---

### Kịch bản 5: Hết giờ thực tế trên giao diện (Legitimate Timeout)
1. Mở một câu hỏi và để đồng hồ đếm ngược tự động chạy về 0.
2. **Kết quả kỳ vọng**:
   - Toast thông báo: `"Hết thời gian suy nghĩ mất rồi!"`.
   - Hệ thống nộp đáp án trống, ghi nhận sai hợp lệ và hiển thị đáp án đúng màu xanh lá.
