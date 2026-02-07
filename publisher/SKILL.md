---
name: bxz-xhs-publisher
description: 小红书自动发布工具。将 bxz-xhs 生成的图片发布到小红书。使用 Playwright 自动化，支持扫码登录。当用户说"发布到小红书"、"推送到小红书"、"小红书发布"时使用。
---

# 小红书自动发布工具 (bxz-xhs-publisher)

将 bxz-xhs 生成的图片系列自动发布到小红书平台。

## 快速使用

```bash
# 发布 bxz-xhs 生成的会话
/bxz-xhs-publisher ~/Myxhs/ai-tools

# 预览模式（不实际发布）
/bxz-xhs-publisher ~/Myxhs/ai-tools --preview
```

## 技术架构

**采用 Playwright 自动化**（替代已失效的 xiaohongshu-mcp）

| 组件 | 技术 | 说明 |
|------|------|------|
| **浏览器** | Chrome (系统) | 使用已安装的 Chrome，无需额外下载 |
| **自动化** | Playwright | 成熟稳定，反爬虫检测率低 |
| **登录** | 扫码登录 | 无需手机号，一次扫码长期有效 |
| **位置** | `~/.claude/mcp-servers/redbook-mcp` | MCP 服务器集中管理 |

## 首次使用

### 1. 扫码登录（仅首次）

首次运行会自动打开 Chrome 并显示二维码：

```
📱 请使用小红书 App 扫描屏幕上的二维码登录
```

使用小红书 App 扫码后，cookies 会自动保存，以后无需再登录。

### 2. Cookies 位置

```bash
~/.claude/mcp-servers/redbook-data/redbook_cookies.json
```

## 工作流程

```
输入目录 → 提取内容 → 自动登录 → 填写表单 → 上传图片 → 发布
```

### 步骤详情

1. **提取内容** - 优先从 `post.md` 提取，fallback 到 `outline.md`
2. **自动登录** - 使用保存的 cookies，失效则提示扫码
3. **打开发布页** - 直接导航到 `creator.xiaohongshu.com/publish/publish`
4. **上传图片** - 自动上传所有 png 图片
5. **填写内容** - 自动填入标题和正文
6. **发布** - 点击发布按钮

## 输入格式

**优先使用 `post.md`**：
- **标题**: 第一行（最多 20 字）
- **内容**: 全部内容（最多 1000 字）

**fallback 到 `outline.md`**（如果没有 post.md）：
- **标题**: P1 的 Hook 字段（最多 20 字）
- **内容**: 所有页面的 Message 字段（最多 1000 字）

## 限制

| 项目 | 限制 |
|------|------|
| 标题 | 最多 20 字 |
| 正文 | 最多 1000 字 |
| 图片 | 所有 .png 文件（自动排除 preview/backup） |

## 故障排除

### 登录失效

**症状**: 提示"Cookies 已失效"

**解决**: 重新运行脚本，会自动打开扫码登录

### 图片未上传

**症状**: 图片显示但未上传成功

**解决**: 检查图片路径是否正确，确保是 `.png` 格式

### 浏览器未启动

**症状**: 提示"无法找到 Chrome"

**解决**: 确保系统已安装 Google Chrome

## 与 bxz-xhs 集成

在 bxz-xhs 生成完成后：

```
════════════════════════════════════════════════════════════
✅ 小红书图片生成完成！
════════════════════════════════════════════════════════════

...

📱 想发布到小红书？

运行以下命令：
  /bxz-xhs-publisher ~/Myxhs/ai-career-transformation
```

## 技术细节

### Playwright 优势

相比之前的 rod 库：

| 特性 | Playwright | rod (旧) |
|------|------------|----------|
| 稳定性 | ✅ 成熟稳定 | ❌ 频繁崩溃 |
| 反爬虫 | ✅ 检测率低 | ❌ 容易被封 |
| 浏览器 | ✅ 系统 Chrome | ❌ 需下载 |
| 文档 | ✅ 完善 | ❌ 有限 |

### 扫码登录优势

| 特性 | 扫码登录 | 短信验证码 |
|------|----------|------------|
| 需要手机号 | ❌ 不需要 | ✅ 需要 |
| 便捷性 | ✅ App 扫一下 | ❌ 等短信 |
| 安全性 | ✅ 官方推荐 | ⚠️ 可能拦截 |
| 账号灵活 | ✅ 任意账号 | ❌ 绑定手机 |

## 文件结构

```
bxz-xhs-publisher/
├── SKILL.md              # 本文档
├── .mcp.json            # MCP 服务器配置
└── scripts/
    └── publish_with_mcp.js   # 发布脚本（Playwright）
```

## 更新日志

**2026-02-06 - v2.1**
- ✅ 支持 `post.md` 文件格式
- ✅ 修复多图上传逻辑（每张图片重新查找 input）
- ✅ 优化发布按钮选择器，避免重复点击
- ✅ 清理冗余代码和旧文件

**2026-02-06 - v2.0**
- ✅ 迁移到 Playwright 自动化
- ✅ 添加扫码登录支持
- ✅ 修复"Execution context was destroyed"问题
- ❌ 移除 xiaohongshu-mcp 依赖

**2025-02-05 - v1.0**
- 初始版本，使用 xiaohongshu-mcp (Go + rod)
