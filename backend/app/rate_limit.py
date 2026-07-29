from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock


class InMemoryRateLimiter:
    """Small single-instance limiter suitable for an initial Render deployment."""

    def __init__(
        self,
        limit: int = 5,
        window_seconds: int = 15 * 60,
        max_keys: int = 10_000,
    ) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self.max_keys = max_keys
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            self._remove_expired(cutoff)
            if key not in self._attempts and len(self._attempts) >= self.max_keys:
                return False
            attempts = self._attempts[key]
            if len(attempts) >= self.limit:
                return False
            attempts.append(now)
            return True

    def _remove_expired(self, cutoff: float) -> None:
        expired_keys: list[str] = []
        for key, attempts in self._attempts.items():
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if not attempts:
                expired_keys.append(key)
        for key in expired_keys:
            self._attempts.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._attempts.clear()
