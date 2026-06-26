# TÀI LIỆU ĐẶC TẢ YÊU CẦU NGHIỆP VỤ (BA) - HỆ THỐNG AI HACKATHON

## 1. TỔNG QUAN DỰ ÁN
Hệ thống AI Hackathon là một nền tảng trực tuyến quản lý các cuộc thi công nghệ chuyên sâu về Trí tuệ nhân tạo (AI) và Học máy (ML). Hệ thống cho phép ban tổ chức cấu hình cuộc thi, quản lý bài tập, và tự động hóa quy trình đánh giá mã nguồn cũng như mô hình do thí sinh nộp lên, đảm bảo tính minh bạch, chính xác và tối ưu tài nguyên tính toán.

## 2. ĐỐI TƯỢNG SỬ DỤNG (ACTORS)
- **Quản trị viên (Admin / Ban tổ chức):** Có toàn quyền cấu hình cuộc thi, xét duyệt đội thi, quản lý đề bài và giám sát hệ thống chấm điểm tự động.
- **Thí sinh (User / Đội thi):** Đăng ký tham gia (cá nhân hoặc đội), nộp bài, theo dõi tiến trình chấm giải, xem bảng xếp hạng và quản lý lịch sử nộp bài.

## 3. ĐẶC TẢ CHỨC NĂNG CHI TIẾT

### 3.1. Quản lý cuộc thi (CRUD Competitions)
Admin có khả năng tạo mới, xem danh sách, cập nhật thông tin và xóa cuộc thi. Các thông tin cấu hình bao gồm:
- Tên cuộc thi, mô tả chi tiết, thể lệ.
- Mốc thời gian (Bắt đầu / Kết thúc).
- Hình thức tham gia (Cá nhân, Đội nhóm hoặc cả hai).

### 3.2. Quản lý Đăng ký và Xét duyệt tham gia
- **Đăng ký Cá nhân:** Người dùng đăng ký trực tiếp bằng tài khoản cá nhân vào cuộc thi.
- **Đăng ký Đội nhóm (Team):** Trưởng đội tạo đội, đặt tên đội và mời các thành viên tham gia qua mã mời hoặc email hệ thống.
- **Quy trình:** Sau khi gửi yêu cầu đăng ký, trạng thái hồ sơ sẽ ở dạng `Chờ xét duyệt`. Admin thực hiện duyệt (`Approve`) hoặc từ chối (`Reject`).

### 3.3. Quản lý Bài tập nhỏ (CRUD Exercises/Tasks)
Admin quản lý các bài tập (chặng thi) gồm:
- Tên bài tập, Mô tả bài toán (Markdown văn bản bao gồm bối cảnh, dữ liệu, tiêu chí đánh giá, link tập dữ liệu mẫu `Sample Dataset`, Quy định).
- Link `private test` (đáp án bảo mật phục vụ chấm điểm tự động bên dưới nền hệ thống).
- Link `public test`.
- `Metric_Type` (Enum dạng Dropdown: RMSE, F1-Score, Accuracy...). Bước 4 của Pipeline sẽ gọi đúng hàm Metric này để đối chiếu `file_model` kết quả và Link `private test` (Ground Truth).
- Số lượt được phép nộp tối đa.

### 3.4. Quy trình Nộp bài và Đánh giá Tự động (Execution Pipeline)
Thí sinh nộp bài dưới dạng tổ hợp gồm hai thành phần bắt buộc: 1 script dự đoán (`predict script`) và 1 file chứa tham số mô hình (`model file`). Quy trình xử lý gồm 5 bước tuần tự:

