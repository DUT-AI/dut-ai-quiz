# Quickstart Validation Guide: Refactored Game Architecture

**Feature**: `004-refactor-game-container`
**Date**: 2026-10-24

This guide defines end-to-end verification scenarios to guarantee zero regressions after refactoring `game-container.tsx` into modular hooks and subcomponents.

---

## Prerequisites

- Frontend dev server running (`make web-dev` or `npm run dev` in `apps/web`) on `http://localhost:3000`.
- Backend server running (`make backend-dev` in `apps/api`) on `http://localhost:8000`.

---

## Validation Scenarios

### Scenario 1: Match Start & Rehydration
1. Navigate to `/lessons/[lesson_slug]/game` in the browser.
2. **Expected Outcome**:
   - Loading spinner appears with message "ĐANG KHỞI TẠO ĐẤU TRƯỜNG...".
   - Active session or new session snapshot loads without errors.
   - Screen transitions to `playing`: Header HUD shows stage progress dots, score is 0 PTS.
   - Left column shows Slime/Golem/Demon with 5/5 hearts, Player with 5/5 hearts.
   - Right column shows Question 1 with options A, B, C, D.

---

### Scenario 2: Answering Correctly & Combat Animation
1. Select the correct option for Question 1.
2. **Expected Outcome**:
   - The selected option highlights with green border & emerald background.
   - Slime takes damage (player attacks, boss HP decreases by 1).
   - Score increases based on remaining time.
   - "TIẾP TỤC HÀNH TRÌNH" button appears, and the page smoothly scrolls so the button is in clear view.
   - Clicking "TIẾP TỤC HÀNH TRÌNH" moves to Question 2, resetting option highlights and scrolling back to top.

---

### Scenario 3: Answering Incorrectly & Damage Taken
1. Select an incorrect option.
2. **Expected Outcome**:
   - The selected option highlights with rose red border.
   - Boss attacks, player loses 1 heart with heart shake animation.
   - Red screen shake activates briefly.
   - Clicking "TIẾP TỤC HÀNH TRÌNH" advances to the next question.

---

### Scenario 4: Item Power-ups Usage
1. **50-50 (Kính Hiển Vi)**:
   - Click Microscope (50 gold).
   - Exactly 2 incorrect options become dimmed and unclickable.
2. **Freeze (Đóng Băng)**:
   - Click Freeze (40 gold).
   - Timer stops ticking and receives +30 seconds.
3. **Double Points (Nhân Phẩm)**:
   - Click Double Points (100 gold).
   - Badge "NHÂN PHẨM X2 ĐIỂM KÍCH HOẠT" bounces on top of Question Card.
   - Correct answer yields double points.
4. **Shield (Khiên Hộ Mệnh)**:
   - Click Shield (80 gold).
   - Answering incorrectly blocks damage (Player hearts do not decrease).

---

### Scenario 5: Timeout Trigger
1. Wait for countdown timer to reach 0:00 without clicking any option.
2. **Expected Outcome**:
   - `handleTimeOut` triggers automatically.
   - Player loses 1 heart as if answered incorrectly.
   - "TIẾP TỤC HÀNH TRÌNH" button appears.

---

### Scenario 6: Anti-Cheat Violation
1. During an active question, switch to another browser tab or minimize window.
2. Switch back to the quiz tab.
3. **Expected Outcome**:
   - Anti-cheat toast warning pops up.
   - Player is penalized according to lesson anti-cheat configuration.

---

### Scenario 7: Victory, Defeat & Rematch
1. Reach 0 player hearts OR complete all tier questions.
2. **Expected Outcome**:
   - Screen switches to `GameResult` view showing final PTS, gold earned, and highest question reached.
   - Clicking "CHƠI LẠI" (Retry) initiates a fresh session, clears all states, and returns to Question 1 in the playing arena.
