# API Contract: Get User Arena Match History

## Endpoint
`GET /api/v1/game/{lesson_slug}/history/{user_id}`

### Description
Lấy danh sách lịch sử tất cả các lượt thi đấu Arena của một người dùng cụ thể trong một bài học (lesson_slug), bao gồm cả các chỉ số hiệu suất chi tiết cho từng lượt thi mà không để lộ văn bản câu hỏi và đáp án.

### Parameters
- Path Parameters:
  - `lesson_slug` (string, required): Slug của bài học (e.g. `tong-quan-ve-python`)
  - `user_id` (integer, required): ID của người dùng

### Response: 200 OK
Content-Type: `application/json`

```json
{
  "user_id": 12,
  "username": "Nguyen Van A",
  "avatar_url": "https://example.com/avatar.png",
  "lesson_slug": "tong-quan-ve-python",
  "total_attempts": 3,
  "highest_score": 120.0,
  "total_gold": 150,
  "history": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "attempt_number": 3,
      "started_at": "2026-10-19T14:20:00+07:00",
      "completed_at": "2026-10-19T14:23:15+07:00",
      "final_score": 120.0,
      "raw_points": 150,
      "gold": 60,
      "total_time_response": 45.5,
      "correct_count": 10,
      "total_questions": 10,
      "accuracy_percentage": 100.0,
      "max_streak": 10,
      "lives_left": 3,
      "is_completed": true
    },
    {
      "id": "7ca85f64-5717-4562-b3fc-2c963f66afb2",
      "attempt_number": 2,
      "started_at": "2026-10-19T10:10:00+07:00",
      "completed_at": "2026-10-19T10:12:40+07:00",
      "final_score": 95.0,
      "raw_points": 120,
      "gold": 45,
      "total_time_response": 52.0,
      "correct_count": 8,
      "total_questions": 10,
      "accuracy_percentage": 80.0,
      "max_streak": 5,
      "lives_left": 1,
      "is_completed": true
    }
  ]
}
```

### Error Responses
- `404 Not Found`: Khi bài học hoặc người dùng không tồn tại.
- `422 Unprocessable Entity`: Khi tham số đường dẫn không hợp lệ.
