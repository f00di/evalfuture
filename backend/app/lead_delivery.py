from __future__ import annotations

import logging
from collections.abc import Awaitable
from html import escape

import httpx

from .schemas import LeadRequest
from .settings import Settings


logger = logging.getLogger(__name__)


class LeadDeliveryError(RuntimeError):
    pass


class LeadDelivery:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def configured(self) -> bool:
        return self.settings.supabase_enabled or self.settings.resend_enabled

    async def deliver(self, lead: LeadRequest) -> tuple[bool, bool]:
        stored = notified = False
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Each integration is attempted even if the other one fails.
            if self.settings.supabase_enabled:
                stored = await self._attempt("Supabase storage", self._store(client, lead))
            if self.settings.resend_enabled:
                notified = await self._attempt("Resend notification", self._notify(client, lead))

        if self.configured and not (stored or notified):
            raise LeadDeliveryError("Configured lead integrations were unavailable.")
        return stored, notified

    @staticmethod
    async def _attempt(name: str, call: Awaitable[bool]) -> bool:
        try:
            succeeded = await call
        except httpx.HTTPError as exc:
            # Log the failure type only; lead details are personal data.
            logger.error("Lead %s failed: %s", name, type(exc).__name__)
            return False
        return succeeded

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
        if response.status_code not in {200, 201, 204}:
            logger.error("Supabase returned HTTP %s for a lead insert.", response.status_code)
            return False
        return True

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
        if response.status_code not in {200, 201, 202}:
            logger.error("Resend returned HTTP %s for a lead notification.", response.status_code)
            return False
        return True
