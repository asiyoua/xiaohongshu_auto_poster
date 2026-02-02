# 小红书自动发布 - 完整安装指南

## 系统架构

```
用户输入内容
        ↓
    bxz-xhs skill (分析+生成图片)
        ↓
    ~/Myxhs/{topic}/ (输出目录)
        ├── outline.md
        ├── *.png
        └── ...
        ↓
    auto_publish.py (提取+发布)
        ↓
    xiaohongshu-mcp API
        ↓
    小红书平台
```

## 前置要求

| 组件 | 作用 | 安装方式 |
|------|------|---------|
| **bxz-xhs skill** | 图片生成 | 已安装于 `~/.claude/skills/bxz-xhs/` |
| **xiaohongshu-mcp** | 发布服务 | 见下方安装步骤 |
| **auto_publish.py** | 联接脚本 | 已创建于 `~/.claude/skills/bxz-xhs/scripts/` |

---

## 安装步骤

### 1. xiaohongshu-mcp 安装

#### 方式 A: 二进制运行（推荐，当前使用）

```bash
# 1. 下载二进制文件
cd ~
# 访问 https://github.com/xpzouying/xiaohongshu-mcp/releases
# 下载 darwin-arm64 版本到 ~/Downloads/

# 2. 创建工作目录
mkdir -p ~/xiaohongshu-mcp/images
cd ~/xiaohongshu-mcp

# 3. 复制二进制文件
cp ~/Downloads/xiaohongshu-mcp-darwin-arm64 ./xiaohongshu-mcp
chmod +x ./xiaohongshu-mcp

# 4. 启动服务
./xiaohongshu-mcp

# 服务将在 http://localhost:18060 运行
```

#### 方式 B: Docker 运行（备选）

```bash
# 1. 创建目录
mkdir -p ~/xiaohongshu-mcp/images
cd ~/xiaohongshu-mcp

# 2. 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  xiaohongshu-mcp:
    image: xpzouying/xiaohongshu-mcp
    container_name: xiaohongshu-mcp
    restart: unless-stopped
    volumes:
      - ./data:/app/data
      - ./images:/app/images
    ports:
      - "18060:18060"
EOF

# 3. 启动
docker compose up -d
```

### 2. 登录小红书账号

**重要**：使用独立的登录工具 `xiaohongshu-login`

```bash
cd ~/xiaohongshu-mcp

# 运行登录工具（会打开浏览器）
./xiaohongshu-login

# 在打开的浏览器中：
# 1. 扫码或账号密码登录小红书
# 2. 登录成功后，关闭浏览器
# 3. cookies 会自动保存到当前目录的 cookies.json
```

**验证登录状态**：
```bash
./xiaohongshu-login
# 如果显示 "当前登录状态: true" 说明已登录
```

**注意事项**：
- `xiaohongshu-login` 会打开浏览器让你登录
- 登录成功后 cookies 保存在 `~/xiaohongshu-mcp/cookies.json`
- 后续发布时 `xiaohongshu-mcp` 会使用这个 cookies 文件

### 3. 验证安装

```bash
# 检查服务状态
curl http://localhost:18060

# 检查进程
ps aux | grep xiaohongshu-mcp
```

预期输出：
```json
{"message":"xiaohongshu-mcp server"}
```

---

## 使用方法

### 完整流程（推荐）

1. **在 Claude Code 中调用 bxz-xhs**：
   ```
   /bxz-xhs
   [粘贴你的内容]
   ```

2. **bxz-xhs 会引导你完成**：
   - 内容分析
   - 选择大纲方案
   - 选择风格和元素
   - 生成图片

3. **图片生成完成后**，bxz-xhs 会询问：
   ```
   是否立即发布到小红书？
   - Yes: 全自动发布
   - Preview: 预览后发布
   - No: 仅保存图片
   ```

### 手动发布已有内容

```bash
# 预览
python3 ~/.claude/skills/bxz-xhs/scripts/auto_publish.py ~/Myxhs/ai-product-result-orientation --dry-run

# 发布
python3 ~/.claude/skills/bxz-xhs/scripts/auto_publish.py ~/Myxhs/ai-product-result-orientation
```

---

## 故障排除

### 问题 1: xiaohongshu-mcp 连接失败

```bash
# 检查服务是否运行
lsof -i :18060

# 如果没有输出，重启服务
cd ~/xiaohongshu-mcp && ./xiaohongshu-mcp
```

### 问题 2: 发布失败 "未登录"

```bash
# 删除旧的 cookies
rm ~/xiaohongshu-mcp/data/cookies.json

# 重启服务并重新登录
cd ~/xiaohongshu-mcp && ./xiaohongshu-mcp
```

### 问题 3: 图片找不到

```bash
# 确认图片在 session 目录
ls ~/Myxhs/{topic-slug}/*.png

# 确认 mcp images 目录存在
ls ~/xiaohongshu-mcp/images/
```

### 问题 4: 限流错误

小红书有发布频率限制，稍等几分钟后重试。

---

## 配置文件

| 文件 | 作用 |
|------|------|
| `~/.claude/skills/bxz-xhs/SKILL.md` | bxz-xhs skill 配置 |
| `~/.claude/skills/bxz-xhs/scripts/auto_publish.py` | 自动发布脚本 |
| `~/.claude/skills/bxz-xhs/docs/` | 文档目录 |
| `~/.config/bxz-xhs/config.ini` | Gemini Nano Banana API Key |
| `~/xiaohongshu-mcp/data/cookies.json` | 小红书登录状态 |
| `~/Myxhs/` | 输出目录（会话结果） |

---

## 开机自启动（可选）

### launchd (macOS)

```bash
cat > ~/Library/LaunchAgents/com.xiaohongshu-mcp.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.xiaohongshu-mcp</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/$(whoami)/xiaohongshu-mcp/xiaohongshu-mcp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/$(whoami)/xiaohongshu-mcp</string>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.xiaohongshu-mcp.plist
```
