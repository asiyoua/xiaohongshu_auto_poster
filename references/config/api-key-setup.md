# API Key 配置指南

## 概述

小红书图片生成功能需要 Google GenAI API Key。本指南说明如何配置你的 API Key。

## 配置方式（按优先级）

脚本按以下顺序查找 API Key，找到第一个有效的即使用：

1. **环境变量** `GOOGLE_GENAI_API_KEY`
2. **用户级配置** `~/.config/bxz-xhs/config.ini` (推荐)
3. **项目级配置** `.baoyu-skills/bxz-xhs/config.ini`
4. **Shell 配置** `~/.zshrc` 中的 export 语句

---

## 推荐方式：用户级配置

### 步骤 1：创建配置目录

```bash
mkdir -p ~/.config/bxz-xhs
```

### 步骤 2：创建配置文件

```bash
cat > ~/.config/bxz-xhs/config.ini << 'EOF'
# 小红书图片生成配置
# 此文件存储敏感信息，请勿提交到版本控制系统

[google_genai]
api_key=YOUR_API_KEY_HERE
EOF
```

### 步骤 3：替换为你的 API Key

编辑 `~/.config/bxz-xhs/config.ini`，将 `YOUR_API_KEY_HERE` 替换为你的实际 API Key。

---

## 其他配置方式

### 方式 1：环境变量

在 `~/.zshrc` 或 `~/.bashrc` 中添加：

```bash
export GOOGLE_GENAI_API_KEY="your-api-key-here"
```

然后执行 `source ~/.zshrc` 或重启终端。

### 方式 3：项目级配置

在项目目录创建：

```bash
mkdir -p .baoyu-skills/bxz-xhs
cat > .baoyu-skills/bxz-xhs/config.ini << 'EOF'
[google_genai]
api_key=your-api-key-here
EOF
```

**注意**：项目级配置可能被意外提交到 git，建议添加到 `.gitignore`。

---

## 安全提示

1. **不要提交配置文件到版本控制**
2. 将 `~/.config/bxz-xhs/config.ini` 添加到你的全局 `.gitignore`
3. 定期轮换 API Key
4. 如果 key 泄露，立即在 Google Cloud Console 中撤销

---

## 验证配置

运行生成脚本验证配置是否正确：

```bash
python3 /path/to/batch_generate_backup.py your-prompts.xlsx
```

如果配置正确，脚本会开始生成图片。如果看到错误提示，请检查：
- 配置文件路径是否正确
- API Key 格式是否正确（没有多余空格或引号）
- 文件权限是否正确

---

## 故障排除

### 错误：未找到 API Key

确保配置文件存在且格式正确：

```bash
# 检查文件是否存在
ls -la ~/.config/bxz-xhs/config.ini

# 查看文件内容（确保 key 正确）
cat ~/.config/bxz-xhs/config.ini
```

### 错误：API Key 无效

- 确认你的 key 来自 [Google AI Studio](https://makersuite.google.com/app/apikey)
- 确认 key 未过期或被撤销
- 确认 key 有权访问 Gemini API

---

## 获取 API Key

如果你还没有 API Key：

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录你的 Google 账号
3. 点击 "Create API Key"
4. 复制生成的 key
5. 按照本指南配置
