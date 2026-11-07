# Feature Specification: Manage & Delete Attempt Focus Violations

**Feature Branch**: `017-manage-focus-violations`

**Created**: 2026-11-07

**Status**: Ready for Planning

**Input**: User request: "Tôi muốn có thể xóa event gian lận ở đây" (kèm ảnh chụp phần Nhật ký vi phạm quy chế thi trên trang chi tiết lượt thi của học sinh).
- Clarification Decisions:
  1. **Quan hệ giữa Focus Event và `tab_out_count`**: Mỗi khi có một `focus_event` vi phạm (`mouse_leave`, `window_blur`, v.v.), hệ thống tăng `tab_out_count += 1`. Do đó, khi xóa một sự kiện vi phạm, hệ thống **bắt buộc phải đồng bộ giảm `tab_out_count`** (nếu `tab_out_count > 0`), hoặc khi "Xóa tất cả vi phạm" thì reset `tab_out_count = 0`.
  2. **Thao tác UI**: Hỗ trợ cả 2 hình thức:
     - Nút xóa từng sự kiện riêng lẻ (biểu tượng thùng rác ở mỗi dòng vi phạm).
     - Nút "Xóa tất cả vi phạm" ở thanh tiêu đề để giáo viên xóa nhanh toàn bộ bản ghi vi phạm của lượt thi đó.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete Individual Focus Event (Priority: P1)

As an Educator/Admin reviewing a student's attempt, when I inspect the Focus Violations tab and identify that a specific violation was accidental (e.g. accidental mouse leave or trackpad gesture), I want to delete that specific violation event so that it is removed from the timeline and the attempt's `tab_out_count` is decremented by 1.

**Why this priority**: Empowers teachers to forgive minor false-positive violations on a case-by-case basis.

**Independent Test**: Can be tested by opening an attempt with 2 violations, clicking the trash icon on 1 violation, confirming the prompt, and verifying that the timeline now shows 1 violation and the attempt's `tab_out_count` is reduced from 2 to 1.

**Acceptance Scenarios**:

1. **Given** an attempt with focus events, **When** the educator clicks the delete button on an event and confirms, **Then** the event is deleted from database and the attempt's `tab_out_count` decreases by 1 (clamped at minimum 0).
2. **Given** an event deletion succeeds, **When** the list refreshes, **Then** the UI reflects the updated event count and the attempt summary displays the updated `tab_out_count`.

---

### User Story 2 - Clear All Focus Violations for Attempt (Priority: P2)

As an Educator/Admin, when I know an entire attempt had system false-alarms or the student was excused for technical issues, I want to click a single "Xóa tất cả vi phạm" button so that all focus events for this attempt are wiped out and `tab_out_count` is reset to 0 in one click.

**Why this priority**: Saves teacher time when an attempt suffered multiple false-alarm logs due to network/browser freezes.

**Independent Test**: Can be tested by clicking "Xóa tất cả vi phạm", confirming the dialog, and seeing the timeline immediately switch to the green success state ("Không ghi nhận bất kỳ vi phạm...").

**Acceptance Scenarios**:

1. **Given** an attempt with multiple focus events, **When** the educator clicks "Xóa tất cả vi phạm" and confirms, **Then** all `focus_events` for this attempt are deleted and `tab_out_count` is updated to 0.
2. **Given** no events remain, **When** UI updates, **Then** the green "Không ghi nhận bất kỳ vi phạm nào" banner is displayed.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide API endpoint `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}/focus-events/{event_id}` restricted to Educators/Admins.
- **FR-002**: On deleting a single focus event, system MUST delete the `focus_event` row and decrement `attempts.tab_out_count` by 1 (minimum 0).
- **FR-003**: System MUST provide API endpoint `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}/focus-events` to clear all focus events for that attempt and set `tab_out_count = 0`.
- **FR-004**: Frontend timeline component MUST render a delete button for each item and a "Xóa tất cả" button if events exist.
- **FR-005**: Both actions MUST require explicit confirmation (dialog/confirm) to prevent accidental deletions.

---

## Key Entities

- **FocusEvent**: Individual violation record (`id`, `attempt_id`, `event`, `received_at`).
- **Attempt**: The test attempt record containing `tab_out_count`.
