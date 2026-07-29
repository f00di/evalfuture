from __future__ import annotations

from html import escape

import httpx

from .schemas import LeadRequest
from .settings import Settings


class LeadDeliveryError(RuntimeError):
    pass


class LeadDelivery:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def configured(self) -> bool:
        return self.settings.supabase_enabled or self.settings.resend_enabled

    async def deliver(self, lead: LeadRequest) -> tuple[bool, bool]:
        tasks: list[tuple[str, object]] = []
        async with httpx.AsyncClient(timeout=8.0) as client:
            if self.settings.supabase_enabled:
                tasks.append(("stored", await self._store(client, lead)))
            if self.settings.resend_enabled:
                tasks.append(("notified", await self._notify(client, lead)))

        stored = any(name == "stored" and result is True for name, result in tasks)
        notified = any(name == "notified" and result is True for name, result in tasks)
        if tasks and not (stored or notified):
            raise LeadDeliveryError("Configured lead integrations were unavailable.")
        return stored, notified

    async def _store(self, client: httpx.AsyncClient, lead: LeadRequest) -> bool:
        assert self.settings.supabase_url
        assert self.settings.supabase_service_role_key
        response = await client.post(
            f"{self.settings.supabase_url.rstrip('/')}/rest/v1/leads",
            headers={
                "apikey": self.settings.supabase_service_role_key,
                "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json=lead.storage_payload(),
        )
        return response.status_code in {200, 201, 204}

    async def _notify(self, client: httpx.AsyncClient, lead: LeadRequest) -> bool:
        assert self.settings.resend_api_key
        assert self.settings.resend_from_email
        assert self.settings.notification_email
        safe = {
            key: escape(str(value))
            for key, value in lead.storage_payload().items()
            if value is not None
        }
        html = "".join(
            [
                "<h1>New Evalfuture. inquiry</h1>",
                f"<p><strong>Name:</strong> {safe['name']}</p>",
                f"<p><strong>Email:</strong> {safe['email']}</p>",
                f"<p><strong>Phone:</strong> {safe.get('phone') or 'Not provided'}</p>",
                f"<p><strong>Property location:</strong> {safe.get('property_location') or 'Not provided'}</p>",
                f"<p><strong>Purpose:</strong> {safe['purpose']}</p>",
                f"<p><strong>Comparison reference:</strong> {safe.get('comparison_reference') or 'Not provided'}</p>",
                f"<p><strong>Message:</strong><br>{safe['message']}</p>",
            ]
        )
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {self.settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": self.settings.resend_from_email,
                "to": [self.settings.notification_email],
                "subject": "New Evalfuture. property inquiry",
                "html": html,
                "reply_to": lead.email,
            },
        )
        return response.status_code in {200, 201, 202}
