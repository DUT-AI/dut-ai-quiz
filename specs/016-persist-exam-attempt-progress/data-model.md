# Data Model: Resilient Exam Progress & Session Persistence

## Client-Side Storage Contracts

### 1. LocalStorage Progress Entity

**Key**: `exam_progress_{attemptId}`  
**Scope**: Browser LocalStorage (persists across page reloads, tab closing, crashes)

```typescript
interface LocalExamProgress {
  attemptId: string;
  currentIndex: number;
  answers: Record<string, string | null>; // questionId -> selectedOptionId
  lastUpdated: number; // Date.now() timestamp
}
```

**Lifecycle**:
- Created/Updated on every option selection or question navigation.
- Loaded on attempt page initialization (`useExamSession` + `TestEnvironmentPage`).
- Deleted upon successful final submission (`COMPLETED`) or explicit attempt discard.

---

### 2. SessionStorage Reload Grace Flag

**Key**: `exam_reload_grace_{attemptId}`  
**Scope**: Browser SessionStorage (tab-scoped, persists across F5 / page reloads within the same tab)

```typescript
interface ReloadGraceInfo {
  timestamp: number; // Date.now() when beforeunload fired
}
```

**Lifecycle**:
- Set when `beforeunload` fires in `useAntiCheat` / `useExamSession`.
- Checked on `useAntiCheat` mount:
  - If `Date.now() - timestamp < 10000` (10s), suppress violation tracking and establish a cooldown window.
  - Removed once consumed or expired.

---

## Server Data Model
No database migration required. Reuses existing `attempt_answers` table via `PATCH /api/v1/attempts/{id}/answers`.
