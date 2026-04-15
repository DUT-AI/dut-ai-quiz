# Chấm điểm, leaderboard, shuffle & practice

## Chấm điểm

- **Thang điểm tổng**: **10**.
- **Điểm mỗi câu**: `10 / N` với **N** = số câu trong kỳ thi (chia đều).
- **Dạng câu**: trắc nghiệm **một đáp án đúng** / câu.
- **Làm tròn**: lưu/score hiển thị gợi ý **2 chữ số thập phân**; tổng **≤ 10** (điều chỉnh điểm câu cuối nếu phần dư do làm tròn — chi tiết lúc implement).

## Leaderboard (kỳ thi)

- Khi **`max_attempts` > 1**: mỗi user được xếp theo **điểm cao nhất** trong các lượt **`COMPLETED`** của cùng `exam_id`.
- **Practice không** đưa vào leaderboard.

## Shuffle (đã chốt)

- **Server** tạo thứ tự xáo khi **`POST /api/v1/exams/{exam_id}/attempts`**.
- Response trả về danh sách câu hỏi/options **đã xáo**; client **chỉ render đúng thứ tự đó**, **không** random thêm cho cùng một `attempt_id`.
- Lưu trên `attempts`: **`shuffle_seed` + tham số RNG** hoặc **`shuffle_snapshot` (JSONB)** đủ để tái hiện và chấm — quyết định chi tiết khi code (miễn `GET /attempts/{id}` idempotent với lúc làm bài).

**Không** dùng shuffle thuần client làm nguồn sự thật duy nhất (xem lý do trong kế hoạch đã chốt).

## Practice

- Pool **PRACTICE** tách khỏi câu **EXAM** (SRS).
- Điểm/kết quả practice **không** vào leaderboard; có thể chỉ lịch sử cá nhân qua [api.md](api.md) (`/practice/...`).
