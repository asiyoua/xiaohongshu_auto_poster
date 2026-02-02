# bxz-xhs Scripts

自动发布相关脚本。

## 文件说明

| 文件 | 作用 | 调用方式 |
|------|------|---------|
| `auto_publish.py` | 自动发布到小红书（Python） | 由 bxz-xhs skill 自动调用，或手动执行 |
| `anti_detection.py` | 反爬虫检测模块 | 被 auto_publish.py 调用 |
| `publish_scheduler.py` | 发布时间调度器 | 被 auto_publish.py 调用 |
| `publish_to_xiaohongshu.sh` | 自动发布到小红书（Bash） | 备选方案 |

## auto_publish.py

从 bxz-xhs 输出目录读取图片和内容，自动发布到小红书。

### 特性

- **反爬虫检测**: 随机延迟、浏览行为模拟、限流控制
- **时间调度**: 智能选择发布时间，避开深夜时段
- **失败重试**: 指数退避重试机制

### 依赖

- Python 3.8+
- requests: `pip install requests`
- xiaohongshu-mcp 服务运行中

### 使用

```bash
# 预览模式
python3 auto_publish.py ~/Myxhs/{topic-slug} --dry-run

# 发布（默认启用反检测和时间调度）
python3 auto_publish.py ~/Myxhs/{topic-slug}

# 快速发布（禁用反检测，风险较高）
python3 auto_publish.py ~/Myxhs/{topic-slug} --no-anti-detect

# 立即发布（禁用时间调度）
python3 auto_publish.py ~/Myxhs/{topic-slug} --no-schedule

# 自定义延迟范围
python3 auto_publish.py ~/Myxhs/{topic-slug} --min-delay 3 --max-delay 10
```

### CLI 选项

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--api-url` | `http://localhost:18060` | xiaohongshu-mcp API 地址 |
| `--dry-run` | - | 仅预览，不实际发布 |
| `--no-anti-detect` | - | 禁用反检测功能（快速但有风险） |
| `--min-delay` | 2.0 | 最小操作延迟（秒） |
| `--max-delay` | 8.0 | 最大操作延迟（秒） |
| `--no-schedule` | - | 禁用时间调度（立即发布） |
| `--prefer-immediate` | - | 倾向于立即发布（如果当前时间合适） |

### 反检测功能

默认启用的反检测策略：

1. **随机延迟**: 每个操作间随机等待 2-8 秒
2. **浏览模拟**: 发布前浏览 3-5 个帖子
3. **图片延迟**: 上传每张图片间隔 0.5-2 秒
4. **限流控制**: 发布间隔至少 30 分钟
5. **重试机制**: 失败后指数退避重试

### 时间调度

默认启用的时间调度策略：

- **活跃时段**: 7-9点（晨间）、12-14点（午休）、15-17点（下午茶）、19-23点（晚高峰）
- **避开时段**: 0-6点（深夜）、6-7点（凌晨）
- **周末加成**: 周末时段权重更高

## publish_to_xiaohongshu.sh

Bash 版本的自动发布脚本，功能与 Python 版本相同。

### 使用

```bash
# 发布
./publish_to_xiaohongshu.sh ~/Myxhs/{topic-slug}
```
