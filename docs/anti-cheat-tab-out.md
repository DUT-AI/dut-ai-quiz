# Tab-out & auto-submit (đồng bộ server)

**Phạm vi**: **Attempt kỳ thi** (`exam`). **Không** áp dụng cho **practice sessions** (trừ khi sau này mở rộng).

SRS gốc: lần 1 rời tab → modal cảnh báo (phải xác nhận); lần 2 → **auto-submit** và chấm theo đáp án đã làm.

---

## Nguồn sự thật

- Cột **`tab_out_count`** trên bảng **`attempts`** (integer ≥ 0).
- **`GET /api/v1/attempts/{attempt_id}`** trả về `tab_out_count` để sau khi F5 vẫn đồng bộ UI.

---

## Sự kiện phía client (khuyến nghị)

- Dùng [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API): `document.visibilityState` chuyển **`visible` → `hidden`** (đổi tab, thu nhỏ cửa sổ, …).
- **Không** dùng `window.blur` làm nguồn đếm chính (dễ dư tín hiệu).

Khi chuyển sang `hidden`, gọi:

`POST /api/v1/attempts/{attempt_id}/focus-events`

---

## Quy tắc server

Chỉ xử lý khi:

- `attempt.status === IN_PROGRESS`;
- chưa hết giờ (`now < expires_at` theo server);
- body hợp lệ (bên dưới).

Mỗi sự kiện **`visibility_hidden`** hợp lệ được chấp nhận:

1. **0 → 1**: response `action: WARN` — FE hiển thị modal; user xác nhận (thuần FE, không bắt buộc endpoint riêng cho MVP).
2. **1 → 2**: response `action: AUTO_SUBMITTED` — server chạy **cùng pipeline** với `POST .../submit` (chấm, `COMPLETED`).

**Không reset** `tab_out_count` khi user quay lại tab — hai “lần” = hai lần `visible` → `hidden` trong cùng attempt.

---

## Hợp đồng `POST .../focus-events`

**Body (JSON)**:

```json
{
  "event": "visibility_hidden",
  "client_event_id": "uuid-v4",
  "client_ts": "2026-04-15T12:34:56.789Z"
}
```

- **`client_event_id`**: bắt buộc — **idempotent**: cùng `attempt_id` + `client_event_id` chỉ tăng count tối đa một lần.
- **`client_ts`**: tùy chọn (audit); quyết định theo thời gian **server**.

**Response** (ví dụ):

```json
{
  "tab_out_count": 1,
  "action": "WARN"
}
```

Sau auto-submit:

```json
{
  "tab_out_count": 2,
  "action": "AUTO_SUBMITTED",
  "attempt": { "status": "COMPLETED", "score": 8.5, "completed_at": "..." }
}
```

Lỗi: `403` (không phải owner), `409`/`422` (đã nộp hoặc hết giờ).

---

## Chống spam

- FE: debounce — không gửi lặp nhiều request khi đang `hidden` (một UUID mỗi lần **vào** trạng thái hidden).
- Server: idempotency + có thể rate limit theo `attempt_id`.

---

## Hết giờ vs tab-out

- Hết `expires_at`: FE gọi **`POST .../submit`** (hoặc endpoint expire nếu tách). Nếu đã `COMPLETED`, request sau **idempotent** (trả trạng thái hiện có).
