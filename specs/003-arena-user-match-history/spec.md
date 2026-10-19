# Feature Specification: Arena User Match History (Lịch Sử Thi Đấu Dũng Sĩ)

**Feature Branch**: `003-arena-user-match-history`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "/speckit-specify ở UI modal \"Bảng Vàng Dũng Sĩ\" https://quiz.dutai.site/lessons/tong-quan-ve-python/arena. Tôi muốn có có thể bấm vào 1 người dùng để xem toàn bộ lịch sử thi của 1 của họ, lịch sử tổng quan thôi, và bấm thêm 1 lần thì có thể xem chi tiết thêm nữa"

## Clarifications

### Session 2026-10-19

- Q: Khi bấm xem lịch sử thi của một dũng sĩ, phạm vi các lượt thi được liệt kê là gì? → A: Chỉ xem các lượt thi đấu Arena trong bài học hiện tại (ví dụ: `tong-quan-ve-python`).
- Q: Về mặt trải nghiệm người dùng (UX), bạn muốn việc hiển thị lịch sử tổng quan và chi tiết bài thi diễn ra theo hình thức nào? → A: Chuyển đổi nội dung bên trong modal hiện tại (thay đổi view: Bảng Vàng -> Danh sách lượt thi -> Chi tiết chỉ số lượt thi) kèm breadcrumb/nút Back.
- Q: Ở màn hình chi tiết bài thi (Tầng 3), quyền xem nội dung câu hỏi và đáp án đúng/sai của người khác được quy định thế nào? → A: Không hiển thị nội dung câu hỏi (question) và đáp án (answer).
- Q: Khi bấm thêm 1 lần để xem chi tiết lượt thi (không hiển thị câu hỏi và đáp án), màn hình này sẽ hiển thị những thông tin chi tiết nào của lượt thi? → A: Thống kê chỉ số chuyên sâu của lượt thi bao gồm: Điểm số, thời gian làm bài, số vàng kiếm được, số câu đúng/sai, tỷ lệ chính xác (%), combo chuỗi câu đúng cao nhất (max streak), và mốc thời gian thi đấu chi tiết.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem Danh Sách Tổng Quan Lịch Sử Lượt Thi Của Dũng Sĩ (Priority: P1)

Khi đang mở modal "Bảng Vàng Dũng Sĩ" trong phòng đấu trường Arena, người xem muốn bấm vào bất kỳ một dũng sĩ nào trong danh sách bảng xếp hạng (danh sách người dùng bên dưới; các bục Top 3 podium giữ nguyên vai trò vinh danh trực quan không gán click) để xem danh sách lịch sử các lượt tham gia thi đấu của dũng sĩ đó đối với bài học hiện tại. Danh sách hiển thị tổng quan các lượt thi: thời điểm thi, điểm đạt được, số vàng kiếm được, thời gian hoàn thành.

**Why this priority**: Đây là tầng tương tác đầu tiên, giải quyết nhu cầu xem lại thành tích thi đấu của một người chơi cụ thể mà không làm mất ngữ cảnh phòng đấu trường.

**Independent Test**: Người dùng mở modal Bảng Vàng Dũng Sĩ, click vào một hàng dũng sĩ trong danh sách xếp hạng -> Giao diện modal chuyển sang hiển thị danh sách các lượt thi đấu của người đó với các thông số tổng quan (ngày/giờ thi, điểm số, thời gian làm bài, số vàng).

**Acceptance Scenarios**:

1. **Given** người dùng đang ở modal "Bảng Vàng Dũng Sĩ", **When** click vào một hàng dũng sĩ trong danh sách bảng xếp hạng bên dưới, **Then** modal chuyển nội dung hiển thị danh sách tổng quan tất cả các lượt thi đấu của dũng sĩ đó trong bài học này, kèm thanh breadcrumb và nút quay lại Bảng Vàng. Các bục vinh danh Top 3 Podium giữ nguyên vai trò vinh danh trực quan, không gán sự kiện click.
2. **Given** dũng sĩ được chọn có các lượt thi đấu, **When** xem danh sách tổng quan, **Then** danh sách được sắp xếp theo thời gian mới nhất (hoặc lượt có điểm cao nhất) và hiển thị rõ: số thứ tự lượt thi, thời điểm thi, điểm số, thời gian làm bài, số vàng nhận được.
3. **Given** danh sách lịch sử thi đấu của người dùng đang hiển thị, **When** người dùng bấm nút quay lại hoặc nút đóng/breadcrumb, **Then** modal trở về giao diện Bảng Vàng Dũng Sĩ ban đầu mà không bị tải lại trang.

---

### User Story 2 - Xem Chỉ Số Thống Kê Chi Tiết Của Một Lượt Thi Đấu (Priority: P2)

