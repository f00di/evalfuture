from __future__ import annotations

from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from app import main
from app.lead_delivery import LeadDeliveryError


VALID_LEAD = {
    "name": "Sample User",
    "email": "user@example.com",
    "phone": "+971 50 123 4567",
    "propertyLocation": "Abu Dhabi",
    "purpose": "buy",
    "message": "Please contact me about a detailed property evaluation.",
    "comparisonReference": "EF-TEST",
    "companyWebsite": "",
}


class DeliveryStub:
    def __init__(self, *, configured: bool, fails: bool = False) -> None:
        self.configured = configured
        self.fails = fails
        self.payloads = []

    async def deliver(self, payload):
        if self.fails:
            raise LeadDeliveryError("upstream unavailable")
        self.payloads.append(payload)
        return True, False


@pytest.fixture(autouse=True)
def reset_lead_state(monkeypatch: pytest.MonkeyPatch):
    main.lead_rate_limiter.clear()
    monkeypatch.setattr(main, "settings", replace(main.settings, trust_proxy_headers=False))
    yield
    main.lead_rate_limiter.clear()


def test_health_reports_lead_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "lead_delivery", DeliveryStub(configured=False))
    response = TestClient(main.app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "leadCapture": "not-configured"}


def test_unconfigured_lead_service_returns_safe_disabled_state(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(main, "lead_delivery", DeliveryStub(configured=False))
    response = TestClient(main.app).post("/api/leads", json=VALID_LEAD)

    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]


def test_honeypot_returns_generic_success_without_delivery(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    delivery = DeliveryStub(configured=True)
    monkeypatch.setattr(main, "lead_delivery", delivery)
    response = TestClient(main.app).post(
        "/api/leads",
        json={**VALID_LEAD, "companyWebsite": "https://bot.example"},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "received"
    assert delivery.payloads == []


def test_lead_validation_rejects_malformed_or_normalized_empty_values() -> None:
    client = TestClient(main.app)
    bad_email = client.post(
        "/api/leads",
        json={**VALID_LEAD, "email": "not-an-email"},
    )
    empty_name = client.post(
        "/api/leads",
        json={**VALID_LEAD, "name": "  "},
    )

    assert bad_email.status_code == 422
    assert empty_name.status_code == 422


def test_successful_lead_is_normalized_and_delivered(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    delivery = DeliveryStub(configured=True)
    monkeypatch.setattr(main, "lead_delivery", delivery)
    response = TestClient(main.app).post(
        "/api/leads",
        json={**VALID_LEAD, "name": "  Sample   User  ", "email": "USER@EXAMPLE.COM"},
    )

    assert response.status_code == 201
    assert delivery.payloads[0].name == "Sample User"
    assert delivery.payloads[0].email == "user@example.com"


def test_upstream_failure_returns_safe_message(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        main,
        "lead_delivery",
        DeliveryStub(configured=True, fails=True),
    )
    response = TestClient(main.app).post("/api/leads", json=VALID_LEAD)

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "The inquiry service is temporarily unavailable. Please try again later."
    )


def test_rate_limit_rejects_sixth_request(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "lead_delivery", DeliveryStub(configured=True))
    client = TestClient(main.app)

    responses = [client.post("/api/leads", json=VALID_LEAD) for _ in range(6)]

    assert [response.status_code for response in responses[:5]] == [201] * 5
    assert responses[5].status_code == 429


def test_cors_allows_configured_origin_only() -> None:
    client = TestClient(main.app)
    allowed = client.options(
        "/api/leads",
        headers={
            "Origin": "https://f00di.github.io",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    unknown = client.options(
        "/api/leads",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert allowed.headers["access-control-allow-origin"] == "https://f00di.github.io"
    assert "access-control-allow-origin" not in unknown.headers
