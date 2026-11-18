# Feature Specification: Lesson Essay Questions & Reference Answers

**Feature Branch**: `018-lesson-essay-questions`

**Created**: 2026-11-18

**Status**: Ready for Planning

**Input**: User description: "Tôi muốn có 1 chức năng là câu hỏi cho mỗi lesson, 1 lesson sẽ có các câu hỏi tự luận và câu trả lời có sẵn để người dùng tư duy, người dùng có thể bấm vào nút hiển thị đáp án để hiển thị đáp án, nội dung câu hỏi và câu trả lời sẽ lưu dưới dạng md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learner Reflects on Essay Questions and Reveals Reference Answers (Priority: P1)

As a learner studying a lesson, I want to open a dedicated essay questions tab ("Tự luận" / "Câu hỏi tự luận") on the lesson navigation bar, read the lesson's open-ended questions with all reference answers hidden by default, think through each question independently, and click "Hiển thị đáp án" or "Ẩn đáp án" to toggle each reference answer when ready, so that I can actively practice critical thinking before checking the solution.

**Why this priority**: This delivers the core learning value requested—active recall and self-paced reflection directly accessible inside every lesson's tab flow.

**Independent Test**: Can be fully tested by opening a lesson that has at least two essay questions, clicking the dedicated essay questions tab on the lesson navigation bar, confirming all reference answers are initially hidden with no answer input boxes required, clicking "Hiển thị đáp án" on the first question to verify its formatted Markdown answer appears while the second remains hidden, and clicking "Ẩn đáp án" to hide it again.

**Acceptance Scenarios**:

1. **Given** a lesson that contains one or more essay questions,
   **When** a learner selects the dedicated essay questions tab on the lesson navigation bar,
   **Then** the tab highlights as active, all essay questions for that lesson are displayed in their configured order with formatted Markdown question content, and every reference answer is hidden by default.
2. **Given** a displayed essay question whose reference answer is hidden,
   **When** the learner clicks the "Hiển thị đáp án" button for that question,
   **Then** the corresponding reference answer expands smoothly with properly rendered Markdown formatting, the button label updates to "Ẩn đáp án", and all other questions retain their current visibility state.
3. **Given** a displayed essay question whose reference answer is visible,
   **When** the learner clicks the "Ẩn đáp án" button,
   **Then** the reference answer is concealed again and the button label reverts to "Hiển thị đáp án".
4. **Given** a learner studying on the essay questions tab,
   **When** the learner views any question card,
   **Then** the experience remains focused on reading, mental reflection, and toggling the reference answer without requiring any answer input form or submission workflow.
5. **Given** a lesson with zero essay questions,
   **When** a learner opens the dedicated essay questions tab,
   **Then** a clear, friendly empty state message is shown (e.g., "Chưa có câu hỏi tự luận cho bài học này") instead of a blank screen or error.

---

### User Story 2 - Educator Creates and Manages Markdown Essay Questions for a Lesson (Priority: P2)

As an educator or administrator managing lesson content, I want to add, edit, reorder, and delete individual Question–Answer pairs in Markdown format directly inside the lesson management page, with a live formatted preview for both question and reference answer, so that I can curate clear, well-structured reflection exercises.

**Why this priority**: Without authoring and management capabilities inside lesson management, educators cannot populate or maintain essay questions for lessons.

**Independent Test**: Can be fully tested by signing in as an educator, opening a lesson in lesson management, adding two Markdown Question–Answer pairs (with headings, code blocks, or lists in both question and answer), checking the live preview, reordering them, saving, and verifying the updated order and formatted content appear accurately in the learner's essay questions tab.

**Acceptance Scenarios**:

1. **Given** an educator editing or creating a lesson in lesson management,
   **When** the educator adds a new Question–Answer pair with Markdown question content and Markdown reference answer content and saves,
   **Then** the item is persisted and linked to that lesson in its specified display order.
2. **Given** an educator composing or editing an essay question pair in lesson management,
   **When** the educator enters Markdown syntax in the question or reference answer field,
   **Then** the educator can view a live rendered Markdown preview of both fields before saving.
3. **Given** an educator attempting to save an essay question with an empty (or whitespace-only) question prompt or reference answer,
   **When** the educator submits the changes,
   **Then** the system prevents saving and displays a clear inline validation message indicating both question and reference answer are required.
4. **Given** a lesson with multiple existing essay questions,
   **When** the educator modifies content, reorders items, or deletes an item and saves,
   **Then** the updated list is persisted and reflected immediately for learners viewing that lesson's essay questions tab.

---

### User Story 3 - Rich Markdown Formatting & Bulk Reveal Controls for Study Review (Priority: P3)

As a learner reviewing a lesson with many technical or conceptual essay questions, I want rich Markdown elements (code blocks, mathematical formulas, tables, lists, images, and diagrams) to render cleanly and to have quick controls to reveal or hide all answers at once, so that I can comfortably study complex material and review efficiently.

**Why this priority**: Enhances study efficiency and ensures technical subjects (programming, math, algorithms) display accurately, building cleanly on top of the P1 core flow.

**Independent Test**: Can be fully tested by opening a lesson's essay questions tab containing multiple Markdown-rich essay questions (with a code block, a math formula, a table, and a diagram), verifying clean rendering on desktop and mobile viewports, clicking "Hiện tất cả đáp án" to expand every answer at once, and clicking "Ẩn tất cả đáp án" to collapse all of them.

**Acceptance Scenarios**:

