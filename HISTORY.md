# bxz-xhs 开发历史

本文档记录项目演进过程中尝试过的方案、遇到的问题以及最终解决方案。

## 版本历史

### v3.0 - 当前版本 (2025-02-07)

**图片生成**:
- ✅ Gemini 3 Pro Image Preview API (本地 Python 脚本)
- ✅ 配置文件: `~/.config/bxz-xhs/config.ini`
- ✅ 批量生成: `batch_generate_backup.py` + Excel prompts

**自动发布**:
- ✅ Playwright 自动化
- ✅ 扫码登录（cookies 保存在 `~/.claude/mcp-servers/redbook-data/`）
- ✅ 脚本: `scripts/publish_with_mcp.js`

**工作流文档**:
- ✅ WORKFLOW.md - 完整的安装和使用指南
- ✅ SKILL.md - 清理后的技能文档

---

## 之前尝试过的方案

### 发布方案演进

#### 方案 1: xiaohongshu-mcp (Go + rod) - v1.0 ❌

**尝试时间**: 2025-02-05

**架构**:
- Go 语言写的 MCP 服务器
- rod 库做浏览器自动化
- 二进制文件运行

**遇到的问题**:
1. ❌ **频繁崩溃** - rod 库不稳定
2. ❌ **容易被检测** - 小红书反爬虫识别
3. ❌ **"Execution context was destroyed"** - 页面切换后上下文丢失
4. ❌ **需要下载浏览器** - rod 自带 Chromium，体积大
5. ❌ **文档有限** - rod 库文档不完善

**为什么失败**:
- rod 是相对较小的项目，社区支持有限
- 反爬虫检测严格，经常被小红书封禁
- 页面操作不稳定，经常报错

**文件位置** (已废弃):
- `~/xiaohongshu-mcp/` - 旧的工作目录
- `docs/INSTALL.md` - 旧方案的安装文档（已过时）

---

#### 方案 2: xiaohongshu-mcp HTTP API - v1.1 ❌

**尝试时间**: 2025-02-06

**架构**:
- Go 二进制运行 HTTP 服务器
- 端口: `localhost:18060`
- Python 脚本 `auto_publish.py` 调用 API

**遇到的问题**:
1. ❌ **需要保持服务运行** - 必须先启动二进制
2. ❌ **额外的进程管理** - 需要监控服务状态
3. ❌ **登录工具分离** - `xiaohongshu-login` 独立运行
4. ❌ **cookies 路径混乱** - 服务目录 vs 工作目录

**为什么失败**:
- 架构复杂，用户需要管理多个组件
- 服务崩溃后需要手动重启
- cookies 文件位置不统一

**文件位置** (已废弃):
- `scripts/auto_publish.py` - 旧的发布脚本
- `scripts/publish_scheduler.py` - 定时发布脚本（未完成）

---

#### 方案 3: Playwright 直接集成 - v2.0 ✅

**尝试时间**: 2025-02-06 (当前)

**架构**:
- Node.js + Playwright
- 直接在发布脚本中控制浏览器
- 使用系统 Chrome，无需额外下载

**为什么成功**:
1. ✅ **成熟稳定** - Playwright 由 Microsoft 维护
2. ✅ **反爬虫检测率低** - 使用真实 Chrome
3. ✅ **单脚本运行** - 无需管理独立服务
4. ✅ **文档完善** - Playwright 文档详细
5. ✅ **扫码登录** - 一次登录长期有效

**关键改进**:
- 每次上传图片重新查找 input 元素（解决元素失效问题）
- 使用 MCP 协议统一接口
- cookies 保存在 `~/.claude/mcp-servers/redbook-data/`

---

### 图片生成方案演进

#### 尝试 1: Midjourney API ❌

**问题**:
- 成本高
- API 不稳定
- 风格控制困难

#### 尝试 2: DALL-E 3 ❌

**问题**:
- 中文支持差
- 风格一致性难控制
- API 限流

#### 最终方案: Gemini 3 Pro Image Preview ✅

**优势**:
- ✅ 中文支持好
- ✅ 成本相对低
- ✅ 风格可控（通过 prompt）
- ✅ 批量生成支持

**配置文件优先级**:
1. `~/.config/bxz-xhs/config.ini` (用户级，推荐)
2. `.baoyu-skills/bxz-xhs/config.ini` (项目级)