| Bước | Trạng thái / Tiến trình | Mô tả hoạt động của hệ thống |
| :--- | :--- | :--- |
| 1 | **Đang upload (Uploading)** | Tiếp nhận file script và file model từ client, truyền tải lên máy chủ lưu trữ an toàn (MinIO/S3) và kiểm tra tính toàn vẹn. |
| 2 | **Giải nén và chuẩn bị môi trường (Extracting and setup)** | Giải nén (nếu cần) và chuẩn bị môi trường container biệt lập (Sandbox) để chuẩn bị thực thi mã nguồn. |
| 3 | **Chạy mô hình và tính toán độ chính xác (Running Model)** | Kích hoạt script predict của thí sinh bên trong môi trường máy ảo/sandbox, nạp `file_model` để thực hiện dự đoán trên tập dữ liệu kiểm thử ẩn (`Hidden Test Set`) nhằm tạo ra file kết quả đầu ra. |
| 4 | **Tính toán độ chính xác (Evaluating)** | So sánh file kết quả đầu ra do mô hình của thí sinh tạo ra với file ground truth bằng các thuật toán metric đã thiết lập (`Metric_Type`) để tính toán điểm số chính xác. |
| 5 | **Public kết quả (Publishing)** | Ghi nhận điểm số chính thức vào lịch sử nộp bài của thí sinh, giải phóng tài nguyên tính toán và đồng bộ dữ liệu trực tiếp lên bảng xếp hạng công khai. |

## 4. RÀNG BUỘC HỆ THỐNG & BẢO MẬT

### 4.1. Lỗ hổng đánh cắp đáp án qua Error Log
- **Nguy cơ:** Thí sinh cố tình in ra dữ liệu của tập Private Test (Ground Truth) rồi dùng lệnh `sys.exit(1)`. Lỗi văng ra terminal mang theo toàn bộ dữ liệu ẩn, thí sinh xem log và ăn cắp được đáp án.
- **Giải pháp thiết kế:** Môi trường Sandbox chạy code (container) không được phép chứa file đáp án (Ground Truth). Bước 3 chỉ sinh ra file predict. Bước 4 (chạy ở một service nội bộ khác, cô lập hoàn toàn) mới lấy file predict đối chiếu với Ground Truth. Ngoài ra, giới hạn độ dài Error Log trả về tối đa 50 dòng cuối.

### 4.2. Lỗ hổng cạn kiệt tài nguyên (OOM & Vòng lặp vô hạn)
- **Nguy cơ:** Thí sinh nộp vòng lặp vô hạn `while True:` hoặc model ngốn quá nhiều tài nguyên gây sập hệ thống (Out of Memory).
- **Giải pháp thiết kế:** Thêm yêu cầu về Time-out (Tối đa 15 phút sẽ tự động bị kill và đánh fail) và Resource Limit (giới hạn vCPU, RAM, GPU quota cho mỗi container). Container không được cấp quyền truy cập Internet.

### 4.3. Kiểm soát Quy trình: Hủy bỏ và Xem lỗi
- **Hủy quá trình (Cancel Submission):** Trong khi hệ thống đang xử lý ở bước 1, 2, hoặc 3, thí sinh có quyền bấm nút "Cancel". Hệ thống sẽ dừng lập tức tiến trình đang chạy, giải phóng bộ nhớ/GPU và đánh dấu trạng thái lượt nộp là "Đã hủy" (không tính điểm).
- **Xem lỗi (Error Logs):** Nếu tiến trình thất bại ở bất kỳ bước nào, hệ thống bắt (catch) tối đa 50 dòng log lỗi cuối từ terminal hiển thị cho thí sinh debugging.

## 5. QUY ĐỊNH GIỚI HẠN VÀ TẦN SUẤT NỘP BÀI (RATE LIMITING & QUOTA)
- **Khoảng cách giữa các lần nộp (Cooldown):** 5 phút / lần nộp. Tính từ thời điểm bấm nộp bài thành công trước đó. Nút nộp bài sẽ bị vô hiệu hóa (disabled) kèm đồng hồ đếm ngược.
- **Số lần nộp tối đa (Max Quota):** Tối đa $n$ lần / cuộc thi. Lượt nộp bị lỗi hệ thống hoặc chủ động Hủy (Cancel) sẽ không bị trừ vào quota này. Khi đạt giới hạn $n$, hệ thống từ chối nhận bài nộp mới hoàn toàn.

## 6. BẢNG XẾP HẠNG (LEADERBOARD)
- **Bảng xếp hạng Public:** Hiển thị realtime, điểm tính dựa trên tập dữ liệu Public Test.
- **Bảng xếp hạng Private:** Chỉ hiển thị khi cuộc thi kết thúc, điểm tính dựa trên tập dữ liệu Private Test để xác định kết quả chung cuộc.

