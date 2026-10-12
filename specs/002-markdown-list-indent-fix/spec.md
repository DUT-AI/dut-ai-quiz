# Feature Specification: Markdown List Indentation & Nested Content Rendering Fix

**Feature Branch**: `002-markdown-list-indent-fix`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Hiện tại có 1 vấn đề là các dòng thứ 2 kể từ khi xuống dòng nếu có gạch đầu dòng, nghĩa là ở trên gặp đầu dòng, sau đó tôi enter xuống dòng, tab để cùng khoảng cách với gạch đầu dòng trên thì bị lỗi style như hình, biết đây là đoạn text dưới db của tôi:
- **Khi nhãn thực tế $y = 1$:** Vế sau triệt tiêu, hàm mất mát chỉ còn:
    
    $$
    L = -\ln(\hat{y})
    $$
    
    ![image.png](https://minio.dutai.site/lms-prod/uploads/lessons/b26bf1cf-de51-4b25-a47b-3a7df4107040/image-11.png)
    
    - Nếu $\hat{y} \to 1$ (dự đoán đúng): $-\ln(1) = 0 \implies$ Mất mát bằng $0$.
    - Nếu $\hat{y} \to 0$ (dự đoán sai): $-\ln(0) \to +\infty \implies$ Mô hình bị phạt một khoản mất mát khổng lồ."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Render Nested Elements Inside List Items Without Breaking Into Code Blocks (Priority: P1)

As a student or teacher reading learning materials and quiz solutions, when a bullet item contains multi-line content (indented with tabs or 4 spaces) such as display math formulas (`$$...$$`), images (`![...](...)`), explanatory paragraphs, or child sub-bullets, I want them to render as proper rich elements within the list hierarchy rather than turning into pink/monospace raw code blocks.

**Why this priority**: This is the core defect reported. Teachers enter notes or formula derivations using indentation under bullet points, but currently images, formulas, and child list items are incorrectly converted to raw code text.

**Independent Test**: Can be tested by providing markdown text where a list item contains an indented math block, an image, and child bullets separated by line breaks, and verifying that:
1. The math block renders as centered KaTeX formula.
2. The image renders as a responsive image card with lightbox zoom capability.
3. The child bullets render as nested list items with proper indentation, not raw code.

**Acceptance Scenarios**:

1. **Given** a list item containing display math `$$...$$` indented by tabs or 4 spaces, **When** rendered, **Then** the math block renders correctly as KaTeX display math without breaking the surrounding list item hierarchy.
2. **Given** an image tag `![...](...)` indented under a list item, **When** rendered, **Then** the image renders as an `img` component (with interactive lightbox preview on click) instead of raw text inside a `<code>` badge.
3. **Given** child bullet points `- Nếu...` indented under a parent bullet point, **When** rendered, **Then** they render as nested `<ul>`/`<li>` elements with appropriate bullet styling and spacing.

---

### User Story 2 - Prevent Accidental 4-Space / Tab Indented Code Blocks (Priority: P2)

As a content author (teacher or quiz creator), when writing or pasting content into the platform where paragraphs, tables, or sub-bullets are indented using the Tab key or 4 spaces, I want the Markdown engine to treat them as formatted content rather than accidentally converting them into `<pre><code>` blocks, unless I explicitly use fenced code blocks (` ``` `).

**Why this priority**: In modern educational platforms, users frequently press Tab for indentation or alignment. Accidental 4-space code block generation is a legacy Markdown behavior that disrupts normal content writing. Fenced code blocks (` ```language `) provide the explicit standard for code.

**Independent Test**: Can be tested by submitting text indented by 4 spaces or a tab without code fences; the text must render as a normal paragraph or list item, not `<pre><code>`.

**Acceptance Scenarios**:

1. **Given** markdown text with lines indented by 4 spaces or a tab (`\t`), **When** not enclosed in fenced code blocks (```` ``` ````), **Then** the text is interpreted as standard Markdown content (preserving list nesting or paragraph indentation) instead of being turned into an indented code block.
2. **Given** markdown text with explicit fenced code blocks (```` ```python ```` or ``` ````), **When** rendered, **Then** it continues to render as an interactive syntax-highlighted code block.

---

### User Story 3 - Graceful Handling of Untagged / Generic Code Blocks (Priority: P3)

As a user viewing content that contains generic code blocks (fenced blocks without a language specified), I want them to render in a clean, consistent code container with proper font styling and copy button rather than collapsing into an inline pink badge.

**Why this priority**: Prevents visual glitches where block-level `<pre>` code is styled with inline `<code>` badges (pink text, tight padding).

**Independent Test**: Can be tested with a fenced code block without language identifier (```` ```\nhello world\n``` ````) to verify it renders as a clean multi-line code block.

**Acceptance Scenarios**:

1. **Given** a block-level code element without a specific language tag, **When** rendered, **Then** it renders using the full CodeBlock container or a formatted `<pre>` card with rounded borders and copy button.
2. **Given** genuine inline code (e.g. `` `$y = 1$` `` or `` `var` ``), **When** rendered, **Then** it retains its compact inline styling without block wrappers.

---

### Edge Cases

- **Mixed Tabs and Spaces**: Authors may mix tab characters (`\t`) with 2 or 4 spaces. The preprocessor and parser must normalize tab indentation consistently.
- **Consecutive Blank Lines Inside Lists**: When a blank line exists between a bullet item, a formula, and an image, the list context must be preserved rather than prematurely closing the list.
- **Math Formula Containing Newlines Inside Lists**: Indented multi-line LaTeX formulas (`\begin{aligned}...\end{aligned}`) inside lists must not lose their indentation or split list items.
- **Deeply Nested Lists (Level 2, 3+)**: Lists with multiple nesting levels containing math and text must maintain proper indentation offsets without breaking into code blocks.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST preserve list item context across indented content blocks (formulas, images, quotes, and child bullets).
- **FR-002**: System MUST adjust math preprocessing (`preprocessMath` in `apps/web/components/markdown.tsx`) so that display math blocks (`$$...$$`) inside indented list items maintain their relative indentation and do not insert top-level column-0 break markers (`\n\n$$\n...`).
- **FR-003**: System MUST configure the Markdown parser / preprocessor to disable or normalize 4-space / tab indented code blocks, ensuring explicit triple-backtick fences (```` ``` ````) are required for code blocks.
- **FR-004**: System MUST convert tab characters (`\t`) to standard 2- or 4-space indentation uniformly before parsing so that tab-indented sub-items align cleanly across browsers.
- **FR-005**: System MUST properly distinguish between block code (`<pre><code>`) and inline code (`<code>`), rendering untagged block code in a styled container rather than applying inline pink badge classes.
- **FR-006**: System MUST maintain full backward compatibility with existing KaTeX display math, Mermaid diagrams, images, and highlight chunks.

---

### Key Entities *(include if feature involves data)*

- **MarkdownContent**: The raw markdown string retrieved from the database or user input.
- **PreprocessedMarkdown**: The normalized markdown string with preserved list indentation, standardized tab spacing, and safe math markers ready for AST parsing.
- **MarkdownAST**: The abstract syntax tree generated by `remark` / `rehype`, containing structured list nodes (`list`, `listItem`), math nodes (`math`, `inlineMath`), and image nodes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the sample content provided by the user (bullet item + indented KaTeX formula + image + child bullets) renders visually as nested list elements without any pink monospace code badges.
- **SC-002**: All child bullets indented under a parent bullet render as nested list items (`<ul>` / `<li>`) with proper visual indentation.
- **SC-003**: Images indented under list items render as full clickable image previews that open in the lightbox modal.
- **SC-004**: No regressions in existing Markdown features: KaTeX formulas, Mermaid diagrams, code highlighting, tables, and search highlights continue to render identically.
- **SC-005**: Markdown rendering time is not increased by more than 5ms for standard lesson contents.

---

## Assumptions

- Fenced code blocks (triple backticks ```` ``` ````) are the preferred and intentional way for teachers and users to create code blocks in this application.
- The root cause is a combination of `preprocessMath` inserting unindented `\n\n$$\n` markers at column 0, and CommonMark interpreting 4-space/tab-indented lines as code blocks.
- All modifications are within the frontend Markdown rendering pipeline (`apps/web/components/markdown.tsx` and related utility functions), requiring no database migrations or content re-authoring in DB.
