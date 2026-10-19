# Quickstart Validation Guide: Arena User Match History

## 1. Prerequisites
- Docker containers running or local backend and frontend running:
  - Backend API: `http://localhost:8000`
  - Frontend Web: `http://localhost:3000`
- User has logged in and has completed at least one Arena session in lesson `tong-quan-ve-python`.

## 2. API Verification

### Test API via cURL
```bash
curl -X GET "http://localhost:8000/api/v1/game/tong-quan-ve-python/history/1" \
  -H "Accept: application/json"
```

Expected Response:
- Status `200 OK`.
- JSON containing `user_id`, `lesson_slug`, and `history` array with `attempt_number`, `final_score`, `accuracy_percentage`, `max_streak`, v.v.
- Verify that `snapshot.questions` and `snapshot.answers` ARE NOT exposed.

## 3. UI Verification Scenarios

### Scenario 1: Xem Bảng Vàng và Click vào dũng sĩ
1. Truy cập vào trang `http://localhost:3000/lessons/tong-quan-ve-python/arena`.
2. Bấm vào nút "Bảng Vàng Dũng Sĩ" để mở modal xếp hạng.
3. Quan sát: Các bục Top 3 Podium bên trên giữ nguyên, không có hiệu ứng clickable.
4. Di chuột vào một hàng dũng sĩ bất kỳ trong danh sách xếp hạng bên dưới: Hiển thị con trỏ pointer, hiệu ứng hover highlight và icon chevron mũi tên.
5. Click vào hàng dũng sĩ đó:
   - Modal chuyển sang view `Danh sách lượt thi` (Tầng 2).
   - Breadcrumb hiển thị: `Bảng Vàng > [Tên dũng sĩ]`.
   - Hiển thị danh sách các lượt thi của người đó (Lượt #1, Lượt #2...).

### Scenario 2: Xem chi tiết chỉ số lượt thi
1. Trong danh sách các lượt thi (Tầng 2), click vào thẻ một lượt thi bất kỳ:
   - Modal chuyển sang view `Chi tiết chỉ số` (Tầng 3).
   - Breadcrumb cập nhật: `Bảng Vàng > [Tên dũng sĩ] > Lượt thi #N`.
   - Hiển thị bảng chỉ số: Điểm số, Vàng kiếm được, Thời gian làm bài, Độ chính xác (%), Số câu đúng/sai, Chuỗi đúng cao nhất (Max streak).
   - Đảm bảo KHÔNG có văn bản câu hỏi và đáp án.

### Scenario 3: Điều hướng ngược
1. Từ Tầng 3, bấm vào node breadcrumb `[Tên dũng sĩ]` hoặc nút `Quay lại`: Modal trở về Tầng 2.
2. Từ Tầng 2, bấm vào node breadcrumb `Bảng Vàng` hoặc nút `Quay lại`: Modal trở về Tầng 1.
3. Bấm nút `X` đóng modal ở bất kỳ tầng nào: Modal đóng hoàn toàn, không reload trang, giữ nguyên trạng thái phòng đấu trường.
