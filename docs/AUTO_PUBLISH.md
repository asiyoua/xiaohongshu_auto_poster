# 小红书自动发布功能

## 概述

bxz-xhs skill 生成图片后，可自动发布到小红书，无需手动操作。

## 工作流程

```
bxz-xhs 生成图片
        ↓
询问用户：是否自动发布？
        ↓
[Yes] → auto_publish.py
        ↓
提取标题、内容
        ↓
发布到 xiaohongshu-mcp API
        ↓
小红书平台
```

## 脚本位置

```
~/.claude/skills/bxz-xhs/scripts/auto_publish.py
```

## 使用方法

### 方式1：通过 bxz-xhs skill（推荐）

在 bxz-xhs 生成完图片后，选择 "Yes" 即可自动发布。

### 方式2：手动发布已有会话

```bash
# 预览
python3 ~/.claude/skills/bxz-xhs/scripts/auto_publish.py ~/Myxhs/{topic-slug} --dry-run

# 发布
python3 ~/.claude/skills/bxz-xhs/scripts/auto_publish.py ~/Myxhs/{topic-slug}
```

## 提取规则

### 标题提取

从 `outline.md` 的 P1 封面/Cover 中提取 Hook：

```markdown
## P1 封面
**Hook**: "被朋友的AI产品惊艳到了🤯"
```

提取结果：`被朋友的AI产品惊艳到了🤯`

### 内容提取

从各页面的 Message 字段提取：

```markdown
## P2 现象
**Message**: 朋友的AI PPT产品，虽然做的是常见领域，但有一种"交付级"的感觉
```

提取结果：`朋友的AI PPT产品，虽然做的是常见领域，但有一种"交付级"的感觉`

## 长度限制

| 字段 | 限制 | 处理方式 |
|------|------|---------|
| 标题 | 20字 | 截断 |
| 内容 | 1000字 | 截断 |

## 图片处理

1. 从会话目录查找 `*.png` 文件
2. 排除 `preview` 和 `backup` 文件
3. 复制到 `~/xiaohongshu-mcp/images/`
4. 转换为容器路径 `/app/images/{filename}`

## API 调用

```python
POST http://localhost:18060/api/v1/publish
Content-Type: application/json

{
    "title": "标题",
    "content": "内容",
    "images": ["/app/images/01-cover.png", ...],
    "tags": ["AI", "科技"]
}
```

## 故障排除

### 问题：找不到 outline.md

```
错误: 找不到 outline.md: /path/to/session
```

**解决**：确认 bxz-xhs 已完成，并且会话目录中有 `outline.md` 文件。

### 问题：没有找到图片

```
错误: 在 /path/to/session 中没有找到图片文件
```

**解决**：确认 bxz-xhs 已成功生成图片。

### 问题：xiaohongshu-mcp 连接失败

```
错误: 小红书服务连接失败
```

**解决**：
```bash
# 检查服务是否运行
ps aux | grep xiaohongshu-mcp

# 启动服务
cd ~/xiaohongshu-mcp && ./xiaohongshu-mcp
```

### 问题：发布失败 "未登录"

```
错误: 发布失败: 未登录
```

**解决**：删除旧 cookies 并重新登录
```bash
rm ~/xiaohongshu-mcp/cookies.json
cd ~/xiaohongshu-mcp && ./xiaohongshu-mcp
# 等待登录提示
```

## 依赖

- Python 3.8+
- requests (`pip install requests`)
- xiaohongshu-mcp 服务运行中