Từ danh sách lịch sử tổng quan các lượt thi của dũng sĩ, người dùng có thể bấm tiếp vào một lượt thi cụ thể bất kỳ để chuyển sang màn hình xem chi tiết các chỉ số thi đấu chuyên sâu của lượt đó (không hiển thị văn bản câu hỏi và đáp án để bảo mật ngân hàng đề thi). Các chỉ số bao gồm: tổng điểm, thời gian làm bài, số vàng, số câu đúng/sai, độ chính xác (%), chuỗi câu đúng liên tiếp cao nhất (max streak) và mốc thời gian hoàn thành.

**Why this priority**: Đáp ứng yêu cầu bước 2 ("bấm thêm 1 lần thì có thể xem chi tiết thêm nữa"), giúp người dùng phân tích hiệu suất và kỹ năng thi đấu chuyên sâu của dũng sĩ trong lượt thi đó một cách an toàn và trực quan.

**Independent Test**: Từ danh sách tổng quan các lượt thi của dũng sĩ, click vào một thẻ lượt thi cụ thể -> Modal chuyển sang hiển thị bảng chỉ số chi tiết của lượt thi (điểm, vàng, thời gian, số câu đúng/sai, độ chính xác %, combo streak cao nhất).

**Acceptance Scenarios**:

1. **Given** người dùng đang xem danh sách tổng quan các lượt thi của một dũng sĩ, **When** click vào một thẻ lượt thi cụ thể, **Then** modal chuyển sang giao diện chi tiết hiển thị đầy đủ các chỉ số thống kê hiệu suất (điểm, vàng, thời gian, số câu đúng/sai, độ chính xác %, max streak, thời điểm thi). Giao diện TUYỆT ĐỐI KHÔNG để lộ nội dung câu hỏi và đáp án.
2. **Given** đang xem chi tiết một lượt thi cụ thể, **When** bấm nút quay lại ("Quay lại danh sách lượt thi") hoặc click breadcrumb, **Then** hệ thống quay lại danh sách tổng quan các lượt thi của dũng sĩ đó.
3. **Given** người dùng đang ở bất kỳ tầng nào (Bảng Vàng, Danh sách lượt thi, hoặc Chi tiết lượt thi), **When** bấm nút X đóng modal, **Then** modal đóng lại hoàn toàn và người dùng trở về màn hình đấu trường Arena bình thường.

---

### User Story 3 - Điều Hướng Nội Bộ Modal Mượt Mà & Breadcrumb Đa Cấp (Priority: P3)

Toàn bộ thao tác chuyển đổi giữa 3 cấp độ (Bảng Vàng -> Danh sách lượt thi -> Chi tiết lượt thi) diễn ra mượt mà ngay bên trong modal hiện tại (thay đổi view state), không mở thêm popup đè lên, không mở drawer bên ngoài và có breadcrumb rõ ràng: `Bảng Vàng` > `[Tên dũng sĩ]` > `Lượt thi #[N]`.

**Why this priority**: Đảm bảo UX tập trung, gọn gàng và tự nhiên nhất cho người dùng, tuân thủ nguyên tắc không gây xao nhãng hoặc chồng chéo nhiều layer cửa sổ.

**Independent Test**: Bấm từ Bảng Vàng vào 1 người chơi -> breadcrumb cập nhật `Bảng Vàng > [Tên dũng sĩ]`; bấm vào 1 lượt thi -> breadcrumb cập nhật `Bảng Vàng > [Tên dũng sĩ] > Lượt thi #1`. Bấm vào bất kỳ node nào trên breadcrumb để quay lại tầng tương ứng ngay lập tức.

**Acceptance Scenarios**:

1. **Given** người dùng di chuột vào một dũng sĩ trong danh sách bảng xếp hạng, **When** quan sát giao diện, **Then** hiển thị cursor con trỏ bấm, hiệu ứng highlight nhẹ và icon chỉ dẫn (chevron/mũi tên).
2. **Given** đang ở cấp xem chi tiết lượt thi (tầng 3), **When** người dùng click vào breadcrumb "[Tên dũng sĩ]", **Then** quay lại tầng 2; khi click vào "Bảng Vàng", **Then** quay lại tầng 1.

---

### Edge Cases