### 6.1. Cấu trúc các cột trên Bảng xếp hạng
- **Hạng (Rank):** Vị trí hiện tại trên bảng.
- **Tên Đội / Cá nhân:** Định danh của người tham gia.
- **Điểm các bài tập nhỏ:** Hiển thị điểm số cao nhất (Best Score) đạt được ở từng bài tập riêng biệt.
- **Điểm Tổng:** Tính bằng công thức Trung bình cộng điểm số của tất cả các cột con bài tập nhỏ:
$$\text{Điểm Tổng} = \frac{\sum_{i=1}^{N} \text{Điểm Bài}_i}{N}$$
- **Inference Time (Thời gian chạy mô hình):** Tổng thời gian chạy mô hình của lượt nộp được lấy làm kết quả (đơn vị: giây hoặc mili-giây).
- **Submission Time (Thời gian nộp kết quả):** Mốc thời gian (Timestamp) ghi nhận lượt nộp giúp đội đạt mức Điểm Tổng hiện tại.

### 6.2. Quy tắc sắp xếp thứ tự ưu tiên (Ranking Priority Rules)
Hệ thống đánh giá dựa trên Lượt nộp (Submission) có Điểm Tổng cao nhất. Sắp xếp từ trên xuống dưới theo:
1. **Ưu tiên 1 - Điểm Tổng:** Đội nào có Điểm Tổng cao hơn sẽ xếp hạng cao hơn.
2. **Ưu tiên 2 - Thời gian thực thi (Inference Time):** Nếu trùng Điểm Tổng, đội nào có tổng Inference Time nhỏ hơn sẽ xếp hạng cao hơn.
3. **Ưu tiên 3 - Thời gian nộp kết quả (Submission Time):** Nếu vẫn trùng, đội nào đạt được mức điểm đó ở thời điểm sớm hơn sẽ đứng trước.

---
## 7. QUY ĐỊNH ĐỐI VỚI AI AGENT ĐỂ ĐỒNG BỘ CODE (CLEAN ARCHITECTURE GUIDELINES)
Khi tiến hành hiện thực hóa mã nguồn (code) cho dự án này, AI Agent phải tuân thủ nghiêm ngặt cấu trúc **Clean Architecture** của thư mục `apps/api/app`:
1. Các cấu hình endpoints nhận file và validate dữ liệu thô đầu vào bắt buộc phải nằm ở tầng **Presentation Layer (`app/api/`)**.
2. Toàn bộ logic điều phối 5 bước của Execution Pipeline, gọi Redis để check Rate Limiting, gọi Worker phải được xử lý biệt lập trong tầng **Application Layer (`app/services/` hoặc `app/usecases/`)**.
3. Quy tắc tính toán Điểm Tổng, sắp xếp bảng xếp hạng và định nghĩa thực thể dữ liệu phải nằm ở tầng **Domain Layer (`app/models/`)**.
4. Các kết nối thô tới PostgreSQL và client gọi Docker SDK phải nằm ở tầng **Infrastructure Layer**.
## 8. ÁNH XẠ KIẾN TRÚC HỆ THỐNG THEO SƠ ĐỒ SÁCH (ARCHITECTURE MAPPING)
Dựa trên sơ đồ kiến trúc backend chấm điểm tự động (image_e5dadb.jpg), toàn bộ mã nguồn của dự án phải được phân rã nghiêm ngặt theo mô hình Clean Architecture 4 tầng:

### 8.1. Tầng Presentation Layer (Ports / API Routers)
Đây là bề nổi của khối CORE API SERVICE - FastAPI, chịu trách nhiệm nhận/trả request.
- **API Gateway & Router:** Định nghĩa các route tiếp nhận HTTP Request từ Admin và Thí sinh.
- **Submission Receiver (Bước 2):** Nhận luồng upload trực tiếp gồm `script + model` từ Frontend, thực hiện validate sơ bộ payload bằng Pydantic định dạng dữ liệu đầu vào.
- **Logs / Cancel Endpoint (Bước 5):** Cung cấp API cho phép Client theo dõi log lỗi (giới hạn 50 dòng) hoặc gửi tín hiệu dừng tiến trình (`Cancel`).
- **WebSocket BXH (Bước 6 & 8):** Mở cổng kết nối WebSocket liên tục để nhận event từ Redis Pub/Sub và đẩy trực tiếp bảng xếp hạng realtime xuống giao diện.

