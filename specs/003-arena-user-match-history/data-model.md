# Phase 1 Data Model: Arena User Match History

**Feature**: Arena User Match History (`003-arena-user-match-history`)
**Status**: Ready

## 1. Entities & Data Shapes

### Entity 1: UserMatchHistoryItem (DTO / Out Schema)
Represents a single completed match/attempt of a user in an Arena lesson.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | ID của game session |
| `attempt_number` | `int` | Số thứ tự lần thi (1, 2, 3...) |
| `started_at` | `datetime` | Thời điểm bắt đầu lượt thi |
| `completed_at` | `datetime` | Thời điểm hoàn thành lượt thi |
| `final_score` | `float` | Điểm số sau hệ số suy giảm (final score) |
| `raw_points` | `int` | Điểm số gốc trước khi tính decay |
| `gold` | `int` | Số vàng kiếm được trong lượt này |
| `total_time_response` | `float` | Tổng thời gian trả lời câu hỏi (giây) |
| `correct_count` | `int` | Số câu trả lời đúng |
| `total_questions` | `int` | Tổng số câu hỏi trong bài thi |
| `accuracy_percentage` | `float` | Độ chính xác (%): `(correct_count / total_questions) * 100` |
| `max_streak` | `int` | Chuỗi câu đúng liên tiếp cao nhất |
| `lives_left` | `int` | Số mạng còn lại khi kết thúc |
| `is_completed` | `bool` | Hoàn thành hết câu hỏi hay bị game over giữa chừng |

### Entity 2: UserMatchHistoryResponse (DTO / Out Schema)
Container response trả về danh sách lịch sử và thông tin tóm tắt người chơi.

```python
class UserMatchHistoryResponse(BaseModel):
    user_id: int
    username: str | None
    avatar_url: str | None
    lesson_slug: str
    total_attempts: int
    highest_score: float
    total_gold: int
    history: list[UserMatchHistoryItem]
```

## 2. Frontend State Machine (Modal View)

```text
[ LEADERBOARD ]
   │
   ├─► Click hàng dũng sĩ trong danh sách
   ▼
[ MATCH_HISTORY ] (Breadcrumb: Bảng Vàng > [Tên dũng sĩ])
   │
   ├─► Click quay lại hoặc Click [Bảng Vàng] ──► [ LEADERBOARD ]
   │
   ├─► Click một thẻ lượt thi cụ thể
   ▼
[ MATCH_METRICS ] (Breadcrumb: Bảng Vàng > [Tên dũng sĩ] > Lượt thi #N)
   │
   ├─► Click quay lại hoặc Click [Tên dũng sĩ] ──► [ MATCH_HISTORY ]
   └─► Click [Bảng Vàng] ────────────────────────► [ LEADERBOARD ]
```

## 3. Validation & Invariants
- `accuracy_percentage`: Giới hạn trong khoảng `[0.0, 100.0]`.
- Không có bất kỳ trường nào chứa nội dung text câu hỏi (`QuestionSnapshot.content`), đáp án (`options`), hoặc ID đáp án đúng được chuyển về phía client trong API này.
- `lesson_slug` được chuẩn hóa URL decoded string.
