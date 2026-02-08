# 小红书自动化工作流完整指南

从内容创作到自动发布，全流程说明。

## 📖 目录

- [系统架构](#系统架构)
- [前置准备](#前置准备)
- [安装步骤](#安装步骤)
- [使用流程](#使用流程)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

---

## 系统架构

### 组件关系图

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐         ┌──────────────┐              │
│  │   bxz-xhs    │────────│  生成的图片   │              │
│  │  (Skill)     │         │  ~/Myxhs/xxx/│              │
│  └──────────────┘         └──────────────┘              │
│         │                                                │
│         │ 传递目录                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │bxz-xhs-      │───调用──→┌──────────────┐            │
│  │publisher     │         │ redbook-mcp  │            │
│  │  (Skill)     │         │   (MCP)      │            │
│  └──────────────┘         └──────────────┘            │
│                                   │                     │
│                                   ▼                     │
│                           ┌──────────────┐             │
│                           │  Playwright  │             │
│                           │(Node.js 包)  │             │
│                           └──────────────┘             │
│                                   │                     │
│                                   ▼                     │
│                           ┌──────────────┐             │
│                           │ Chrome 浏览器│             │
│                           └──────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### 组件说明

| 组件 | 类型 | 作用 | 是否必须单独安装 |
|------|------|------|------------------|
| **bxz-xhs** | Skill | 根据内容生成小红书图片 | ❌ Claude Code 内置 |
| **bxz-xhs-publisher** | Skill | 调用发布脚本，自动化上传 | ❌ Claude Code 内置 |
| **redbook-mcp** | MCP 服务器 | 小红书自动化操作（登录、上传、发布） | ✅ **需要单独安装** |
| **playwright** | Node.js 包 | 浏览器自动化控制 | ✅ **需要单独安装** |
| **Chrome** | 浏览器 | 实际执行操作的界面 | ✅ 需要系统安装 |

---

## 前置准备

### 1. 系统要求

- **操作系统**: macOS / Linux / Windows (WSL)
- **Node.js**: 版本 18 或更高
- **Chrome 浏览器**: 已安装
- **Claude Code**: 最新版本

### 2. 检查环境

```bash
# 检查 Node.js
node --version  # 应该 >= v18

# 检查 Chrome
which google-chrome-stable  # Linux
# 或
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version  # macOS
```

---

## 安装步骤

### Step 1: 安装 Gemini API Key

**用途**: 调用 Gemini AI 生成图片

```bash
# 1. 创建配置目录
mkdir -p ~/.config/bxz-xhs

# 2. 创建配置文件
cat > ~/.config/bxz-xhs/config.ini << 'EOF'
[gemini_nano]
api_key=YOUR_API_KEY_HERE
EOF

# 3. 替换 YOUR_API_KEY_HERE 为你的真实 API Key
# 编辑 ~/.config/bxz-xhs/config.ini
```

**获取 API Key**: 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)

---

### Step 2: 安装 redbook-mcp

**用途**: 小红书自动化操作的核心服务

```bash
# 1. 创建 MCP 服务器目录
mkdir -p ~/.claude/mcp-servers/redbook-mcp
cd ~/.claude/mcp-servers/redbook-mcp

# 2. 创建 package.json
cat > package.json << 'EOF'
{
  "name": "redbook-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "playwright": "^1.40.0"
  }
}
EOF

# 3. 安装依赖
npm install

# 4. 安装 Chromium 浏览器（Playwright 使用）
npx playwright install chromium
```

---

### Step 3: 创建 MCP 服务器代码

```bash
# 在 ~/.claude/mcp-servers/redbook-mcp/ 目录下
# 创建 index.js 文件

cat > index.js << 'EOF'
#!/usr/bin/env node
/**
 * Redbook MCP Server
 * 小红书自动化 MCP 服务器
 */

import { chromium } from 'playwright';

const SERVER_INFO = {
  name: 'redbook-mcp',
  version: '1.0.0',
};

// 启动浏览器
let browser = null;
let context = null;
let page = null;

async function initBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口
      channel: 'chrome',  // 使用系统 Chrome
    });
    context = await browser.newContext();
    page = await context.newPage();
  }
  return page;
}

// MCP 协议处理
async function handleMessage(message) {
  const { method, params } = message;

  switch (method) {
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        capabilities: {},
        serverInfo: SERVER_INFO,
      };

    case 'tools/list':
      return {
        tools: [
          {
            name: 'publish_to_xiaohongshu',
            description: '发布图文到小红书',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: '标题' },
                content: { type: 'string', description: '正文内容' },
                images: { type: 'array', items: { type: 'string' }, description: '图片路径列表' },
              },
              required: ['title', 'content', 'images'],
            },
          },
        ],
      };

    case 'tools/call':
      if (params.name === 'publish_to_xiaohongshu') {
        const page = await initBrowser();
        const { title, content, images } = params.arguments;

        // 导航到发布页面
        await page.goto('https://creator.xiaohongshu.com/publish/publish');

        // 等待页面加载
        await page.waitForTimeout(2000);

        // 切换到图文模式
        await page.click('.publish-tab-item');
        await page.waitForTimeout(1000);

        // 上传图片
        for (const imagePath of images) {
          const fileInput = await page.$('input[type="file"]');
          await fileInput.setInputFiles(imagePath);
          await page.waitForTimeout(2000);
        }

        // 输入标题
        await page.fill('.title-input', title);
        await page.waitForTimeout(500);

        // 输入正文
        await page.fill('.content-textarea', content);
        await page.waitForTimeout(500);

        // 点击发布
        await page.click('.publish-btn');
        await page.waitForTimeout(3000);

        return {
          content: [{ type: 'text', text: '发布完成' }],
        };
      }
      break;

    default:
      return {};
  }
}

// STDIO 通信
process.stdin.setEncoding('utf8');

let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const message = JSON.parse(line);
      handleMessage(message).then((result) => {
        process.stdout.write(JSON.stringify(result) + '\n');
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }
});
EOF
```

> **注意**: 以上是简化版示例。实际使用的 redbook-mcp 代码已在 bxz-xhs-publisher 技能中提供，请直接使用该技能的内置版本。

---

### Step 4: 配置 MCP Settings

```bash
# 编辑 MCP 配置文件
cat > ~/.claude/mcp_settings.json << 'EOF'
{
  "mcpServers": {
    "redbook": {
      "command": "node",
      "args": ["~/.claude/mcp-servers/redbook-mcp/index.js"]
    }
  }
}
EOF

# 注意：将路径替换为你的实际路径
```

**macOS/Linux 路径示例**:
```
/Users/你的用户名/.claude/mcp-servers/redbook-mcp/index.js
```

**Windows 路径示例**:
```
C:\Users\你的用户名\.claude\mcp-servers\redbook-mcp\index.js
```

---

## 使用流程

### 完整工作流

```
┌──────────────────┐
│ 1. 准备内容      │
│ (文章/主题)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. 生成图片      │
│ /bxz-xhs         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. 选择策略      │
│ (大纲+风格)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. 图片生成完成  │
│ ~/Myxhs/xxx/     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. 自动发布      │
│ /bxz-xhs-publisher│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ✅ 发布成功      │
└──────────────────┘
```

### 详细操作步骤

#### Step 1: 生成小红书图片

在 Claude Code 中输入：

```
/bxz-xhs
```

然后粘贴你的内容，或提供文件路径：

```
/bxz-xhs posts/my-article.md
```

**接下来会发生**：
1. 分析内容类型和目标人群
2. 询问核心卖点、目标人群、风格偏好
3. 生成 3 种大纲策略（故事/干货/视觉）
4. 选择最终方案
5. 自动生成 4-8 张图片

**输出目录**：`~/Myxhs/{topic-slug}/`

---

#### Step 2: 发布到小红书

图片生成完成后，使用发布命令：

```
/bxz-xhs-publisher ~/Myxhs/liberal-arts-to-ai-pm
```

**首次使用**：
1. 自动打开 Chrome 浏览器
2. 显示登录二维码
3. 用小红书 App 扫码
4. Cookies 自动保存

**后续使用**：
- 直接自动登录
- 上传图片
- 填写标题和正文
- 点击发布完成

---

## 验证安装

### 检查清单

```bash
# ✅ 1. 检查 API Key 配置
cat ~/.config/bxz-xhs/config.ini

# ✅ 2. 检查 MCP 服务器
ls -la ~/.claude/mcp-servers/redbook-mcp/

# ✅ 3. 检查 Node.js 依赖
cd ~/.claude/mcp-servers/redbook-mcp && npm list

# ✅ 4. 检查 MCP 配置
cat ~/.claude/mcp_settings.json

# ✅ 5. 测试浏览器
node -e "import('playwright').then(({chromium}) => chromium.launch().then(b => { console.log('✓ Chrome OK'); b.close(); }))"
```

### 快速测试

```bash
# 测试图片生成
echo "测试内容" | claude /bxz-xhs

# 测试发布（使用已生成的图片）
claude /bxz-xhs-publisher ~/Myxhs/test
```

---

## 常见问题

### ❌ 问题 1: "找不到 Chrome"

**症状**:
```
Error: Executable doesn't exist at /path/to/chrome
```

**解决**:
```bash
# macOS
brew install --cask google-chrome

# Linux
sudo apt-get install chromium-browser

# 或安装 Chromium
npx playwright install chromium
```

---

### ❌ 问题 2: "API Key 无效"

**症状**:
```
Error: API key not valid
```

**解决**:
1. 检查 `~/.config/bxz-xhs/config.ini` 中的 API Key
2. 确保没有多余空格
3. 重新生成 API Key: https://makersuite.google.com/app/apikey

---

### ❌ 问题 3: "MCP 服务器无法启动"

**症状**:
```
Error: Cannot connect to MCP server redbook
```

**解决**:
```bash
# 1. 检查文件是否存在
ls -la ~/.claude/mcp-servers/redbook-mcp/index.js

# 2. 手动测试 MCP 服务器
cd ~/.claude/mcp-servers/redbook-mcp
node index.js

# 3. 检查 mcp_settings.json 路径是否正确
cat ~/.claude/mcp_settings.json | grep redbook
```

---

### ❌ 问题 4: "登录失败 / Cookies 失效"

**症状**:
```
登录超时或提示需要重新登录
```

**解决**:
```bash
# 删除旧的 cookies
rm ~/.claude/mcp-servers/redbook-data/redbook_cookies.json

# 重新运行发布命令，会显示新的二维码
/bxz-xhs-publisher ~/Myxhs/xxx
```

---

### ❌ 问题 5: "图片上传失败"

**症状**:
```
图片显示但未上传成功
```

**解决**:
1. 确保图片是 `.png` 格式
2. 检查文件路径是否正确
3. 确保文件没有被其他程序占用
4. 检查小红书是否限制该账号的发布频率

---

### ❌ 问题 6: "账号异常无法发布"

**症状**:
```
发布流程完成但实际未发布成功
```

**解决**:
1. 检查账号状态（是否有违规提示）
2. 降低发布频率
3. 手动在小红书 App 发布测试
4. 等待账号恢复正常后再使用自动发布

---

## 📁 文件结构总览

```
~/
├── .config/
│   └── bxz-xhs/
│       └── config.ini              # Gemini API Key 配置
│
├── .claude/
│   ├── mcp_settings.json           # MCP 服务器配置
│   └── mcp-servers/
│       └── redbook-mcp/
│           ├── index.js            # MCP 服务器代码
│           ├── package.json        # Node.js 依赖
│           └── node_modules/       # npm 安装的包
│               └── playwright/     # 浏览器自动化库
│
└── Myxhs/
    └── {topic-slug}/               # 生成的图片目录
        ├── source-article.md       # 原始内容
        ├── analysis.md             # 内容分析
        ├── outline-strategy-a.md   # 策略 A
        ├── outline-strategy-b.md   # 策略 B
        ├── outline-strategy-c.md   # 策略 C
        ├── outline.md              # 最终大纲
        ├── 01-cover-*.png          # 封面图
        ├── 02-content-*.png        # 内容图
        └── 04-ending-*.png         # 结尾图
```

---

## 🎯 快速上手（最简版）

```bash
# 1. 安装依赖
mkdir -p ~/.claude/mcp-servers/redbook-mcp
cd ~/.claude/mcp-servers/redbook-mcp
npm init -y
npm install playwright
npx playwright install chromium

# 2. 配置 API Key
mkdir -p ~/.config/bxz-xhs
echo "[gemini_nano]
api_key=你的API_KEY" > ~/.config/bxz-xhs/config.ini

# 3. 使用
claude /bxz-xhs                    # 生成图片
claude /bxz-xhs-publisher ~/Myxhs/xxx  # 发布
```

---

## 💡 最佳实践

1. **内容准备**: 先写好完整的文章内容
2. **图片数量**: 建议 4-6 张，完读率最高
3. **发布时间**: 工作日 12:00-14:00 或 19:00-21:00
4. **标题优化**: 前 20 字最重要，决定点击率
5. **话题标签**: 3-5 个相关标签即可

---

## 📞 获取帮助

- **Skill 问题**: 查看 SKILL.md 文档
- **MCP 问题**: 查看 MCP 服务器日志
- **API 问题**: 访问 [Google AI Studio](https://makersuite.google.com)

---

**最后更新**: 2025-02-07
**版本**: 1.0.0