### 8.2. Tầng Application Layer (Usecases / Workflows / Services)
Tầng này chứa kịch bản vận hành, điều phối các linh kiện ở tầng dữ liệu thông qua các Interfaces.
- **Registration Usecase:** Xử lý logic nghiệp vụ đăng ký cá nhân, tạo đội, sinh mã mời nhóm, và chuyển trạng thái chờ duyệt.
- **Task Management Usecase:** Cung cấp thông tin đề bài, bối cảnh, link Sample Dataset.
- **Submission Flow Coordinator (Bước 3 & 4):** 
  1. Gọi Service Check Rate Limiter (Cooldown 5 phút/lần, Max Quota $n$ lần) bằng cách truy vấn Redis.
  2. Nếu hợp lệ, gọi Storage Service đẩy file an toàn vào MinIO / S3.
  3. Ghi trạng thái `Uploading / Queued` vào PostgreSQL.
  4. Đóng gói dữ liệu (Job metadata) và đẩy vào hàng đợi Redis Queue (Broker).

### 8.3. Tầng Domain Layer (Enterprise Core Policies)
Tầng cốt lõi chứa thực thể (Entities) và quy tắc nghiệp vụ bất biến, tuyệt đối độc lập với thư viện bên ngoài.
- **Ranking Rules:** Triển khai quy tắc sắp xếp độ ưu tiên Leaderboard: Điểm Tổng (Trung bình cộng) $\rightarrow$ Inference Time $\rightarrow$ Submission Time.
- **Validation Rules:** Định nghĩa các Enum về cuộc thi (Cá nhân/Đội nhóm), trạng thái chấm (`Uploading`, `Extracting`, `Running`, `Evaluating`, `Publishing`), và Enum các hàm đo lường toán học (`Metric_Type`: RMSE, F1-Score, Accuracy).

### 8.4. Tầng Infrastructure Layer (Adapters / External Services)
Tầng triển khai kỹ thuật thô, làm việc trực tiếp với phần cứng, Driver DB, Docker API và các nền tảng lưu trữ.
- **Database Drivers:** Triển khai các Repository thao tác CRUD với PostgreSQL (Competitions, Teams, Tasks, Submissions, Scores) và Redis (Rate Limit, Pub/Sub, Queue).
- **Storage Client:** Kết nối trực tiếp API với MinIO / S3 để upload/download các artifact.
- **Execution Engine - Background Worker (Khối màu cam dưới cùng):**
  - **Queue Consumer (Bước 5):** Chạy luồng nền (Background process) liên tục lắng nghe và kéo Job từ hàng đợi Redis Queue.
  - **Sandbox Orchestrator (Bước 5 & 6):** Gọi Docker SDK để khởi tạo container biệt lập (**Docker Sandbox**). Cấu hình ràng buộc hệ thống nghiêm ngặt: `network: none` (Không internet), `Time-out` (Max 15 phút), giới hạn tài nguyên phần cứng `RAM / CPU / GPU limit`. Tiến hành nạp script, model và tập Hidden Test dữ liệu vào máy ảo để thực thi và hứng file đầu ra `predict.csv`.
  - **Bảo mật tuyệt đối (Lưu ý bảo mật từ image_e5dadb.jpg):** Cấm tuyệt đối không được mount file Ground Truth (đáp án bảo mật) vào trong Docker Sandbox để chống lỗ hổng thí sinh in log trộm đáp án.
  - **Internal Metric Evaluator (Bước 7a & 7b):** Một dịch vụ nội bộ chạy cô lập hoàn toàn nằm ngoài Sandbox. Nó có nhiệm vụ kéo file kết quả `predict.csv` từ đầu ra máy ảo, nạp file đáp án ẩn từ ổ đĩa bảo mật (`Restricted GT`), tính toán điểm số dựa theo cấu hình `Metric_Type`, sau đó cập nhật kết quả vào PostgreSQL và phát (Publish) một event qua Redis Pub/Sub để báo cho WebSocket.