# Feature Specification: Sửa lỗi chấm sai đáp án trong Game Arena (Fix Game Answer Verification & Timer Desync)

**Feature Branch**: `005-fix-game-answer-verification`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Hiện tại tôi thấy có 1 vấn đề là Câu hỏi soạn đúng nhưng lúc chơi game thì người dùng chọn đúng thì hệ thống lại báo sai, hãy tìm kiếm bug này"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chính xác trong việc xác nhận và chấm điểm đáp án (Priority: P1)

Khi người chơi tham gia ải câu hỏi trong Game Arena và chọn đáp án được định nghĩa là chính xác trong cơ sở dữ liệu, hệ thống phải chấm `Chính xác` (is_correct = True), cộng điểm thưởng/vàng, trừ máu Boss/quái vật, và hiển thị viền xanh lá trên đáp án đã chọn mà không bị ghi đè sai sót.

**Why this priority**: Đây là logic cốt lõi nhất của chế độ trò chơi. Nếu người dùng chọn đúng mà hệ thống chấm sai và trừ mạng của họ, trải nghiệm trò chơi bị phá hủy hoàn toàn.

**Independent Test**:
- Vào một ván chơi mới hoặc tiếp tục ván chơi hiện tại.
- Chọn một câu hỏi đã biết trước đáp án đúng (ví dụ câu NumPy `[2]`).
- Chọn đáp án đúng trong thời gian cho phép.
- Hệ thống phải hiển thị viền xanh lá, thông báo "Chính xác!", cộng điểm và không trừ mạng.

**Acceptance Scenarios**:

1. **Given** người chơi đang ở một câu hỏi trong Game Arena, **When** người chơi bấm chọn đáp án đúng được định nghĩa trong ngân hàng câu hỏi, **Then** hệ thống ghi nhận đáp án đúng, trừ máu đối thủ, cộng điểm và hiển thị kết quả thành công.
2. **Given** người chơi chọn một đáp án, **When** hệ thống gửi yêu cầu xác nhận đáp án lên máy chủ, **Then** mã đáp án (Option ID) gửi đi phải trùng khớp 100% với lựa chọn mà người chơi vừa nhấp chuột trên màn hình.

---

### User Story 2 - Tiếp tục phiên chơi dở dang (Resume Session) không bị phạt hết giờ (Priority: P1)

Người chơi có một phiên chơi đang dở dang (được tạo trước đó, hoặc người chơi vô tình tải lại trang / ngắt kết nối mạng rồi quay lại). Khi người chơi mở lại phiên chơi và đọc câu hỏi hiện tại, đồng hồ tính giờ phải được khởi tạo lại hoặc đồng bộ tương ứng với thời điểm câu hỏi thực sự bắt đầu hiển thị cho người chơi, không được lấy mốc thời gian cũ từ hàng giờ trước để phạt hết giờ.

**Why this priority**: Hiện tại các phiên chơi dang dở khi người chơi tải lại trang có mốc thời gian bắt đầu câu hỏi (`current_question_started_at`) từ nhiều giờ/ngày trước. Khi nộp đáp án, máy chủ phạt hết giờ quá 10s và tự động đổi `is_correct = False`, làm người chơi luôn thua oan uổng ở câu đầu tiên sau khi tải lại trang.

**Independent Test**:
- Tạo một phiên chơi, trả lời 1 câu rồi đóng tab trình duyệt trong 2 phút.
- Mở lại trang game, chọn đúng đáp án cho câu hỏi kế tiếp trong vòng 10 giây.
- Hệ thống phải chấm đúng và không bị cưỡng chế đánh dấu sai vì timeout.

**Acceptance Scenarios**:

1. **Given** phiên chơi đã được tạo từ trước và người dùng tải lại trang web, **When** hệ thống nạp lại phiên chơi thông qua API nạp phiên hoạt động, **Then** thời gian bắt đầu của câu hỏi chưa làm phải được làm mới hoặc đồng bộ với thời điểm câu hỏi bắt đầu đếm ngược trên giao diện.
2. **Given** phiên chơi được tải lại sau nhiều giờ, **When** người chơi nộp đáp án đúng trong khoảng thời gian đếm ngược của câu hỏi đó, **Then** máy chủ không kích hoạt quy tắc chống gian lận hết giờ và công nhận đáp án đúng.

---

### User Story 3 - Chuyển tiếp câu hỏi mượt mà không bị hao hụt thời gian suy nghĩ (Priority: P2)

Sau khi trả lời xong câu hỏi $N$, người chơi dừng lại ở màn hình hiển thị kết quả câu $N$ (đọc nội dung, xem hoạt ảnh chiến đấu, hoặc nghỉ ngơi ngắn) trước khi nhấn "TIẾP TỤC HÀNH TRÌNH". Thời gian suy nghĩ của câu hỏi $N+1$ chỉ được bắt đầu đếm khi câu hỏi $N+1$ thực sự hiển thị trên giao diện của người chơi.

**Why this priority**: Hiện tại, khi câu $N$ nộp xong thì máy chủ đã lập tức kích hoạt bộ đếm giờ của câu $N+1$. Nếu người chơi nán lại 20-30s ở màn hình hoàn thành câu $N$, bộ đếm trên máy chủ của câu $N+1$ đã bị trôi đi hết, dẫn đến việc người chơi bước vào câu $N+1$ thì máy chủ đã coi như hết thời gian.

**Independent Test**:
- Trả lời xong câu 1, nán lại ở màn hình kết quả 35 giây trước khi nhấn "TIẾP TỤC HÀNH TRÌNH".
- Bước vào câu 2, trả lời đúng trong vòng 10 giây.
- Kết quả câu 2 phải được ghi nhận là đúng, không bị ghi đè thành sai do khoảng thời gian chờ ở câu 1.

**Acceptance Scenarios**:

1. **Given** người chơi vừa hoàn thành câu hỏi $N$ và đang ở màn hình phản hồi/hoạt ảnh, **When** người chơi chưa nhấn "TIẾP TỤC HÀNH TRÌNH", **Then** thời gian làm bài của câu hỏi $N+1$ chưa bắt đầu tính phạt trên máy chủ.
2. **Given** người chơi nhấn "TIẾP TỤC HÀNH TRÌNH" để nạp câu hỏi $N+1$, **When** câu hỏi mới hiển thị trên giao diện, **Then** bộ đếm thời gian phía máy chủ và phía giao diện người dùng được đồng bộ cùng một mốc thời gian bắt đầu.

---

### Edge Cases

