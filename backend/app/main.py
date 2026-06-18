from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .calculations import calculate_preview
from .schemas import EvaluationRequest
from .xlsx_generator import generate_workbook


app = FastAPI(title="Evalfuture API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


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
