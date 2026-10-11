from __future__ import annotations

import asyncio

import httpx
import pytest

from app.lead_delivery import LeadDelivery, LeadDeliveryError
from app.schemas import LeadRequest
from app.settings import Settings


LEAD = LeadRequest(
    name="Sample User",
    email="user@example.com",
    purpose="buy",
    message="Please contact me about a detailed property evaluation.",
)


def _settings() -> Settings:
    return Settings(
        allowed_origins=(),
        trust_proxy_headers=False,
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="service-role",
        resend_api_key="resend-key",
        resend_from_email="from@example.com",
        notification_email="to@example.com",
    )


def test_notification_is_attempted_when_storage_raises(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    delivery = LeadDelivery(_settings())

    async def failing_store(client, lead):
        raise httpx.ConnectError("unreachable")

    async def working_notify(client, lead):
        return True

    monkeypatch.setattr(delivery, "_store", failing_store)
    monkeypatch.setattr(delivery, "_notify", working_notify)

    assert asyncio.run(delivery.deliver(LEAD)) == (False, True)
    assert "Supabase storage failed: ConnectError" in caplog.text
    assert LEAD.email not in caplog.text


def test_all_configured_integrations_failing_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    delivery = LeadDelivery(_settings())

    async def failing(client, lead):
        raise httpx.ReadTimeout("slow")

    monkeypatch.setattr(delivery, "_store", failing)
    monkeypatch.setattr(delivery, "_notify", failing)

    with pytest.raises(LeadDeliveryError):
        asyncio.run(delivery.deliver(LEAD))
