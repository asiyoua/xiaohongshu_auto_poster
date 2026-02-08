# 小红书自动化工具开发总结

> 本文档记录了开发过程中的关键问题、解决方案和最佳实践，供以后做类似项目参考。

## 目录

- [核心问题与解决](#核心问题与解决)
- [架构设计要点](#架构设计要点)
- [开发流程参考](#开发流程参考)
- [避坑指南](#避坑指南)
- [核心原则](#核心原则)

---

## 核心问题与解决

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| **post.md 不能直接发布** | 包含 Markdown 语法、YAML frontmatter | 改为纯文本格式，300-600字，带 emoji |
| **EXTEND.md 路径混乱** | 不清楚是在 skill 目录还是 generator 目录 | 明确：`generator/EXTEND.md` 是用户配置 |
| **MCP 代码分散** | 拟人化代码在独立的 redbook-mcp 项目 | 整合到 `bxz-xhs/mcp/` 子目录 |
| **安装流程不清晰** | Skill 和 MCP 需要放在不同目录 | 添加小白模式（AI 执行）+ 开发者模式（手动） |
| **使用说明太复杂** | 技术细节太多，不适合小白用户 | 简化为 3 种方式，强调 AI 自动化 |

---

## 架构设计要点

### 项目结构

```
项目仓库结构（GitHub）
├── SKILL.md          # 主技能定义
├── generator/        # 图片生成工具
│   ├── WORKFLOW.md   # 完整使用指南
│   ├── EXTEND.md     # 用户偏好配置
│   └── references/   # 风格和布局参考
├── publisher/        # 发布技能
│   └── scripts/      # 发布脚本
└── mcp/              # MCP 服务器源代码 ⭐
    ├── redbook-poster.js  # 拟人化发布核心
    ├── index.js
    └── package.json
```

### 用户本地安装后

```
~/.claude/
├── skills/
│   └── bxz-xhs/      # Skill 留在这里（不要动）
│
└── mcp-servers/
    └── redbook-mcp/  # MCP 必须在这里运行
        ├── redbook-poster.js
        └── node_modules/
```

### 关键原则

1. **源代码在仓库** - 方便用户一次克隆获取所有文件
2. **运行时分开** - Skill 和 MCP 各司其职
3. **AI 交互优先** - 小白模式让 AI 帮忙执行命令

---

## 开发流程参考

### Step 1: 明确项目边界

- ✅ 主项目做什么？
- ✅ 依赖的外部服务是什么？
- ✅ 用户的技能水平是什么？

### Step 2: 设计目录结构

```
project/
├── skill/            # Claude Code 技能
├── scripts/          # 辅助脚本
└── server/           # 外部服务源代码（如 MCP）
```

### Step 3: 编写 README

#### 1. 提供两种安装方式

**小白模式（推荐）**：
```
让 AI 帮你完成所有操作，只需说：
"帮我安装小红书自动化工具，按照官方 README 的步骤执行"
```

**开发者模式**：
```bash
# 手动执行命令
git clone ...
cp -r ...
npm install ...
```

#### 2. 使用说明要自然

- ✅ 避免大量技术细节
- ✅ 强调 AI 自动化
- ✅ 提供多种使用方式
- ❌ 不要只给命令不解释

#### 3. 输出格式要符合平台

| 平台 | 格式要求 |
|------|----------|
| **小红书** | 纯文本 + emoji，300-600字 |
| **技术博客** | Markdown，可包含代码 |
| **公众号** | HTML 格式 |

**禁止内容**：
- ❌ Markdown 语法（小红书不支持）
- ❌ YAML frontmatter（会直接显示）
- ❌ 代码块（会乱码）

### Step 4: 整合外部依赖

**原则**：
- 将必需的外部服务源代码放在项目子目录
- 安装时复制到正确的运行目录
- 在 README 中清晰说明路径关系

**示例**：
```bash
# 源代码在 skill 仓库
~/.claude/skills/bxz-xhs/mcp/

# 运行时复制到 MCP 目录
cp -r ~/.claude/skills/bxz-xhs/mcp ~/.claude/mcp-servers/redbook-mcp
```

### Step 5: 测试完整流程

1. **首次安装**（无任何配置）
2. **正常使用**（生成 + 发布）
3. **边缘情况**（配置错误、网络问题等）

---

## 避坑指南

| 坑 | 解决 |
|------|------|
| **输出格式不兼容平台** | 提前了解目标平台的发布规则 |
| **路径混乱** | 在 README 中用图形说明安装后的结构 |
| **配置文件位置不清** | 明确哪些是源代码，哪些是运行时配置 |
| **用户不知道如何交互** | 提供对话示例，而不是只给命令 |
| **文档太技术化** | 写两种版本：小白版 + 开发者版 |
| **Skill 位置错误** | Skill 必须在 `~/.claude/skills/` 下 |
| **MCP 位置错误** | MCP 必须在 `~/.claude/mcp-servers/` 下 |

---

## 核心原则

### 1. 用户体验优先

让 AI 帮用户做复杂操作：
- ✅ "帮我发布到小红书"
- ❌ "/bxz-xhs-publisher ~/Myxhs/topic --config xxx"

### 2. 一个仓库包含所有

用户克隆一次即可：
- ✅ Skill + MCP + 文档都在一个仓库
- ❌ 用户需要到处找依赖

### 3. 文档分层

| 文档 | 目标用户 | 内容 |
|------|----------|------|
| **README.md** | 所有人 | 快速开始、基本使用 |
| **WORKFLOW.md** | 进阶用户 | 完整流程、配置说明 |
| **SKILL.md** | 开发者 | 技术细节、扩展指南 |

### 4. 输出即用

生成的文件格式符合平台要求：
- ✅ 小红书文案 = 纯文本 + emoji
- ✅ 图片尺寸 = 3:4 竖版
- ✅ 字数限制 = 300-600字

### 5. 清晰说明路径

用图示说明文件应该在哪里：
```
安装后：
~/.claude/
├── skills/bxz-xhs/     ← Skill
└── mcp-servers/redbook-mcp/  ← MCP
```

---

## 拟人化功能实现

### 目的

降低机器人检测风险，模拟真实用户行为。

### 核心功能

| 功能 | 实现方式 |
|------|----------|
| **随机延迟** | `randomDelay(min, max)` - 操作间随机等待 |
| **人类打字** | `humanType()` - 逐字输入 + 随机速度 + 偶尔删除重打 |
| **人类点击** | `humanClick()` - 鼠标移动轨迹 + 随机偏移 |
| **自然滚动** | `naturalScrolling()` - 平滑滚动 + 随机距离 |
| **随机鼠标移动** | `randomMouseMove()` - 模拟浏览行为 |

### 代码位置

`mcp/redbook-poster.js` - 完整的拟人化实现

---

## Git 提交规范

### 提交格式

```
<type>: <subject>

<body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `refactor`: 重构
- `style`: 格式调整

### 示例

```
feat: Add MCP server with humanization features

- Add complete MCP server in mcp/ directory
- Include humanization features to reduce bot detection
- Update README with MCP installation instructions

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 常见命令

### 开发流程

```bash
# 查看状态
git status

# 添加文件
git add .

# 提交
git commit -m "feat: xxx"

# 推送
git push

# 查看日志
git log --oneline -10
```

### 检查远程仓库

```bash
# 查看 remote
git remote -v

# 查看 fetch/pull 需求
git pull --rebase
```

---

## 后续改进方向

1. **一键安装脚本** - 自动化所有安装步骤
2. **配置向导** - 首次使用时引导用户配置
3. **错误恢复** - 自动处理常见错误
4. **批量操作** - 支持批量生成和发布
5. **模板库** - 提供更多预设模板

---

## 相关资源

- **Claude Code Skills**: https://github.com/anthropics/claude-code-skills
- **小红书创作平台**: https://creator.xiaohongshu.com
- **Gemini API**: https://makersuite.google.com/app/apikey
- **Playwright**: https://playwright.dev

---

**最后更新**: 2026-02-08
**项目版本**: v1.0