- **Nộp đáp án khi thực sự hết giờ trên giao diện**: Khi đồng hồ đếm ngược trên giao diện về 0s, hệ thống tự động nộp đáp án trống. Máy chủ ghi nhận hết giờ, trừ 1 mạng và hiển thị đáp án đúng mà không gây lỗi crash.
- **Mất kết nối mạng tạm thời (Network Latency Spike)**: Nếu mạng chập chờn 2–5 giây trong lúc gửi đáp án, bộ đệm dung sai (buffer 10 giây) phải tính từ thời điểm câu hỏi thực sự bắt đầu để tránh phạt oan người chơi có kết nối kém.
- **Người dùng spam bấm nhiều lần vào các nút đáp án**: Chỉ nhận diện lần bấm đầu tiên, khóa các nút còn lại ngay lập tức trên giao diện và máy chủ từ chối các yêu cầu nộp trùng lặp cho cùng một câu hỏi.
- **Câu hỏi có độ dài nội dung hoặc hình ảnh lớn**: Đảm bảo thời gian tải tài nguyên hình ảnh không bị trừ vào thời gian suy nghĩ trả lời của người dùng.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI đối chiếu đáp án người chơi chọn với mã đáp án đúng (`is_correct: true`) trong cơ sở dữ liệu và chỉ chấm sai khi người dùng chọn sai mã hoặc thực sự hết thời gian quy định của câu hỏi.
- **FR-002**: Máy chủ PHẢI chỉ bắt đầu tính thời gian làm bài của câu hỏi khi câu hỏi đó thực sự được giao cho người chơi (khi người chơi chuyển sang câu mới hoặc khi bắt đầu phiên), KHÔNG được tính giờ chạy ngầm trong lúc người chơi đang ở màn hình kết quả câu trước.
- **FR-003**: Khi người chơi nạp hoặc tiếp tục một phiên chơi dở dang (`GET /sessions/active`), máy chủ PHẢI làm mới mốc thời gian bắt đầu của câu hỏi hiện tại (`current_question_started_at`) tương ứng với thời điểm nạp lại phiên.
- **FR-004**: Phía giao diện (Frontend) PHẢI đảm bảo mã định danh của đáp án (`option.id`) truyền vào hàm gửi đáp án (`submitAnswer`) khớp chính xác với đáp án mà người dùng nhấp chọn trên giao diện đồ họa.
- **FR-005**: Máy chủ PHẢI trả về chính xác `correct_option_id` trong kết quả nộp bài, và giao diện PHẢI hiển thị viền xanh lá ở đáp án đúng và viền đỏ ở đáp án sai khi người chơi chọn không chính xác.
- **FR-006**: Quy tắc chống gian lận (Anti-cheat timer) chỉ ghi đè đáp án thành sai khi và chỉ khi khoảng thời gian thực tế từ lúc câu hỏi hiển thị đến khi nộp vượt quá `thời gian cho phép + dung sai độ trễ mạng` một cách hợp lệ.

### Key Entities

- **GameSession**: Phiên chơi của người dùng, lưu trữ tiến trình qua từng câu hỏi, số mạng còn lại, số vàng, điểm số, và mốc thời gian bắt đầu câu hỏi hiện tại.
- **QuestionOption**: Đáp án của câu hỏi, chứa mã định danh duy nhất (`id`), nội dung (`text`), và cờ xác định đúng/sai (`is_correct`).
- **GamificationState**: Trạng thái trò chơi bao gồm bộ đếm thời gian bắt đầu câu hỏi hiện tại (`current_question_started_at`), chỉ số câu hỏi hiện tại (`last_question_index`), và điểm số.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% các câu hỏi mà người chơi chọn đúng đáp án trong thời gian quy định được hệ thống chấm đúng (`is_correct: true`) và cộng điểm thưởng bình thường.
- **SC-002**: Tỷ lệ chấm sai do lỗi trôi thời gian khi tiếp tục phiên chơi cũ hoặc khi nán lại ở màn hình chuyển câu giảm về 0%.
- **SC-003**: 100% người chơi tải lại trang (F5) khi đang làm dở ván đấu có thể tiếp tục trả lời câu hỏi hiện tại mà không bị trừ mạng oan do quá hạn thời gian.
- **SC-004**: Người dùng có thể dừng lại xem giải thích và hoạt ảnh ở màn hình giữa 2 câu hỏi tùy ý mà không làm tiêu hao quỹ thời gian của câu hỏi tiếp theo.

---

## Assumptions

- Ngân hàng câu hỏi trong cơ sở dữ liệu đã được tác giả soạn đúng với 1 đáp án duy nhất có `is_correct: true`.
- Thời gian cho phép của mỗi câu hỏi ở Tầng 1 là 60 giây (hoặc 30 giây với Boss), Tầng 2 là 120 giây (hoặc 60 giây với Boss), và Tầng 3 là 300 giây (hoặc 120 giây với Boss).
- Dung sai trễ mạng hiện tại là 10.0 giây trên máy chủ là mức hợp lý và an toàn cho người dùng trên mạng di động.
