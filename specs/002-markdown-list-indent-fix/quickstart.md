# Quickstart & Verification Guide: Markdown List Indentation Fix

**Branch**: `002-markdown-list-indent-fix` | **Date**: 2026-10-13 | **Spec**: [specs/002-markdown-list-indent-fix/spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/002-markdown-list-indent-fix/spec.md)

This guide documents the exact verification scenarios to test and confirm the resolution of the list indentation rendering issue.

---

## Scenario 1: Exact User Reported Content (Primary Test)

### Test Markdown Input:
```markdown
- **Khi nhãn thực tế $y = 1$:** Vế sau triệt tiêu, hàm mất mát chỉ còn:
    
    $$
    L = -\ln(\hat{y})
    $$
    
    ![image.png](https://minio.dutai.site/lms-prod/uploads/lessons/b26bf1cf-de51-4b25-a47b-3a7df4107040/image-11.png)
    
    - Nếu $\hat{y} \to 1$ (dự đoán đúng): $-\ln(1) = 0 \implies$ Mất mát bằng $0$.
    - Nếu $\hat{y} \to 0$ (dự đoán sai): $-\ln(0) \to +\infty \implies$ Mô hình bị phạt một khoản mất mát khổng lồ.
```

### Expected Visual Outcome:
1. **Bullet 1 Header**: `• Khi nhãn thực tế y = 1: Vế sau triệt tiêu, hàm mất mát chỉ còn:`
2. **Centered Formula**: $L = -\ln(\hat{y})$ rendered via KaTeX display math, cleanly centered under the bullet.
3. **Image Element**: An actual image element rendering `image-11.png` with rounded borders, clickable to open the fullscreen lightbox modal. (NO pink monospace code box).
4. **Nested Bullets**: Two distinct child bullet points (`- Nếu \hat{y} \to 1...` and `- Nếu \hat{y} \to 0...`) indented inside the parent list item with normal text styling. (NO pink monospace code box).

---

## Scenario 2: Deeply Nested Lists with Math and Tab Indentation

### Test Markdown Input:
```markdown
1. Bước đầu tiên:
	- Giai đoạn chuẩn bị:
		$$
		x_{norm} = \frac{x - \mu}{\sigma}
		$$
		- Chú ý: $\mu$ là giá trị trung bình, $\sigma$ là độ lệch chuẩn.
```

### Expected Visual Outcome:
- Numbered list item `1.` containing bullet item `Giai đoạn chuẩn bị`.
- KaTeX formula rendered within the nested level.
- Child bullet `Chú ý:` rendered cleanly as a third-level list item.

---

## Scenario 3: Fenced Code Block Still Works Normally

### Test Markdown Input:
```markdown
- Danh sách có chứa code thực tế:
    ```python
    def loss(y_true, y_pred):
        return -math.log(y_pred)
    ```
```

### Expected Visual Outcome:
- The fenced code block with `python` tag renders as an interactive `CodeBlock` component with syntax highlighting, line numbers, and a copy button.

---

## Scenario 4: Fenced Code Block Without Language Identifier

### Test Markdown Input:
```markdown
```
Plain untagged text or terminal log
Line 2
```
```

### Expected Visual Outcome:
- Renders as a multi-line code block with neutral dark/light styling, NOT as an inline pink badge.

---

## Automated Verification Steps

```bash
# 1. Typecheck the Next.js project
npm run type-check

# 2. Run Next.js linting
npm run lint

# 3. Test in local web server
make dev-web
# Open browser to a lesson or test page containing the test markdown
```
