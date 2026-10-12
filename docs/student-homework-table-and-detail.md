# Task: Student Homework Table and Detail Page

## Objective
Chỉnh sửa lại trang bài tập coding của học sinh tại `/lessons/[slug]/homework`:
1. Hiển thị bảng danh sách các bài tập coding (Homework Table) với:
   - 3 thẻ thống kê tổng quan (Đã giao, Đã nộp bài, Điểm trung bình).
   - Bảng danh sách bài tập chi tiết: Tên bài tập, Ngày giao, Tình trạng nộp bài (Chưa nộp / Đã nộp), Tình trạng đánh giá (Chưa chấm / Đang chấm / Đã chấm X/10 điểm), Nút hành động xem chi tiết.
2. Trang xem chi tiết bài tập riêng biệt tại `/lessons/[slug]/homework/[id]`:
   - Nút quay lại danh sách bài tập.
   - Header thông tin bài tập & nút tải tài liệu đính kèm (nếu có).
   - Nội dung đề bài chi tiết (Markdown).
   - Timeline tiến trình (Đã giao -> Đã nộp -> Đã chấm).
   - Khung nộp bài (kéo thả file zip/rar/tar.gz) và hỗ trợ nộp lại.
   - Kết quả chấm điểm, nhận xét AI/giáo viên, chi tiết điểm số nếu đã có bài nộp.

## Architecture & Components
1. `apps/web/features/homeworks/queries.ts`:
   - Bổ sung `useMyHomeworkSubmission(homeworkId)`.
   - Cập nhật cache invalidation khi submit / retry.
2. `apps/web/features/homeworks/components/student-homework-table.tsx`:
   - Component bảng danh sách bài tập của học sinh.
3. `apps/web/features/homeworks/components/homework-tab.tsx`:
   - Render 3 thẻ thống kê + `StudentHomeworkTable`.
4. `apps/web/app/(root)/lessons/[slug]/(tabs)/homework/[id]/page.tsx`:
   - Route trang chi tiết bài tập của học sinh.
5. `apps/web/features/homeworks/components/student-homework-detail.tsx`:
   - View chi tiết bài tập đầy đủ: đề bài markdown, attachment, timeline, nộp bài, kết quả đánh giá.

## Verification Checklist
- [ ] Bảng danh sách bài tập hiển thị đúng trạng thái nộp bài và tình trạng đánh giá/điểm số.
- [ ] Click "Xem chi tiết" điều hướng đến đúng trang `/lessons/[slug]/homework/[id]`.
- [ ] Trang chi tiết bài tập hiển thị đầy đủ đề bài, đính kèm, timeline, và dropzone nộp bài.
- [ ] Nộp bài thành công cập nhật trạng thái chấm điểm.
- [ ] Responsive tốt trên cả màn hình Desktop và Mobile.
- [ ] Tuân thủ tuyệt đối quy tắc Clean Code & Purple Ban.