1. **Given** an essay question or reference answer containing headings, nested lists, tables, syntax-highlighted code snippets, mathematical expressions, or diagrams in Markdown,
   **When** the learner views the question or reveals its answer,
   **Then** all Markdown elements render legibly without breaking layout or causing unintended horizontal page overflow on desktop and mobile screens.
2. **Given** a lesson with two or more essay questions,
   **When** the learner clicks "Hiện tất cả đáp án",
   **Then** all reference answers in the lesson become visible simultaneously.
3. **Given** a lesson where one or more reference answers are currently visible,
   **When** the learner clicks "Ẩn tất cả đáp án",
   **Then** all reference answers in the lesson collapse back to the hidden state.

---

### Edge Cases

- **Empty question list**: A lesson with no essay questions displays a helpful empty state on the essay questions tab rather than an error or broken layout.
- **Unsafe or malformed Markdown**: Raw unsafe markup embedded inside Markdown content is neutralized before display; unclosed Markdown formatting blocks degrade gracefully without crashing the page.
- **Very long questions or answers**: Long multi-paragraph answers, wide tables, or long code lines scroll cleanly within their containers without overflowing mobile or desktop layouts.
- **Whitespace-only input**: Question or reference answer fields containing only spaces or blank lines are rejected by validation just like empty fields.
- **Lesson deletion**: Deleting a lesson automatically deletes all essay questions belonging to that lesson so no orphaned records remain.
- **Unauthorized management attempts**: Learners or unauthenticated users cannot create, edit, reorder, or delete essay questions; only authorized educators and administrators have management access.
- **Save failure resilience**: If saving fails due to a temporary connection issue, the educator sees a clear error notification and retains their unsaved Markdown edits in the editor so work is not lost.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow each lesson to contain zero, one, or multiple essay questions maintained in a defined display order.
- **FR-002**: System MUST store both the question content and the reference answer content of each essay question as Markdown text.
- **FR-003**: System MUST expose a dedicated essay questions tab (labeled "Tự luận" or "Câu hỏi tự luận") on the lesson navigation bar so learners can navigate directly to a lesson's essay questions alongside existing lesson tabs (Theory, Video, Practice, Arena, Homework).
- **FR-004**: System MUST hide every reference answer by default whenever a learner opens the lesson's essay questions tab so the learner can think before seeing the solution.
- **FR-005**: Learners MUST be able to independently toggle the visibility of each question's reference answer via a clear "Hiển thị đáp án" / "Ẩn đáp án" button.
- **FR-006**: Learner interaction MUST be read-and-reflect only (reading the question, thinking mentally, and toggling the reference answer visibility), with no answer text-entry form, submission, or grading workflow.
- **FR-007**: System MUST provide bulk controls ("Hiện tất cả đáp án" and "Ẩn tất cả đáp án") when a lesson contains two or more essay questions.
- **FR-008**: System MUST render both question and reference answer Markdown consistently with the platform's existing lesson Markdown rendering (supporting headings, emphasis, nested lists, tables, code blocks, mathematical expressions, images, and diagrams) while sanitizing unsafe content.
- **FR-009**: System MUST display a clear empty state message on the essay questions tab when a lesson has no essay questions.
- **FR-010**: System MUST allow authorized educators and administrators to create, edit, reorder, and delete individual Question–Answer pairs in Markdown directly within the lesson management interface, and MUST deny management actions to unauthorized users.
- **FR-011**: System MUST validate that every essay question has non-empty, non-whitespace Markdown content for both the question and the reference answer before allowing persistence.
- **FR-012**: System MUST provide a live rendered Markdown preview for both question and reference answer fields during authoring in lesson management so educators can verify formatting before saving.
- **FR-013**: System MUST automatically remove all associated essay questions whenever their parent lesson is deleted.

### Key Entities *(include if feature involves data)*

- **Lesson**: An existing instructional unit within a course/module that owns an ordered collection of zero or more essay questions.
- **Lesson Essay Question**: A self-study reflection item associated with a single lesson, characterized by:
  - Unique identifier
  - Parent lesson association
  - Question content (Markdown text, required)
  - Reference answer content (Markdown text, required)
  - Display order (non-negative integer controlling presentation sequence)
  - Creation and last-updated timestamps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Learners can reveal or hide any essay question's reference answer with a single click and see the transition complete in under 1 second with no page reload.
- **SC-002**: 100% of reference answers are hidden on initial load of the essay questions tab until explicitly revealed by the learner.
- **SC-003**: Educators can author, preview, and save a new Markdown Question–Answer pair for a lesson in under 2 minutes.
- **SC-004**: 100% of supported Markdown formatting elements (headings, lists, code blocks, tables, math expressions, and diagrams) render accurately without horizontal page overflow on both desktop and mobile viewports.
- **SC-005**: At least 90% of learners can locate the essay questions tab, read a prompt, and toggle its reference answer successfully on their first attempt without external guidance.

## Assumptions

- Existing user authentication and role permissions (learner vs. educator/administrator) govern who can view versus manage lesson essay questions.
- Any learner who has access to view a lesson is automatically permitted to view its essay questions tab and reveal reference answers.
- Markdown rendering for essay questions and reference answers reuses the same formatting capabilities already supported for lesson theory content across the platform.
- Answer visibility state (hidden vs. shown) is scoped to the current viewing session and resets to hidden when the learner leaves and returns to the lesson.
- Bulk Markdown file import is out of scope for v1; educators manage individual Question–Answer pairs directly in the lesson management interface.
- Learner answer input, submission, saving, and grading are out of scope for v1; the feature is strictly for self-paced reflection with toggleable reference answers.
