# Research & Technical Decisions: Sửa lỗi chấm sai đáp án trong Game Arena

## Context

Người dùng phản ánh: khi chơi game, câu hỏi được soạn chuẩn xác trong hệ thống và người dùng nhấp chọn đáp án đúng (ví dụ câu hỏi NumPy chọn đáp án C `[2]`), nhưng hệ thống lại hiển thị viền đỏ báo sai, trừ mạng và không tính điểm.

---

## Nghiên cứu 1: Phân tích nguyên nhân gốc (Root Cause Analysis)

### Phát hiện từ cơ sở dữ liệu thực tế (`quizdb_prod` & `quizdb_dev`)

1. **Dữ liệu ngân hàng câu hỏi**:
   - Câu hỏi `0dd26247-cef1-4c39-ae9a-8875f7db8e8d`:
     - Option A (`fad970cc`): `[-1, 0, 2]` $\rightarrow$ `is_correct: false`
     - Option B (`e08ab9f2`): `[0, 0, 2]` $\rightarrow$ `is_correct: false`
     - **Option C (`35ad3336`): `[2]` $\rightarrow$ `is_correct: true`**
     - Option D (`d6d8a1bc`): `Lỗi vì mask khác shape` $\rightarrow$ `is_correct: false`
   - Dữ liệu câu hỏi được lưu hoàn toàn chính xác.

2. **Dữ liệu phiên chơi của người dùng**:
   - Trong phiên chơi thực tế `d3336bac-18f2-4869-8383-efa798103ce0` và `b7d5a6db-2aeb-49bc-81c6-35bb176d69e9`:
     - Mốc `current_question_started_at` trong snapshot chênh lệch hàng nghìn giây so với thời điểm nộp bài.
     - Giá trị `time_response` của các câu trả lời bị ép thành đúng bằng `time_limit` (60.0s).

### Cơ chế gây lỗi trong code backend: `patch_game_answer.py`

Tại dòng 75–86 của `apps/api/app/application/use_cases/game/patch_game_answer.py`:
```python
is_correct = str(payload.option_id) == str(correct_opt_id)

# Anti-cheat check: allow 10 seconds buffer for network latency/UI animations
if state.current_question_started_at:
    started_at = datetime.fromisoformat(state.current_question_started_at)
    elapsed = (now_ict() - started_at).total_seconds()
    time_limit = current_q.time_limit

    if elapsed > time_limit + 10.0:
        is_correct = False  # <--- GHI ĐÈ THÀNH SAI!
        payload.time_response = float(time_limit)
```

**Nguyên nhân kích hoạt sai:**
1. **Lệch pha khi chuyển câu (Transition Delay)**:
   - Khi người chơi nộp câu $N$, hàm `patch_game_answer` gọi `state.reset_question_timer()`, gán `current_question_started_at = now_ict()`.
   - Tuy nhiên, người chơi chưa bước vào câu $N+1$ ngay mà vẫn ở màn hình câu $N$ để xem hoạt ảnh đánh boss, đọc câu hỏi cũ, hoặc nghỉ ngơi.
   - Nếu người chơi dừng lại > 20 giây ở màn hình câu $N$, bộ đếm câu $N+1$ trên server đã cạn sạch. Đến khi người chơi bấm "TIẾP TỤC HÀNH TRÌNH", dù họ trả lời chỉ trong 2 giây trên giao diện, tổng `elapsed` trên server vẫn vượt quá `time_limit + 10s`, khiến đáp án đúng bị ép thành **Sai**.
2. **Khôi phục phiên chơi cũ (Session Resume)**:
   - Khi tải lại trang (F5) hoặc vào lại một phiên chơi dang dở, `GET /sessions/active` trả về snapshot cũ mà không đặt lại `current_question_started_at`.
   - Giá trị `current_question_started_at` có thể từ 10 phút trước hoặc 1 ngày trước $\rightarrow$ câu hỏi kế tiếp luôn luôn bị tính là timeout.

---

