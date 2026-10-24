# Interface & Schema Contracts: Game Answer Verification & Timer Synchronization

## 1. REST API Contracts

### A. Lấy phiên chơi đang hoạt động: `GET /api/v1/game/sessions/active`

- **Headers**:
  - `Authorization: Bearer <token>`
- **Query Parameters**:
  - `lesson_slug: string` (slug của bài học cần kiểm tra phiên chơi)
- **Response Status**: `200 OK` (hoặc `404 Not Found` nếu không có phiên dở dang)
- **Response Schema**:
  ```json
  {
    "session_id": "1dd1260e-2433-4932-9653-761be9875186",
    "snapshot": {
      "lesson_slug": "python-numpy-fundamentals",
      "questions": [
        {
          "id": "0dd26247-cef1-4c39-ae9a-8875f7db8e8d",
          "tier": 1,
          "content": "Khi mask là mảng bool, đoạn code sau in gì?...",
          "is_boss": false,
          "options": [
            { "id": "fad970cc", "text": "[-1, 0, 2]", "fixed": false },
            { "id": "e08ab9f2", "text": "[0, 0, 2]", "fixed": false },
            { "id": "35ad3336", "text": "[2]", "fixed": false },
            { "id": "d6d8a1bc", "text": "Lỗi vì mask khác shape", "fixed": false }
          ],
          "time_limit": 60,
          "time_response": 0.0
        }
      ],
      "gamification": {
        "gold": 90,
        "lives": 3,
        "points": 40,
        "last_question_index": 3,
        "current_question_started_at": "2026-10-24T17:15:00.000000+07:00"
      }
    }
  }
  ```
- **Cam kết hành vi (Behavior Contract)**:
  - Nếu `current_question_started_at is None` hoặc bị quá hạn do phiên cũ để quên, server tự động đặt lại `current_question_started_at` bằng thời điểm hiện tại và lưu vào DB trước khi trả về.

---

### B. Nộp câu trả lời: `PATCH /api/v1/game/sessions/{session_id}/answers`

- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters**:
  - `session_id: UUID`
- **Request Body (`GamificationAnswerPatchIn`)**:
  ```json
  {
    "question_id": "0dd26247-cef1-4c39-ae9a-8875f7db8e8d",
    "option_id": "35ad3336",
    "time_response": 14.5,
    "activate_shield": false,
    "activate_double_points": false
  }
  ```
- **Response Schema (`GamificationAnswerResultOut`)**:
  ```json
  {
    "is_correct": true,
    "points_gained": 15,
    "coins_gained": 30,
    "updated_gamification": {
      "gold": 120,
      "lives": 3,
      "points": 55,
      "last_question_index": 4,
      "current_question_started_at": null
    },
    "is_game_over": false,
    "correct_option_id": "35ad3336"
  }
  ```
- **Cam kết hành vi**:
  - `current_question_started_at` trong `updated_gamification` được set về `null` (None) sau khi câu hỏi được nộp.

---

## 2. Frontend Component Contract: `GameQuestionCard`

### Props Contract:

```typescript
export interface GameQuestionCardProps {
  currentQuestion: QuestionSnapshot;
  currentIdx: number;
  totalQuestions: number;
  stage: number;
  doubleActive: boolean;
  selectedOptionId: string | null;
  isAnswered: boolean;
  isSelectedCorrect: boolean;
  correctOptionId?: string | null;
  hiddenOptions: string[];
  onSubmitAnswer: (optionId: string) => void;
  onNextQuestion: () => void;
}
```

### Quy tắc hiển thị đáp án (`btnStyles`):

| Trường hợp | Điều kiện | Kiểu hiển thị |
|------------|-----------|---------------|
| Đáp án người dùng chọn và Đúng | `isAnswered && isSelected && isSelectedCorrect` | Viền xanh lá đậm `border-emerald-500 bg-emerald-100`, bóng xanh lá |
| Đáp án người dùng chọn và Sai | `isAnswered && isSelected && !isSelectedCorrect` | Viền đỏ nổi bật `border-rose-500 bg-rose-100`, bóng đỏ |
| Đáp án đúng chuẩn khi người dùng chọn sai | `isAnswered && !isSelected && option.id === correctOptionId` | Viền xanh lá `border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300` |
| Các đáp án sai khác | `isAnswered && !isSelected && option.id !== correctOptionId` | Làm mờ `opacity-60 text-zinc-700 pointer-events-none` |