- **Dũng sĩ chưa hoàn thành lượt thi nào hợp lệ**: Hiển thị trạng thái trống (Empty state) thân thiện "Dũng sĩ chưa có lượt thi đấu nào được ghi nhận trong bài học này".
- **Người dùng bấm liên tục / mạng chậm khi tải dữ liệu**: Hiển thị skeleton loading thanh thoát, vô hiệu hóa click lặp lại để tránh duplicate request.
- **Trường hợp dũng sĩ thi rất nhiều lượt (e.g. > 20 lượt)**: Danh sách tổng quan có thanh cuộn mượt mà (scrollable view) có phân trang/giới hạn hợp lý để đảm bảo hiệu năng.
- **Dữ liệu lượt thi bị thiếu chỉ số combo/streak (dữ liệu cũ)**: Hiển thị giá trị mặc định hợp lý (ví dụ: `-` hoặc `0`) mà không gây lỗi giao diện.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống Bảng Vàng Dũng Sĩ PHẢI cho phép người dùng click vào bất kỳ hàng người chơi nào trong danh sách bảng xếp hạng bên dưới để mở xem lịch sử thi đấu của người đó trong bài học tương ứng (các bục Top 3 Podium bên trên giữ nguyên vai trò vinh danh trực quan, KHÔNG gán tương tác click).
- **FR-002**: Giao diện tổng quan lịch sử PHẢI hiển thị danh sách các lượt thi đấu của người dùng được chọn trong phạm vi bài học hiện tại, bao gồm tối thiểu: số thứ tự lượt thi, thời điểm nộp bài/thực hiện, tổng điểm đạt được, số vàng nhận được, và tổng thời gian làm bài (giây).
- **FR-003**: Hệ thống PHẢI cho phép người dùng click vào một lượt thi cụ thể trong danh sách tổng quan để xem thông tin chi tiết của lượt thi đó.
- **FR-004**: Giao diện chi tiết lượt thi PHẢI hiển thị các chỉ số thống kê chuyên sâu: Điểm số, thời gian làm bài, số vàng nhận được, số câu đúng / sai, độ chính xác (%), chuỗi câu đúng liên tiếp cao nhất (max streak), và thời điểm hoàn thành. Hệ thống KHÔNG hiển thị văn bản câu hỏi và đáp án nhằm bảo mật dữ liệu đề thi.
- **FR-005**: Giao diện modal PHẢI thực hiện chuyển đổi view nội bộ (in-modal view transition: `leaderboard` -> `match-history` -> `match-detail`) kèm thanh Breadcrumb và nút Back điều hướng ngược ở từng cấp.
- **FR-006**: Trạng thái mở modal và các tầng điều hướng PHẢI được quản lý mượt mà, không làm reload trang web và không làm mất tiến trình hoặc trạng thái phòng đấu trường hiện tại của người dùng.
- **FR-007**: Quyền riêng tư & bảo mật: Mọi người chơi tham gia trong phòng đấu trường đều có thể xem lịch sử các lượt thi và chỉ số thi đấu công khai trên Bảng Vàng của bài học đó.

### Key Entities

- **GameLeaderboardUserSummary**: Thực thể người chơi trên bảng vàng (User ID, Tên hiển thị, Avatar, Thứ hạng, Điểm cao nhất/tổng, Vàng, Lượt chơi).
- **UserMatchHistorySummary**: Thông tin tổng quan của một lượt thi đấu cụ thể (Match/Attempt ID, User ID, Lesson Slug, Thứ tự lượt thi, Điểm số, Vàng đạt được, Tổng thời gian làm bài, Thời điểm hoàn thành).
- **UserMatchMetricsDetail**: Chỉ số thống kê chi tiết của một lượt thi đấu (Match ID, User ID, Điểm số, Thời gian hoàn thành, Số vàng, Số câu đúng, Số câu sai, Tổng số câu hỏi, Tỷ lệ chính xác %, Chuỗi đúng cao nhất - Max Streak, Thời điểm nộp bài).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể chuyển từ Bảng Vàng sang xem danh sách tổng quan lịch sử của một người chơi trong vòng 1 cú nhấp chuột và thời gian phản hồi giao diện tức thì (< 300ms với dữ liệu đã nạp hoặc có skeleton).
- **SC-002**: Người dùng có thể xem chi tiết trọn vẹn các chỉ số thống kê chuyên sâu của một lượt thi đấu chỉ với 1 thao tác click tiếp theo từ danh sách tổng quan.
- **SC-003**: 100% các thành phần tương tác (bấm dũng sĩ, bấm lượt thi, bấm quay lại, breadcrumb) hoạt động trơn tru trên cả máy tính để bàn (Desktop) lẫn điện thoại di động (Mobile responsive).
- **SC-004**: 100% không để lộ nội dung văn bản đề bài câu hỏi và đáp án trắc nghiệm ở bất kỳ tầng hiển thị nào của tính năng xem lịch sử đấu trường.

## Assumptions

- Tính năng áp dụng cho bài học đấu trường Arena (đường dẫn `/lessons/[lesson-slug]/arena`).
- Lịch sử thi đấu hiển thị theo ngữ cảnh bài học hiện tại (các lượt đấu trường của dũng sĩ đó đối với bài học này).
- Dữ liệu các lượt thi và chỉ số thống kê (điểm, thời gian, vàng, số câu đúng/sai, max streak) được lấy từ các bản ghi attempt/session của người dùng trong bài học hiện tại.
- Việc xem lịch sử thi đấu trên Bảng Vàng mang tính công khai giữa các dũng sĩ cùng tham gia tranh tài trong đấu trường để học hỏi lẫn nhau.
