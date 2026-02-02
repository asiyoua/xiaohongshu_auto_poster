# 变更日志

## 2025-02-01

### 新增功能

**反爬虫检测模块 (`anti_detection.py`)**
- 随机操作延迟（默认 2-8 秒可配置）
- 浏览行为模拟（发布前浏览 3-5 个帖子）
- 图片上传延迟（每张间隔 0.5-2 秒）
- 限流控制（发布间隔至少 30 分钟）
- 失败重试机制（指数退避，最多 3 次）
- 9 步人类发布工作流模拟

**时间调度模块 (`publish_scheduler.py`)**
- 智能发布时间选择
- 活跃时段定义（晨间 7-9、午休 12-14、下午茶 15-17、晚高峰 19-23）
- 避开深夜时段（0-7 点）
- 周末时段权重加成
- 时间段内随机化（±30 分钟）

**CLI 选项**
- `--no-anti-detect` - 禁用反检测（快速但有风险）
- `--min-delay / --max-delay` - 自定义延迟范围
- `--no-schedule` - 禁用时间调度（立即发布）
- `--prefer-immediate` - 倾向于立即发布

### 架构变更

**解耦 xiaohongshu-publisher 依赖**
- 复制 `xiaohongshu_client.py` → `bxz_xhs_client.py`
- 移除对 xiaohongshu-publisher 软链接的依赖
- bxz-xhs 现在完全独立运行

### 文件变更

```
scripts/
├── auto_publish.py           # 更新：集成反检测和调度
├── anti_detection.py         # 新增：反爬虫模块
├── publish_scheduler.py      # 新增：时间调度模块
├── bxz_xhs_client.py         # 新增：独立 MCP 客户端
└── README.md                 # 更新：功能文档
```

### 默认行为

- 反检测：**默认启用**（安全第一）
- 时间调度：**默认启用**（模拟真实用户）
- 所有功能可通过 CLI 选项禁用
