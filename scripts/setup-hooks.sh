#!/usr/bin/env bash
# ==============================================================================
# Script kích hoạt Git Hooks cho dự án DUT AI Quiz
# ==============================================================================

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

echo "🔧 Đang thiết lập Git Pre-commit Hooks..."

# Cấp quyền thực thi cho hook script
chmod +x "$PROJECT_ROOT/.githooks/pre-commit"

# Cấu hình git sử dụng thư mục .githooks
git config core.hooksPath .githooks

# Sao chép vào .git/hooks/pre-commit để tương thích tối đa
if [ -d "$PROJECT_ROOT/.git/hooks" ]; then
    cp "$PROJECT_ROOT/.githooks/pre-commit" "$PROJECT_ROOT/.git/hooks/pre-commit"
    chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"
fi

echo "✅ Git Pre-commit Hooks đã được kích hoạt thành công!"
echo "Mỗi khi chạy 'git commit', hệ thống sẽ tự động kiểm tra chất lượng code của tất cả các module."
