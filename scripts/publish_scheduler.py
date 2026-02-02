#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
发布时间调度器
模拟真实用户的发布时间模式，降低自动化检测
"""

import time
import random
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional, List


@dataclass
class TimeSlot:
    """时间段配置"""
    name: str
    start_hour: int  # 0-23
    end_hour: int
    weight: float  # 权重，用于随机选择
    description: str


class PublishScheduler:
    """
    发布时间调度器

    功能：
    1. 生成合理的发布时间
    2. 计算等待时间
    3. 判断当前时间是否适合发布
    """

    # 默认时间段配置（基于小红书用户活跃度）
    DEFAULT_TIME_SLOTS = [
        # 工作日时段
        TimeSlot("晨间", 7, 9, 0.3, "早起刷手机，通勤时间"),
        TimeSlot("午休", 12, 14, 0.5, "午饭后刷手机"),
        TimeSlot("下午茶", 15, 17, 0.4, "下午茶时间"),
        TimeSlot("晚高峰", 19, 23, 0.8, "晚饭后娱乐时间"),

        # 周末时段（权重更高）
        TimeSlot("周末晨", 8, 11, 0.6, "周末睡懒觉后"),
        TimeSlot("周末午后", 14, 18, 0.7, "周末下午休闲"),
        TimeSlot("周末晚", 20, 23, 0.9, "周末晚上娱乐"),
    ]

    # 避开的时段
    AVOID_SLOTS = [
        TimeSlot("深夜", 0, 6, 0, "活跃度极低"),
        TimeSlot("凌晨", 6, 7, 0, "大多数人还没起床"),
    ]

    def __init__(self, time_slots: Optional[List[TimeSlot]] = None,
                 avoid_slots: Optional[List[TimeSlot]] = None):
        """
        初始化调度器

        Args:
            time_slots: 可发布的时间段
            avoid_slots: 避开的时间段
        """
        self.time_slots = time_slots or self.DEFAULT_TIME_SLOTS
        self.avoid_slots = avoid_slots or self.AVOID_SLOTS

    def is_suitable_time(self, now: Optional[datetime] = None) -> bool:
        """
        判断当前时间是否适合发布

        Args:
            now: 当前时间，默认为系统时间

        Returns:
            True 表示适合发布
        """
        if now is None:
            now = datetime.now()

        hour = now.hour

        # 检查是否在避开时段
        for slot in self.avoid_slots:
            if slot.start_hour <= hour < slot.end_hour:
                return False

        # 检查是否在合适时段
        for slot in self.time_slots:
            if slot.start_hour <= hour < slot.end_hour:
                return True

        return False

    def get_next_suitable_time(self, now: Optional[datetime] = None,
                                max_wait_hours: int = 12) -> datetime:
        """
        获取下一个合适的发布时间

        Args:
            now: 当前时间
            max_wait_hours: 最大等待小时数

        Returns:
            下一个合适的发布时间
        """
        if now is None:
            now = datetime.now()

        # 如果当前时间就合适，返回当前时间
        if self.is_suitable_time(now):
            return now

        # 找下一个合适的时间段
        for hours in range(1, max_wait_hours + 1):
            check_time = now + timedelta(hours=hours)
            if self.is_suitable_time(check_time):
                # 在时间段内随机化
                return self._randomize_in_slot(check_time)

        # 如果没找到，返回明天早上
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=8, minute=random.randint(0, 59), second=0)

    def _randomize_in_slot(self, time: datetime) -> datetime:
        """
        在时间段内随机化

        Args:
            time: 某个合适的时间点

        Returns:
            随机化后的时间
        """
        hour = time.hour

        # 找到对应的时间段
        for slot in self.time_slots:
            if slot.start_hour <= hour < slot.end_hour:
                # 在时间段内随机偏移 ±30分钟
                offset_minutes = random.randint(-30, 30)
                result = time + timedelta(minutes=offset_minutes)

                # 确保不超出时间段
                if result.hour < slot.start_hour:
                    result = result.replace(hour=slot.start_hour)
                elif result.hour >= slot.end_hour:
                    result = result.replace(hour=slot.end_hour - 1)

                return result

        return time

    def suggest_publish_time(self, now: Optional[datetime] = None,
                             prefer_immediate: bool = False) -> datetime:
        """
        建议发布时间

        Args:
            now: 当前时间
            prefer_immediate: 是否倾向于立即发布（如果当前时间合适）

        Returns:
            建议的发布时间
        """
        if now is None:
            now = datetime.now()

        # 如果倾向于立即发布，且当前时间合适
        if prefer_immediate and self.is_suitable_time(now):
            # 添加小幅随机延迟（5-30分钟），看起来更自然
            delay = random.randint(5, 30)
            return now + timedelta(minutes=delay)

        # 否则返回下一个合适时间
        return self.get_next_suitable_time(now)

    def calculate_wait_time(self, target_time: datetime,
                           now: Optional[datetime] = None) -> float:
        """
        计算需要等待的时间

        Args:
            target_time: 目标发布时间
            now: 当前时间

        Returns:
            需要等待的秒数
        """
        if now is None:
            now = datetime.now()

        delta = target_time - now
        return max(0, delta.total_seconds())

    def format_wait_time(self, seconds: float) -> str:
        """
        格式化等待时间显示

        Args:
            seconds: 等待秒数

        Returns:
            格式化的字符串
        """
        if seconds < 60:
            return f"{seconds:.0f} 秒"
        elif seconds < 3600:
            minutes = seconds / 60
            return f"{minutes:.1f} 分钟"
        elif seconds < 86400:
            hours = seconds / 3600
            return f"{hours:.1f} 小时"
        else:
            days = seconds / 86400
            return f"{days:.1f} 天"

    def get_active_time_slots(self, now: Optional[datetime] = None) -> List[TimeSlot]:
        """
        获取当前活跃的时间段

        Args:
            now: 当前时间

        Returns:
            当前活跃的时间段列表
        """
        if now is None:
            now = datetime.now()

        hour = now.hour
        weekday = now.weekday()  # 0=周一, 6=周日

        active_slots = []

        for slot in self.time_slots:
            if slot.start_hour <= hour < slot.end_hour:
                # 周末的时段权重增加
                if weekday >= 5 and "周末" in slot.name:
                    slot.weight *= 1.5
                active_slots.append(slot)

        return active_slots


def schedule_publish(prefer_immediate: bool = False,
                     scheduler: Optional[PublishScheduler] = None) -> datetime:
    """
    获取建议的发布时间

    Args:
        prefer_immediate: 是否倾向于立即发布
        scheduler: 调度器实例

    Returns:
        建议的发布时间
    """
    if scheduler is None:
        scheduler = PublishScheduler()

    return scheduler.suggest_publish_time(prefer_immediate=prefer_immediate)


def wait_for_publish_time(target_time: datetime,
                          now: Optional[datetime] = None,
                          scheduler: Optional[PublishScheduler] = None) -> None:
    """
    等待到发布时间

    Args:
        target_time: 目标发布时间
        now: 当前时间
        scheduler: 调度器实例（用于格式化输出）
    """
    if now is None:
        now = datetime.now()

    if scheduler is None:
        scheduler = PublishScheduler()

    wait_seconds = scheduler.calculate_wait_time(target_time, now)

    if wait_seconds > 0:
        wait_str = scheduler.format_wait_time(wait_seconds)
        print(f"⏰ 等待到合适发布时间: {target_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"⏳ 需要等待: {wait_str}")
        time.sleep(wait_seconds)
    else:
        print(f"✅ 当前时间适合发布: {now.strftime('%Y-%m-%d %H:%M:%S')}")
