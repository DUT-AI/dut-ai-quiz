# REST API — Quiz service

**Tiền tố**: `/api/v1`  
**Base URL**: do triển khai (ví dụ `https://api.quiz.dutai.site`).

**Phân quyền**:

- **Teacher**: `role_name === admin` (map từ manage).
- **Student**: `teammate` | `leader`.

---

## 1. Health & session

| Method | Path | Mô tả | Role |
| ------ | ---- | ----- | ---- |
| GET | `/api/v1/health` | Liveness/readiness | Public |
| GET | `/api/v1/me` | User hiện tại + `quiz_role` (`teacher` \| `student`) | Authenticated |

---

## 2. Câu hỏi (Question bank)

| Method | Path | Mô tả | Role |
| ------ | ---- | ----- | ---- |
| GET | `/api/v1/questions` | Danh sách + lọc (pool_type, difficulty, tags, search) | Teacher |
| POST | `/api/v1/questions` | Tạo | Teacher |
| GET | `/api/v1/questions/{question_id}` | Chi tiết | Teacher |
| PATCH | `/api/v1/questions/{question_id}` | Cập nhật | Teacher |
| DELETE | `/api/v1/questions/{question_id}` | Xóa | Teacher |

---

## 3. Kỳ thi (Exams)

| Method | Path | Mô tả | Role |
| ------ | ---- | ----- | ---- |
| GET | `/api/v1/exams` | Danh sách (Teacher: của mình; Student: published trong khung thời gian) | Teacher / Student |
| POST | `/api/v1/exams` | Tạo | Teacher |
| GET | `/api/v1/exams/{exam_id}` | Chi tiết | Teacher / Student |
| PATCH | `/api/v1/exams/{exam_id}` | Cập nhật | Teacher |
| DELETE | `/api/v1/exams/{exam_id}` | Xóa | Teacher |

### Gán câu vào đề

| Method | Path | Role |
| ------ | ---- | ---- |
| GET | `/api/v1/exams/{exam_id}/questions` | Teacher / Student |
| PUT | `/api/v1/exams/{exam_id}/questions` | Teacher |
| POST | `/api/v1/exams/{exam_id}/questions` | Teacher |
| DELETE | `/api/v1/exams/{exam_id}/questions/{question_id}` | Teacher |

---

## 4. Attempts (thi)

| Method | Path | Mô tả | Role |
| ------ | ---- | ----- | ---- |
| POST | `/api/v1/exams/{exam_id}/attempts` | Bắt đầu: lưu seed/snapshot, trả đề đã xáo + `expires_at` | Student |
| GET | `/api/v1/attempts/{attempt_id}` | Trạng thái, `tab_out_count`, snapshot khi đang làm | Student (owner) |
| PATCH | `/api/v1/attempts/{attempt_id}/answers` | Autosave đáp án | Student (owner) |
| POST | `/api/v1/attempts/{attempt_id}/submit` | Nộp bài + chấm | Student (owner) |
| POST | `/api/v1/attempts/{attempt_id}/focus-events` | Sự kiện tab-out — xem [anti-cheat-tab-out.md](anti-cheat-tab-out.md) | Student (owner) |
| GET | `/api/v1/exams/{exam_id}/attempts` | Danh sách attempt | Teacher |
| GET | `/api/v1/attempts/{attempt_id}/detail` | Chi tiết chấm/review | Teacher |

---

## 5. Practice

| Method | Path | Role |
| ------ | ---- | ---- |
| POST | `/api/v1/practice/sessions` | Student |
| GET | `/api/v1/practice/sessions/{session_id}` | Student (owner) |
| PATCH | `/api/v1/practice/sessions/{session_id}/answers` | Student (owner) |
| POST | `/api/v1/practice/sessions/{session_id}/finish` | Student (owner) |
| GET | `/api/v1/practice/history` | Student |

---

## 6. Leaderboard & lịch sử

| Method | Path | Mô tả | Role |
| ------ | ---- | ----- | ---- |
| GET | `/api/v1/exams/{exam_id}/leaderboard` | Theo **điểm cao nhất** mỗi user; **không** gồm practice | Teacher / Student |
| GET | `/api/v1/me/attempts` | Lịch sử làm bài thi | Student |

---

## 7. Upload

| Method | Path | Role |
| ------ | ---- | ---- |
| POST | `/api/v1/uploads/presign` | Teacher (MinIO / presigned — tùy MVP) |

---

OpenAPI có thể sinh từ FastAPI hoặc bổ sung file `openapi.yaml` sau.
