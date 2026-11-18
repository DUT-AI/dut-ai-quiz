# Motion Quiz — Shared Contracts

Trạng thái: bản đề xuất dựa trên quiz-motion, cần Huy/Dũng/Bình review.

## Phân công

- Huy triển khai PoseEngine trong cv/.
- Bình nhận frame và quản lý random, hold, submit trong engine/.
- Dũng hiển thị video, landmarks và tiến độ trong ui/.
- Các module sử dụng contracts chung, không tự định nghĩa lại kiểu.

## Dữ liệu pose

- ActionId giữ nguyên ý nghĩa ACT_01 đến ACT_08 của repo nguồn.
- timestampMs dùng clock đơn điệu chung của phiên, đơn vị milliseconds.
- confidence thuộc [0, 1], là độ khớp quy tắc nhận diện.
- Khi tracking: landmarks có 33 điểm theo đúng chỉ số MediaPipe.
- Khi lost/unavailable: landmarks rỗng, detectedAction = null,
  confidence = 0.
- Tracking vẫn có thể có detectedAction = null.
- x/y là tọa độ ảnh chuẩn hóa, gốc trên trái, chưa lật gương.
- Điểm ngoài khung hình có thể nằm ngoài [0, 1].
- Không đổi chỉ số landmark hoặc lật dữ liệu để phục vụ hiển thị.

## Vòng đời PoseEngine

- initialize() trước start().
- UI cung cấp video qua attachVideo().
- subscribe() nhận event POSE_UPDATED; frame ở event.payload.frame.
- subscribeCameraStatus() nhận thay đổi trạng thái camera.
- Đọc cameraStatus để lấy trạng thái hiện tại khi mới đăng ký.
- Hàm đăng ký trả về unsubscribe để dọn listener.
- stop() tạm dừng inference; provider hiện tại vẫn giữ camera stream.
- dispose() giải phóng tài nguyên; không dùng lại instance đã dispose.

## Mapping và tiến độ

- optionMap dùng ID đáp án thật, không dùng A/B/C/D làm định danh.
- Mỗi câu có bốn hành động khác nhau.
- Mapping ổn định trong một lượt câu hỏi.
- Bình tính thời gian giữ 1500 ms.
- holdProgress thuộc [0, 1]; Dũng chỉ hiển thị giá trị được cung cấp.
- Chốt đáp án và gửi API là hai bước khác nhau.
- Kết quả đúng/sai lấy từ backend.

## Khác biệt với cách gọi trong PDF

PDF mô tả onFrame/onCameraStatus. Contract này giữ
subscribe/subscribeCameraStatus theo engine hiện có của quiz-motion.

CameraState là kiểu dữ liệu hỗ trợ UI; callback của PoseEngine
hiện trả CameraStatus, không trả CameraState.
