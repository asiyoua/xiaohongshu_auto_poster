#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
小红书反爬虫检测工具
提供各种拟人化行为，降低自动化检测风险
"""

import time
import random
from typing import List, Callable, Optional
from dataclasses import dataclass


@dataclass
class AntiDetectionConfig:
    """反检测配置"""
    # 延迟配置（秒）
    min_action_delay: float = 2.0
    max_action_delay: float = 8.0
    min_upload_delay: float = 3.0
    max_upload_delay: float = 10.0

    # 浏览行为配置
    enable_browsing: bool = True  # 是否启用随机浏览
    min_posts_to_browse: int = 3
    max_posts_to_browse: int = 5
    min_view_time: float = 5.0  # 每个帖子最少停留时间
    max_view_time: float = 15.0  # 每个帖子最多停留时间

    # 滚动行为
    enable_scrolling: bool = True
    min_scroll_count: int = 2
    max_scroll_count: int = 5

    # 限流配置
    min_publish_interval: float = 30 * 60  # 30分钟
    max_publish_interval: float = 4 * 60 * 60  # 4小时

    # 重试配置
    max_retries: int = 3
    initial_retry_delay: float = 60  # 首次重试延迟（秒）
    retry_backoff_multiplier: float = 2.0  # 退避乘数


class HumanBehaviorSimulator:
    """
    人类行为模拟器

    功能：
    1. 随机延迟
    2. 随机浏览行为
    3. 模拟鼠标轨迹
    4. 限流控制
    """

    def __init__(self, config: Optional[AntiDetectionConfig] = None):
        self.config = config or AntiDetectionConfig()
        self.last_publish_time: Optional[float] = None

    def random_delay(self, min_delay: Optional[float] = None,
                     max_delay: Optional[float] = None) -> float:
        """
        随机延迟

        Args:
            min_delay: 最小延迟（秒），默认使用配置
            max_delay: 最大延迟（秒），默认使用配置

        Returns:
            实际延迟时间
        """
        min_d = min_delay or self.config.min_action_delay
        max_d = max_delay or self.config.max_action_delay
        delay = random.uniform(min_d, max_d)
        time.sleep(delay)
        return delay

    def simulate_browsing(self, post_urls: Optional[List[str]] = None) -> None:
        """
        模拟浏览行为

        在发布前随机浏览一些帖子，模拟真实用户行为

        Args:
            post_urls: 要浏览的帖子 URL 列表，如果为空则只做延迟
        """
        if not self.config.enable_browsing:
            return

        # 随机决定浏览几个帖子
        count = random.randint(
            self.config.min_posts_to_browse,
            self.config.max_posts_to_browse
        )

        if post_urls:
            # 有具体 URL，模拟浏览
            urls_to_browse = random.sample(post_urls, min(count, len(post_urls)))
            for i, url in enumerate(urls_to_browse):
                # 浏览前的"思考"时间
                self.random_delay(1, 3)
                # TODO: 实际访问 URL（需要浏览器支持）
                # self._visit_post(url)
                # 停留时间
                view_time = random.uniform(
                    self.config.min_view_time,
                    self.config.max_view_time
                )
                time.sleep(view_time)

                # 最后一个帖子不需要额外延迟
                if i < len(urls_to_browse) - 1:
                    self.random_delay(2, 5)
        else:
            # 没有 URL，用延迟模拟浏览时间
            total_browse_time = random.uniform(
                self.config.min_view_time * count,
                self.config.max_view_time * count
            )
            # 分段延迟，模拟在不同帖子间切换
            segments = count
            for _ in range(segments):
                segment_time = total_browse_time / segments
                time.sleep(segment_time + random.uniform(-2, 2))

    def simulate_scrolling(self, scroll_count: Optional[int] = None) -> None:
        """
        模拟滚动行为

        Args:
            scroll_count: 滚动次数，如果为空则随机
        """
        if not self.config.enable_scrolling:
            return

        count = scroll_count or random.randint(
            self.config.min_scroll_count,
            self.config.max_scroll_count
        )

        for _ in range(count):
            # 滚动间隔
            self.random_delay(0.5, 2)
            # TODO: 实际滚动（需要浏览器支持）
            # 这里只是延迟模拟

    def check_rate_limit(self) -> float:
        """
        检查并执行限流

        Returns:
            需要等待的时间（秒）
        """
        if self.last_publish_time is None:
            return 0

        elapsed = time.time() - self.last_publish_time
        min_interval = self.config.min_publish_interval

        if elapsed < min_interval:
            return min_interval - elapsed

        return 0

    def wait_for_rate_limit(self) -> None:
        """执行限流等待"""
        wait_time = self.check_rate_limit()
        if wait_time > 0:
            print(f"⏳ 限流等待: {wait_time / 60:.1f} 分钟")
            time.sleep(wait_time)

    def execute_with_retry(self, func: Callable, *args, **kwargs) -> any:
        """
        带重试和退避的执行

        Args:
            func: 要执行的函数
            *args, **kwargs: 函数参数

        Returns:
            函数执行结果

        Raises:
            Exception: 重试次数用完后仍失败
        """
        last_error = None
        delay = self.config.initial_retry_delay

        for attempt in range(self.config.max_retries):
            try:
                # 执行前随机延迟
                if attempt > 0:
                    print(f"⏳ 重试前等待 {delay} 秒...")
                    time.sleep(delay)

                result = func(*args, **kwargs)

                # 成功后更新发布时间
                if "publish" in str(func):
                    self.last_publish_time = time.time()

                return result

            except Exception as e:
                last_error = e
                print(f"⚠️  尝试 {attempt + 1}/{self.config.max_retries} 失败: {e}")

                # 指数退避
                delay *= self.config.retry_backoff_multiplier
                delay += random.uniform(-10, 10)  # 添加随机性

        # 所有重试都失败
        raise last_error

    def simulate_publish_workflow(self, publish_func: Callable,
                                  post_urls: Optional[List[str]] = None) -> any:
        """
        模拟完整的发布工作流

        Args:
            publish_func: 实际的发布函数
            post_urls: 浏览的帖子 URL 列表

        Returns:
            发布结果
        """
        print("🤖 开始模拟人类发布行为...")

        # 1. 限流检查
        print("1️⃣ 检查限流...")
        self.wait_for_rate_limit()

        # 2. 随机浏览
        print("2️⃣ 随机浏览帖子...")
        self.simulate_browsing(post_urls)

        # 3. 进入发布页面
        print("3️⃣ 进入发布页面...")
        self.random_delay(2, 5)

        # 4. 模拟滚动浏览
        if self.config.enable_scrolling:
            print("4️⃣ 浏览页面...")
            self.simulate_scrolling()

        # 5. 填写内容
        print("5️⃣ 填写发布内容...")
        self.random_delay(1, 3)

        # 6. 上传图片（每个图片间有延迟）
        # 这个在实际发布函数中处理

        # 7. 发布前"思考"
        print("7️⃣ 发布前确认...")
        self.random_delay(3, 8)

        # 8. 执行发布（带重试）
        print("8️⃣ 发布内容...")
        result = self.execute_with_retry(publish_func)

        # 9. 发布后停留（模拟查看结果）
        print("9️⃣ 查看发布结果...")
        self.random_delay(5, 15)

        print("✅ 发布流程完成")

        return result


# 单例实例（默认配置）
_default_simulator: Optional[HumanBehaviorSimulator] = None


def get_simulator(config: Optional[AntiDetectionConfig] = None) -> HumanBehaviorSimulator:
    """获取默认的模拟器实例"""
    global _default_simulator
    if _default_simulator is None or config is not None:
        _default_simulator = HumanBehaviorSimulator(config)
    return _default_simulator
