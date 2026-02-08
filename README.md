# 小红书自动化工具集

> 从内容到发布，全自动化小红书图文创作工具

## ✨ 功能

- 📝 **智能分析**：自动分析内容，生成三种差异化大纲策略
- 🎨 **多样风格**：10 种视觉风格 × 8 种布局，自由组合
- 🖼️ **AI 生成**：使用 Gemini AI 生成高质量图片
- 📱 **自动发布**：一键发布到小红书（扫码登录，长期有效）
- ⚙️ **灵活配置**：支持命令行参数和环境变量配置

## 🚀 快速开始

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/asiyoua/xiaohongshu_auto_poster.git ~/.claude/skills/bxz-xhs
cd ~/.claude/skills/bxz-xhs

# 2. 配置 Gemini API Key
mkdir -p ~/.config/bxz-xhs
cat > ~/.config/bxz-xhs/config.ini << EOF
[gemini_nano]
api_key=YOUR_API_KEY_HERE
EOF

# 3. 详细安装指南请查看
cat generator/WORKFLOW.md
```

### 使用

```bash
# 1. 生成小红书图片
/bxz-xhs
[粘贴你的内容]

# 2. 发布到小红书
/bxz-xhs-publisher ~/Myxhs/{topic-slug}

# 3. 使用自定义配置
/bxz-xhs-publisher ~/Myxhs/{topic-slug} --mcp-server /custom/path
```

## 📂 项目结构

```
xiaohongshu_auto_poster/
├── SKILL.md                    # bxz-xhs 技能定义 ⭐
├── README.md                   # 本文件
├── generator/                  # 图片生成工具
│   ├── WORKFLOW.md             # 完整安装和使用指南 ⭐
│   ├── EXTEND.md               # 用户偏好配置
│   ├── HISTORY.md              # 开发历史
│   ├── references/             # 风格和布局参考
│   └── previews/               # 风格预览图
├── publisher/                  # 自动发布工具
│   ├── SKILL.md                # bxz-xhs-publisher 技能定义
│   ├── config.example.ini      # 配置文件示例
│   └── scripts/
│       └── publish_with_mcp.js # 发布脚本
└── .gitignore
```

### 技能安装目录

```
~/.claude/skills/
├── bxz-xhs/                    # 图片生成技能（本仓库）
│   ├── SKILL.md                # 技能定义文件
│   ├── generator/              # 生成工具相关
│   │   ├── WORKFLOW.md         # 完整使用指南
│   │   ├── EXTEND.md           # 用户偏好配置
│   │   ├── HISTORY.md          # 开发历史
│   │   ├── references/         # 风格参考
│   │   └── previews/           # 预览图
│   ├── publisher/              # 发布工具相关
│   │   ├── SKILL.md            # 发布技能定义
│   │   ├── config.example.ini  # 配置示例
│   │   └── scripts/
│   │       └── publish_with_mcp.js
│   └── README.md               # 本文件
│
└── bxz-xhs-publisher/          # 发布技能（独立技能目录）
    ├── SKILL.md                # 技能定义文件
    └── scripts -> ../bxz-xhs/publisher/scripts  # 符号链接
```

## 📖 文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **完整指南** | [generator/WORKFLOW.md](./generator/WORKFLOW.md) | 安装、配置、使用全流程 |
| **图片生成** | [SKILL.md](./SKILL.md) | bxz-xhs 技能完整文档 |
| **自动发布** | [publisher/SKILL.md](./publisher/SKILL.md) | bxz-xhs-publisher 技能文档 |
| **配置说明** | [publisher/config.example.ini](./publisher/config.example.ini) | 配置文件示例 |

## 🎨 支持的风格

### 视觉风格 (10 种)

`cute` | `fresh` | `warm` | `bold` | `minimal` | `retro` | `pop` | `notion` | `chalkboard` | `study-notes`

### 布局类型 (8 种)

`sparse` | `balanced` | `dense` | `list` | `comparison` | `flow` | `mindmap` | `quadrant`

### 自由组合

风格 × 布局 = 80 种可能组合

```bash
# 示例
/bxz-xhs --style notion --layout dense
/bxz-xhs --style cute --layout sparse
```

## ⚙️ 配置

### 发布工具配置

`bxz-xhs-publisher` 支持三种配置方式（优先级从高到低）：

**1. 命令行参数**
```bash
/bxz-xhs-publisher ~/Myxhs/ai-tools --mcp-server /custom/path
/bxz-xhs-publisher ~/Myxhs/ai-tools --data-dir /custom/data
```

**2. 环境变量**
```bash
export REDBOOK_MCP_SERVER=/custom/path
export REDBOOK_DATA_DIR=/custom/data
```

**3. 默认路径**
```bash
MCP 服务器: ~/.claude/mcp-servers/redbook-mcp
数据目录:   ~/.claude/mcp-servers/redbook-data
```

### Gemini API 配置

```bash
# 配置文件位置
~/.config/bxz-xhs/config.ini

# 获取 API Key
https://makersuite.google.com/app/apikey
```

## 🔧 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| **AI 生成** | Gemini 3 Pro Image Preview | 高质量图片生成 |
| **浏览器自动化** | Playwright + Chrome | 稳定可靠，反爬虫检测率低 |
| **通信协议** | MCP (Model Context Protocol) | Claude Code 扩展标准 |
| **登录方式** | 扫码登录 | 无需手机号，长期有效 |

## 📝 使用示例

### 完整工作流

```bash
# 1. 准备内容
echo "文科生转行AI产品经理的3个月计划..." > article.md

# 2. 生成图片
/bxz-xhs article.md
# → 分析内容 → 选择策略 → 生成 4-8 张图片
# → 输出到 ~/Myxhs/liberal-arts-to-ai-pm/

# 3. 预览发布
/bxz-xhs-publisher ~/Myxhs/liberal-arts-to-ai-pm --preview

# 4. 正式发布
/bxz-xhs-publisher ~/Myxhs/liberal-arts-to-ai-pm
# → 自动登录 → 上传图片 → 填写内容 → 发布完成
```

### 高级用法

```bash
# 指定风格和布局
/bxz-xhs article.md --style bold --layout comparison

# 使用自定义 MCP 服务器
/bxz-xhs-publisher ~/Myxhs/ai-tools --mcp-server ~/custom/mcp

# 批量生成多个风格
for style in cute fresh warm; do
  /bxz-xhs article.md --style $style
done
```

## ❓ 常见问题

### Q: 如何获取 Gemini API Key？

A: 访问 [Google AI Studio](https://makersuite.google.com/app/apikey) 创建免费 API Key。

### Q: 首次使用如何登录小红书？

A: 首次运行 `/bxz-xhs-publisher` 会自动打开 Chrome 显示二维码，使用小红书 App 扫码登录即可。

### Q: Cookies 保存在哪里？

A: `~/.claude/mcp-servers/redbook-data/redbook_cookies.json`

### Q: 支持哪些系统？

A: macOS、Linux、Windows (WSL)

### Q: 图片保存在哪里？

A: `~/Myxhs/{topic-slug}/`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

## 🌟 Star History

如果这个项目对你有帮助，请给个 Star ⭐

---

**GitHub**: https://github.com/asiyoua/xiaohongshu_auto_poster
