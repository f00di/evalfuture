from __future__ import annotations

import httpx
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .calculations import calculate_preview
from .lead_delivery import LeadDelivery, LeadDeliveryError
from .rate_limit import InMemoryRateLimiter
from .schemas import EvaluationRequest, LeadRequest, LeadResponse
from .settings import Settings
from .xlsx_generator import generate_workbook


settings = Settings.from_env()
lead_delivery = LeadDelivery(settings)
lead_rate_limiter = InMemoryRateLimiter()
app = FastAPI(title="Evalfuture API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "leadCapture": "configured" if lead_delivery.configured else "not-configured",
    }


@app.post("/api/preview")
def preview(request: EvaluationRequest):
    try:
        return calculate_preview(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/export")
def export_workbook(request: EvaluationRequest) -> Response:
    try:
        workbook_bytes = generate_workbook(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    safe_name = "".join(
        char if char.isalnum() or char in ("-", "_") else "-"
        for char in request.propertyName.strip()
    ).strip("-")
    filename = f"Evalfuture-{safe_name or 'model'}.xlsx"
    return Response(
        workbook_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post(
    "/api/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_lead(payload: LeadRequest, request: Request) -> LeadResponse:
    if payload.companyWebsite:
        return LeadResponse(
            status="received",
            message="Your request has been received.",
        )

    client_host = request.client.host if request.client else "unknown"
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if forwarded:
            client_host = forwarded
    if not lead_rate_limiter.allow(client_host):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before trying again.",
        )

    if not lead_delivery.configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Online inquiries are not configured yet. Please use the listed contact details.",
        )

    try:
        await lead_delivery.deliver(payload)
    except (LeadDeliveryError, httpx.HTTPError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The inquiry service is temporarily unavailable. Please try again later.",
        ) from exc

    return LeadResponse(
        status="received",
        message="Your inquiry was received. Evalfuture. will review the details provided.",
    )