## Quyết định Thiết kế

### Quyết định 1: Vòng đời kích hoạt bộ đếm thời gian câu hỏi (Timer Lifecycle)

- **Đề xuất**:
  1. Khi câu $N$ kết thúc trong `patch_game_answer.py`, **KHÔNG** bắt đầu đếm giờ ngay cho câu $N+1$. Đặt `state.current_question_started_at = None`.
  2. Khi người chơi nhấn "TIẾP TỤC HÀNH TRÌNH" trên giao diện, ứng dụng gọi `refetchActiveSession()` (`GET /api/v1/game/sessions/active`).
  3. Phía server trong `get_active_game_session`:
     - Nếu `state.current_question_started_at is None`: đây là thời điểm câu hỏi mới thực sự được giao cho client $\rightarrow$ gán `state.current_question_started_at = now_ict().isoformat()` và lưu lại phiên.
     - Nếu người chơi tải lại trang (F5) và câu hỏi hiện tại chưa được nộp: nếu mốc `current_question_started_at` đã cũ hơn `time_limit + 10s` (phiên dở dang từ trước), tự động làm mới mốc thời gian thành `now_ict().isoformat()` để người chơi bắt đầu làm câu hỏi đó một cách công bằng.
  4. Khi ván chơi mới bắt đầu (`start_game_session.py`), gán `state.current_question_started_at = now_ict().isoformat()` cho câu hỏi 0.

- **So sánh phương án**:
  | Phương án | Ưu điểm | Nhược điểm | Kết luận |
  |-----------|---------|------------|----------|
  | A. Tăng dung sai timeout lên 60s | Đơn giản | Vẫn bị lỗi nếu người dùng dừng lại lâu hoặc resume phiên cũ; làm yếu tính năng chống gian lận | Bị loại |
  | B. Bỏ hoàn toàn kiểm tra server timeout | Không bao giờ bị chấm sai oan | Mất cơ chế chống gian lận can thiệp API trực tiếp | Bị loại |
  | **C. Lazy Timer: Kích hoạt khi fetch active session / chuyển câu** | **Chính xác 100%, bảo toàn tính năng chống gian lận, hỗ trợ resume hoàn hảo** | Cần lưu session khi fetch active session nếu timer chưa được set | **Được chọn** |

---

### Quyết định 2: Hiển thị đáp án đúng trên Frontend khi người dùng trả lời sai

- **Vấn đề**: Khi người dùng chọn sai, `GameQuestionCard.tsx` chỉ tô đỏ đáp án người dùng chọn, các đáp án còn lại đều bị mờ đi (`opacity-60`). Người chơi không biết đáp án nào mới là đáp án đúng.
- **Giải pháp**:
  - API `patch_game_answer` đã trả về trường `correct_option_id: str(correct_opt_id)`.
  - Hook `use-game-turn.ts` đã lưu `correctOptionId`.
  - `GameQuestionCard.tsx` đã nhận prop `correctOptionId`.
  - **Cập nhật styling trong `GameQuestionCard`**:
    - Khi `isAnswered = true`:
      - Nếu `option.id === selectedOptionId`: tô viền xanh nếu đúng (`border-emerald-500 bg-emerald-100`), tô viền đỏ nếu sai (`border-rose-500 bg-rose-100`).
      - Nếu `option.id === correctOptionId && !isSelectedCorrect`: tô viền xanh lá nổi bật (`border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300`) kèm biểu tượng checkmark để người chơi nhận biết đáp án đúng.
      - Các đáp án còn lại: làm mờ vừa phải để không gây xao nhãng.

---

### Quyết định 3: Tối ưu hóa việc gửi Option ID từ Client

- Đảm bảo trong `GameQuestionCard`, nút bấm luôn truyền đúng `option.id` vào `onSubmitAnswer(option.id)`.
- Không sử dụng chỉ số mảng (index 0, 1, 2, 3) để ánh xạ đáp án, luôn dùng chuỗi UUID/ID duy nhất của từng option.
