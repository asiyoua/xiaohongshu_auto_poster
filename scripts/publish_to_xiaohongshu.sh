#!/usr/bin/env bash
# -*- coding: utf-8 -*-
# bxz-xhs 自动发布脚本
# 用法: ./publish_to_xiaohongshu.sh <session_dir>
# 示例: ./publish_to_xiaohongshu.sh ~/Myxhs/maori-rock-carving

set -e

SESSION_DIR="${1}"
API_URL="${XHS_API_URL:-http://localhost:18060}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}ℹ${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# 检查参数
if [[ -z "$SESSION_DIR" ]]; then
    log_error "用法: $0 <session_dir>"
    echo "示例: $0 ~/Myxhs/maori-rock-carving"
    exit 1
fi

# 解析 outline.md 提取标题和内容
OUTLINE_FILE="$SESSION_DIR/outline.md"
if [[ ! -f "$OUTLINE_FILE" ]]; then
    log_error "找不到 outline.md: $OUTLINE_FILE"
    exit 1
fi

# 提取标题（P1 的 Hook）
TITLE=$(grep -A 3 "## P1 Cover" "$OUTLINE_FILE" | grep "Hook:" | sed 's/.*Hook: "\(.*\)".*/\1/' | head -1)
if [[ -z "$TITLE" ]]; then
    # 备选方案：使用文件名或第一个标题
    TITLE=$(head -5 "$OUTLINE_FILE" | grep -E "^#+ " | head -1 | sed 's/^#+ //')
fi

# 构建小红书内容（从各页面提取关键信息）
CONTENT=""
while IFS= read -r line; do
    if [[ "$line" =~ ^##\ P[0-9]+ ]]; then
        # 新页面开始
        PAGE_TYPE=$(echo "$line" | grep -o "Type: [a-z-]*" | cut -d: -f2 | xargs)
        PAGE_MSG=$(echo "$line" | grep -o "Message: .*" | cut -d: -f2- | xargs)
        [[ -n "$PAGE_MSG" ]] && CONTENT="${CONTENT}${PAGE_MSG}"$'\n\n'
    fi
done < "$OUTLINE_FILE"

# 如果没有提取到内容，使用原始内容
if [[ -z "$CONTENT" ]]; then
    CONTENT=$(cat "$OUTLINE_FILE")
fi

# 限制标题长度（20字）
TITLE="${TITLE:0:20}"

# 限制内容长度（1000字）
CONTENT="${CONTENT:0:1000}"

# 查找生成的图片
IMAGES=()
for img in "$SESSION_DIR"/*.png; do
    if [[ -f "$img" ]]; then
        # 需要转换为容器内路径 /app/images/xxx.png
        # xiaohongshu-mcp 的 images volume 映射到 ~/xiaohongshu-mcp/images
        BASENAME=$(basename "$img")
        IMAGES+=("/app/images/$BASENAME")

        # 复制图片到 xiaohongshu-mcp images 目录
        cp "$img" ~/xiaohongshu-mcp/images/
    fi
done

if [[ ${#IMAGES[@]} -eq 0 ]]; then
    log_error "在 $SESSION_DIR 中没有找到图片文件"
    exit 1
fi

log_info "准备发布到小红书..."
echo "  标题: $TITLE"
echo "  内容长度: ${#CONTENT} 字"
echo "  图片数量: ${#IMAGES[@]}"

# 检查服务状态
log_info "检查 xiaohongshu-mcp 服务..."
if ! curl -s "$API_URL" > /dev/null 2>&1; then
    log_error "xiaohongshu-mcp 服务未运行"
    echo "启动命令: cd ~/xiaohongshu-mcp && docker compose up -d"
    exit 1
fi

# 发布
log_info "正在发布..."
RESPONSE=$(curl -s -X POST "$API_URL/api/v1/publish" \
    -H "Content-Type: application/json" \
    -d "{
        \"title\": \"$TITLE\",
        \"content\": \"$CONTENT\",
        \"images\": $(printf '%s\n' "${IMAGES[@]}" | jq -R . | jq -s -c .),
        \"tags\": [\"AI\", \"科技\"]
    }")

# 检查结果
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    log_info "✓ 发布成功！"
    echo "$RESPONSE" | jq .
else
    log_error "发布失败"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    exit 1
fi
