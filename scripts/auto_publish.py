#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bxz-xhs 自动发布脚本
从 bxz-xhs 输出目录读取图片和内容，自动发布到小红书

用法:
    python3 auto_publish.py ~/Myxhs/maori-rock-carving

依赖:
    - xiaohongshu-mcp 服务运行中
    - pip install requests pyyaml

特性:
    - 反爬虫检测（随机延迟、浏览行为模拟）
    - 限流控制
    - 失败重试与退避
"""

import os
import sys
import json
import re
import shutil
from pathlib import Path
import argparse
from typing import List, Optional

# 引用模块（同目录）
SCRIPTS_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPTS_DIR))

try:
    from bxz_xhs_client import XiaohongshuMCPClient
    from anti_detection import HumanBehaviorSimulator, AntiDetectionConfig, get_simulator
    from publish_scheduler import PublishScheduler, wait_for_publish_time
except ImportError as e:
    print(f"错误: 无法导入模块: {e}")
    print(f"请确保 {SCRIPTS_DIR} 目录存在")
    sys.exit(1)


def extract_from_outline(outline_path: Path) -> tuple[str, str]:
    """
    从 outline.md 提取标题和内容

    Returns:
        (title, content)
    """
    with open(outline_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 跳过 YAML frontmatter
    if content.startswith('---'):
        _, _, content = content.partition('---\n')
        _, _, content = content.partition('---\n')

    # 提取 P1 封面/Cover 的 Hook 作为标题
    # 支持 "P1 封面" 和 "P1 Cover" 两种格式
    title_match = re.search(r'##\s+P1\s+(?:封面|Cover).*?\*\*Hook\*\*:\s*["\"](.+?)["\"]', content, re.DOTALL)
    if title_match:
        title = title_match.group(1).strip()
    else:
        # 备选：使用第一个 # 标题（跳过YAML后的第一个标题）
        title_match = re.search(r'^#+\s+(.+)$', content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else "小红书笔记"

    # 提取各页面的 Message 构建正文
    xhs_content = []
    for page_match in re.finditer(r'##\s+P\d+.*?\n(.*?)(?=##\s+P|\Z)', content, re.DOTALL):
        page_content = page_match.group(1)
        # 提取 Message 字段（支持多行）
        # 匹配 **Message**: 后面的内容，直到遇到下一个 ** 字段或 ## 标题
        msg_match = re.search(r'\*\*Message\*\*:\s*(.+?)(?=\n\s*\*\*|\Z)', page_content, re.DOTALL)
        if msg_match:
            msg = msg_match.group(1).strip()
            # 移除多余的 Markdown 标记和空行
            msg = re.sub(r'\*\*', '', msg)  # 移除粗体标记
            msg = re.sub(r'\n\s*-\n', '\n', msg)  # 移除单独的列表项标记
            msg = re.sub(r'\n{3,}', '\n\n', msg)  # 限制连续空行最多2个
            if msg and msg not in xhs_content:
                xhs_content.append(msg)

    # 如果没有 Message，从内容中提取关键信息
    if not xhs_content:
        # 提取 **Content:** 列表项作为备选
        for match in re.finditer(r'\*\*Content\*\*:\s*\n((?:-\s*.+\n?)+)', content, re.DOTALL):
            items = match.group(1).strip()
            # 移除列表标记，只保留内容
            items = re.sub(r'^-\s*', '', items, flags=re.MULTILINE)
            items = re.sub(r'\n+', ' ', items)  # 合并为单行
            if items:
                xhs_content.append(items.strip())

    # 如果还是空，使用源内容摘要
    if not xhs_content:
        # 尝试读取 source.md
        source_file = outline_path.parent / "source.md"
        if source_file.exists():
            with open(source_file, 'r', encoding='utf-8') as f:
                source_content = f.read()
                xhs_content = [source_content[:500]]
        else:
            xhs_content = [content[:500]]

    full_content = '\n\n'.join(xhs_content)

    # 限制长度
    title = title[:20]  # 标题最多20字
    full_content = full_content[:1000]  # 内容最多1000字

    return title, full_content


def find_images(session_dir: Path) -> List[Path]:
    """查找生成的图片文件"""
    images = sorted(session_dir.glob("*.png"))
    # 排除 preview 和 backup 文件
    images = [img for img in images if "preview" not in img.name.lower() and "backup" not in img.name.lower()]
    return images


def copy_images_to_mcp(images: List[Path], simulator: Optional[HumanBehaviorSimulator] = None) -> List[str]:
    """
    复制图片到 xiaohongshu-mcp 的 images 目录

    Args:
        images: 图片路径列表
        simulator: 行为模拟器，用于添加随机延迟

    Returns:
        容器内路径列表
    """
    mcp_images_dir = Path.home() / "xiaohongshu-mcp" / "images"
    mcp_images_dir.mkdir(parents=True, exist_ok=True)

    container_paths = []
    for i, img in enumerate(images):
        # 每张图片上传前随机延迟（模拟选择图片）
        if simulator:
            simulator.random_delay(1, 3)

        dest = mcp_images_dir / img.name
        shutil.copy(img, dest)
        container_paths.append(f"/app/images/{img.name}")

        # 图片间随机延迟
        if simulator and i < len(images) - 1:
            simulator.random_delay(0.5, 2)

    return container_paths


def _do_publish(api_url: str, title: str, content: str, container_paths: List[str]) -> dict:
    """实际执行发布的内部函数"""
    client = XiaohongshuMCPClient(api_url)
    return client.publish_content(
        title=title,
        content=content,
        images=container_paths
    )


def publish_session(session_dir: str, api_url: str = "http://localhost:18060",
                   anti_detect: bool = True,
                   simulator: Optional[HumanBehaviorSimulator] = None,
                   schedule_publish: bool = True,
                   scheduler: Optional[PublishScheduler] = None) -> dict:
    """
    发布一个 bxz-xhs 会话到小红书

    Args:
        session_dir: bxz-xhs 输出目录路径
        api_url: xiaohongshu-mcp API 地址
        anti_detect: 是否启用反检测（默认 True）
        simulator: 行为模拟器，如果为空则自动创建
        schedule_publish: 是否启用时间调度（默认 True）
        scheduler: 时间调度器，如果为空则自动创建

    Returns:
        发布结果
    """
    session_path = Path(session_dir).expanduser().resolve()

    if not session_path.exists():
        return {"success": False, "error": f"目录不存在: {session_path}"}

    outline_file = session_path / "outline.md"
    if not outline_file.exists():
        return {"success": False, "error": f"找不到 outline.md: {outline_file}"}

    # 创建或使用提供的模拟器
    if anti_detect and simulator is None:
        simulator = get_simulator()

    # 创建或使用提供的调度器
    if schedule_publish and scheduler is None:
        scheduler = PublishScheduler()

    # 时间调度：等待到合适的发布时间
    if schedule_publish and scheduler:
        print("\n" + "=" * 50)
        print("📅 发布时间调度")
        print("=" * 50)

        target_time = scheduler.suggest_publish_time(prefer_immediate=False)
        wait_for_publish_time(target_time, scheduler=scheduler)

    # 使用模拟器执行完整工作流
    if anti_detect and simulator:
        def publish_func():
            # 1. 提取标题和内容
            title, content = extract_from_outline(outline_file)

            # 2. 查找图片
            images = find_images(session_path)
            if not images:
                return {"success": False, "error": f"没有找到图片文件: {session_path}"}

            print(f"\n准备发布:")
            print(f"  标题: {title}")
            print(f"  内容长度: {len(content)} 字")
            print(f"  图片数量: {len(images)}")

            # 3. 复制图片到 mcp 目录（带延迟）
            container_paths = copy_images_to_mcp(images, simulator)

            # 4. 执行发布
            return _do_publish(api_url, title, content, container_paths)

        # 使用模拟器的工作流执行
        result = simulator.simulate_publish_workflow(publish_func)
    else:
        # 不使用反检测，直接发布
        # 1. 提取标题和内容
        title, content = extract_from_outline(outline_file)

        # 2. 查找图片
        images = find_images(session_path)
        if not images:
            return {"success": False, "error": f"没有找到图片文件: {session_path}"}

        print(f"准备发布:")
        print(f"  标题: {title}")
        print(f"  内容长度: {len(content)} 字")
        print(f"  图片数量: {len(images)}")

        # 3. 复制图片到 mcp 目录
        container_paths = copy_images_to_mcp(images)

        # 4. 发布
        result = _do_publish(api_url, title, content, container_paths)

    return result


def main():
    parser = argparse.ArgumentParser(
        description="bxz-xhs 自动发布到小红书（带反检测和时间调度）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 发布指定会话（默认启用反检测和时间调度）
  %(prog)s ~/Myxhs/maori-rock-carving

  # 禁用反检测（快速发布，风险较高）
  %(prog)s ~/Myxhs/ai-tools --no-anti-detect

  # 禁用时间调度（立即发布）
  %(prog)s ~/Myxhs/ai-tools --no-schedule

  # 同时禁用反检测和时间调度
  %(prog)s ~/Myxhs/ai-tools --no-anti-detect --no-schedule

  # 预览模式
  %(prog)s ~/Myxhs/ai-tools --dry-run
        """
    )
    parser.add_argument("session_dir", help="bxz-xhs 输出目录路径")
    parser.add_argument("--api-url", default="http://localhost:18060",
                       help="xiaohongshu-mcp API 地址 (默认: http://localhost:18060)")
    parser.add_argument("--dry-run", action="store_true",
                       help="仅预览，不实际发布")

    # 反检测选项
    parser.add_argument("--no-anti-detect", action="store_true",
                       help="禁用反检测功能（快速但有风险）")
    parser.add_argument("--min-delay", type=float, default=2.0,
                       help="最小操作延迟（秒，默认 2）")
    parser.add_argument("--max-delay", type=float, default=8.0,
                       help="最大操作延迟（秒，默认 8）")

    # 时间调度选项
    parser.add_argument("--no-schedule", action="store_true",
                       help="禁用时间调度（立即发布）")
    parser.add_argument("--prefer-immediate", action="store_true",
                       help="倾向于立即发布（如果当前时间合适）")

    args = parser.parse_args()

    print("=" * 50)
    print("bxz-xhs 自动发布到小红书")
    if not args.no_anti_detect:
        print("🛡️  反检测: 已启用")
    else:
        print("⚠️  反检测: 已禁用（风险较高）")
    if not args.no_schedule:
        print("📅 时间调度: 已启用")
    else:
        print("⚠️  时间调度: 已禁用（立即发布）")
    print("=" * 50)

    if args.dry_run:
        session_path = Path(args.session_dir).expanduser()
        outline_file = session_path / "outline.md"
        if outline_file.exists():
            title, content = extract_from_outline(outline_file)
            images = find_images(session_path)
            print(f"\n[预览模式]")
            print(f"标题: {title}")
            print(f"内容: {content[:200]}...")
            print(f"图片: {len(images)} 张")
            for img in images:
                print(f"  - {img.name}")
        else:
            print(f"错误: 找不到 {outline_file}")
        return

    # 配置反检测
    anti_detect = not args.no_anti_detect
    simulator = None
    if anti_detect:
        config = AntiDetectionConfig(
            min_action_delay=args.min_delay,
            max_action_delay=args.max_delay,
        )
        simulator = HumanBehaviorSimulator(config)

    # 配置时间调度
    schedule_publish = not args.no_schedule
    scheduler = None
    if schedule_publish:
        scheduler = PublishScheduler()

    # 执行发布
    result = publish_session(
        args.session_dir,
        args.api_url,
        anti_detect=anti_detect,
        simulator=simulator,
        schedule_publish=schedule_publish,
        scheduler=scheduler
    )

    if result.get("success"):
        print(f"\n✓ 发布成功!")
    else:
        print(f"\n✗ 发布失败: {result.get('error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()
