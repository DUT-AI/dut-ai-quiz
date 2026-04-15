# Lược đồ cơ sở dữ liệu (PostgreSQL)

**Ràng buộc**: Dùng `user_id` (**int**) tham chiếu ngầm tới Auth — **không** tạo bảng `users` trong DB quiz.

---

## questions

| Cột | Kiểu | Ghi chú |
| --- | --- | --- |
| id | UUID, PK | |
| pool_type | Enum | `PRACTICE`, `EXAM` |
| content | Text | Markdown |
| options | JSONB | Ví dụ `[{"id":"A","text":"...","is_correct":true},...]` |
| solution | Text, nullable | Markdown |
| difficulty | Enum | `EASY`, `MEDIUM`, `HARD` |
| tags | String[] | |
| created_at | Timestamp | |

---

## exams

| Cột | Kiểu | Ghi chú |
| --- | --- | --- |
| id | UUID, PK | |
| title | String | |
| description | Text | |
| start_time | Timestamp, nullable | |
| end_time | Timestamp, nullable | |
| duration_minutes | Integer | |
| max_attempts | Integer | Mặc định 1 |
| is_published | Boolean | |
| created_by | **Integer (int)** | `user_id` giáo viên |

---

## exam_questions (N–N)

| Cột | Kiểu |
| --- | --- |
| exam_id | UUID, FK → exams |
| question_id | UUID, FK → questions |

(Thêm unique / thứ tự câu nếu cần: cột `position` integer.)

---

## attempts

| Cột | Kiểu | Ghi chú |
| --- | --- | --- |
| id | UUID, PK | |
| exam_id | UUID, FK | |
| user_id | Integer | Từ Auth |
| started_at | Timestamp | |
| completed_at | Timestamp, nullable | |
| score | Float, nullable | |
| status | Enum | `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |
| **tab_out_count** | **Integer** | **NOT NULL DEFAULT 0** — đồng bộ tab-out |
| **shuffle_seed** | Text/BigInt, nullable | Hoặc chỉ dùng snapshot (tuỳ implement) |
| **shuffle_snapshot** | JSONB, nullable | Thứ tự câu/options đã xáo — nếu không chỉ lưu seed |

`expires_at` (Timestamp): có thể lưu để so khớp hết giờ server-side (khuyến nghị).

---

## attempt_answers

| Cột | Kiểu |
| --- | --- |
| id | UUID, PK |
| attempt_id | UUID, FK |
| question_id | UUID, FK |
| selected_option_id | String |

---

## Tùy chọn audit

- **focus_events**: `attempt_id`, `client_event_id` (unique), `event`, `received_at` — nếu cần audit tab-out ngoài `tab_out_count`.

---

## Practice (theo API)

Có thể thêm bảng `practice_sessions` (tương tự snapshot/đáp án) khi triển khai endpoint practice — xem [api.md](api.md).