**生成脚本**: `~/MyCode/batch_generate_backup.py`

---

## 文档演进

### 旧文档 (已废弃或需更新)

| 文件 | 状态 | 说明 |
|------|------|------|
| `docs/INSTALL.md` | ❌ 废弃 | 引用旧的 xiaohongshu-mcp 二进制方案 |
| `docs/USER_GUIDE.md` | ⚠️ 部分过时 | 有用内容但路径错误 |
| `scripts/auto_publish.py` | ❌ 废弃 | 旧的 Python 发布脚本 |
| `scripts/publish_scheduler.py` | ❌ 废弃 | 定时发布脚本（未完成） |
| `scripts/bxz_xhs_client.py` | ❌ 废弃 | HTTP 客户端 |
| `scripts/publish_to_xiaohongshu.sh` | ❌ 废弃 | Shell 发布脚本 |

### 新文档 (当前使用)

| 文件 | 用途 |
|------|------|
| `WORKFLOW.md` | 完整的安装和使用指南 |
| `SKILL.md` | 技能定义和工作流程 |
| `EXTEND.md` | 用户偏好配置 |

---

## 路径变更历史

### 技能目录

| 版本 | 路径 | 说明 |
|------|------|------|
| v1.x-v2.x | `.baoyu-skills/bxz-xhs/` | 旧位置（已废弃） |
| v3.0 | `.claude/skills/bxz-xhs/` | 当前位置 |

**需要更新的文件**:
- `SKILL.md` - Step 0 中的路径检查
- `docs/USER_GUIDE.md` - 配置文件路径
- `references/config/first-time-setup.md` - 安装路径

### MCP 服务器

| 版本 | 路径 | 说明 |
|------|------|------|
| v1.x | `~/xiaohongshu-mcp/` | 独立运行的二进制 |
| v2.0 | `.baoyu-skills/bxz-xhs/scripts/` | Python 脚本 |
| v3.0 | `.claude/mcp-servers/redbook-mcp/` | MCP 服务器目录 |

---

## 问题与解决方案

### 问题 1: 图片上传失败

**症状**: 图片显示但未成功上传

**原因**: input 元素在首次上传后失效

**解决方案**:
```javascript
// 每次上传前重新查找 input 元素
const fileInput = await page.$('input[type="file"]');
await fileInput.setInputFiles(imagePath);
```

---

### 问题 2: "Execution context was destroyed"

**症状**: 页面操作后报错上下文被销毁

**原因**: rod 库页面引用管理不当

**解决方案**: 切换到 Playwright，它有更好的上下文管理

---

### 问题 3: 登录状态失效

**症状**: cookies 过期需要重新登录

**解决方案**:
1. 删除旧 cookies: `rm ~/.claude/mcp-servers/redbook-data/redbook_cookies.json`
2. 重新运行发布命令，会显示新的二维码

---

### 问题 4: EXTEND.md 路径检查错误

**症状**: 用户偏好文件找不到

**原因**: 代码检查 `.baoyu-skills` 但实际在 `.claude/skills`

**解决方案**: 更新 SKILL.md Step 0 的路径检查逻辑

---

## 待解决的问题

### 已知问题

1. **账号异常**: 小红书可能限制频繁发布的账号
   - 缓解方案: 降低发布频率，手动发布测试

2. **图片风格一致性**: Gemini 生成的图片风格可能有差异
   - 缓解方案: 在 prompt 中明确指定风格元素

3. **多图发布**: 首次使用可能失败
   - 缓解方案: 先手动发布一次，确认流程正常

---

## 未来计划

### 短期 (v3.1)

- [ ] 添加图片编辑功能（重新生成单张图片）
- [ ] 支持自定义水印位置和样式
- [ ] 优化 prompt 生成逻辑

### 中期 (v3.5)

- [ ] 支持视频内容生成
- [ ] 添加内容模板库
- [ ] 支持批量生成多个主题

### 长期 (v4.0)

- [ ] AI 自动优化内容
- [ ] 多平台发布（抖音、快手等）
- [ ] 数据分析和优化建议

---

## 贡献者

- 主要开发: bian
- 测试反馈: （待补充）

---

**最后更新**: 2025-02-07
