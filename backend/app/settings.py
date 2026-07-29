from __future__ import annotations

import os
from dataclasses import dataclass


DEFAULT_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://f00di.github.io",
)


def _csv(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw = os.getenv(name, "")
    values = tuple(value.strip().rstrip("/") for value in raw.split(",") if value.strip())
    return values or default


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    allowed_origins: tuple[str, ...]
    trust_proxy_headers: bool
    supabase_url: str | None
    supabase_service_role_key: str | None
    resend_api_key: str | None
    resend_from_email: str | None
    notification_email: str | None

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            allowed_origins=_csv("ALLOWED_FRONTEND_ORIGINS", DEFAULT_ORIGINS),
            trust_proxy_headers=_bool("TRUST_PROXY_HEADERS"),
            supabase_url=os.getenv("SUPABASE_URL") or None,
            supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY") or None,
            resend_api_key=os.getenv("RESEND_API_KEY") or None,
            resend_from_email=os.getenv("RESEND_FROM_EMAIL") or None,
            notification_email=os.getenv("NOTIFICATION_EMAIL") or None,
        )

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def resend_enabled(self) -> bool:
        return bool(
            self.resend_api_key and self.resend_from_email and self.notification_email
        )
