# Evalfuture.

Evalfuture. is a finance/accounting-style property evaluation model. It provides an interactive web preview and exports a two-sheet XLSX workbook with formulas, formatting, dynamic market rows, amortization logic, and a chart.

The downloaded workbook contains exactly two visible sheets:

- `Evalfuture`
- `amort`

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts
- Backend/API: FastAPI, Pydantic
- XLSX generation: Python `xlsxwriter`

## Project Structure

```text
backend/
  app/
    calculations.py      # Preview calculation engine
    main.py              # FastAPI app
    schemas.py           # Pydantic request/response models
    xlsx_generator.py    # Two-sheet workbook generation
  tests/
frontend/
  src/app/page.tsx       # Dashboard UI
  src/lib/model.ts       # Frontend types and formatting helpers
```

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

Endpoints:

- `POST /api/preview` returns calculated JSON for the website preview.
- `POST /api/export` returns the downloadable `.xlsx` workbook.
- `GET /api/health` returns a basic health check.

API percentage fields use decimal values. For example, `20%` is sent as `0.2`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

If the backend runs on a different host or port:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

## Tests

Backend tests cover the default calculation case, dynamic row counts, custom scenario behavior, and XLSX chart range generation.

```bash
cd backend
source .venv/bin/activate
pytest
```

Frontend type checking:

```bash
cd frontend
npm run typecheck
```

## GitHub

This repo includes GitHub Actions CI at `.github/workflows/ci.yml`.

On every push to `main` and every pull request, GitHub runs:

- Backend dependency install
- Backend unit and XLSX integration tests
- Frontend dependency install with `npm ci`
- Frontend dependency audit
- Frontend TypeScript check
- Frontend production build

### Run in GitHub Codespaces

The repo includes a `.devcontainer/devcontainer.json` for GitHub Codespaces.

1. Open the repository on GitHub.
2. Choose **Code** > **Codespaces** > **Create codespace on main**.
3. Wait for dependency installation to finish.
4. In VS Code, run these tasks:
   - `Evalfuture: backend API`
   - `Evalfuture: frontend`
5. Open the forwarded frontend port `3000`.

The backend runs on port `8000`, and the frontend expects it at `http://localhost:8000` by default.

### GitHub Pages Note

GitHub Pages can host static frontend files, but it cannot run the FastAPI backend or Python `xlsxwriter` export service. The full app needs a running backend. For a public hosted version, deploy the backend to a Python-capable host and set the frontend environment variable:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com
```

## Dynamic Workbook Behavior

- Loan term controls visible market rows.
- `loanTermYears = 10` produces market table ranges `A23:C34` and `E23:G34`.
- `loanTermYears = 25` expands the market tables, comparison table, formulas, and chart ranges to 25 rows.
- The selected scenario cell is placed at `H24`.
- Comparison column `L` uses custom variation values only when scenario is `Custom` and the custom cell is not blank. Otherwise it falls back to the default variation.
- Workbook formulas are written with cached values where practical and the workbook is set to automatic recalculation.
