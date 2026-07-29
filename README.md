# Evalfuture.

Evalfuture. is a static-first property evaluation and rent-versus-buy comparison
website. It combines a professional consulting site with an interactive model for
purchase costs, financing, rent, service charges, savings earnings, market
movement, early settlement, resale, and amortization.

Results are based on user-entered assumptions and are informational. They are not
formal financial, investment, mortgage, tax, or legal advice.

## Architecture

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, Recharts
- Browser calculations: `frontend/src/lib/model.ts`
- Browser XLSX fallback: `frontend/src/lib/workbook.ts`
- Optional API: FastAPI, Pydantic, HTTPX, XlsxWriter
- Optional lead services: Supabase storage and Resend notification
- Hosting: GitHub Pages frontend and a separately deployed API, such as Render

The static frontend remains useful without the API: calculations, results,
charts, and the two-sheet browser workbook all run locally in the browser. When
`NEXT_PUBLIC_API_BASE_URL` is configured, the frontend first requests the richer
backend export and falls back to the browser workbook if that request fails.

Data flows through:

1. The questionnaire validates and normalizes user input.
2. The browser model calculates results and chart data.
3. The results dashboard renders KPIs, summaries, chart, and table alternatives.
4. Workbook download tries the optional backend, then safely falls back locally.
5. The backend independently validates the same request before preview or export.
6. Shared JSON vectors are exercised by both TypeScript and Python tests to
   detect calculation drift.

## Repository Layout

```text
backend/
  app/                 FastAPI routes, validation, calculations, lead delivery
  supabase/leads.sql   Optional server-only lead-storage schema
  tests/               API, calculation, rate-limit, and workbook tests
frontend/
  scripts/             Static-export verification
  src/app/             Public routes and metadata
  src/components/      Calculator, dashboard, site, and local UI components
  src/lib/             Browser model, site data, and workbook generator
shared/
  calculation-vectors.json
docs/
```

## Calculation and Workbook Rules

- AED is the default display currency. Changing currency changes labels and
  formatting only; it does not perform exchange-rate conversion.
- A 10-year term creates exactly 10 yearly model rows; a 25-year term creates 25.
- Custom scenario blanks fall back to the same-year Default value.
- Loan-term changes preserve existing Custom values for retained years, truncate
  removed years, and add blank fallback values for newly added years.
- Early-payment `percent` applies to the outstanding settlement balance.
- Early-payment `amount` is a fixed fee/cap limited to that balance.
- The savings assumption is labelled exactly **Profit rate your savings can earn
  per year** in the UI and workbook.
- Year 0 is chart/display-only: variation is 0%, selling price is the property net
  purchase price, and no Year 0 payment or amortization row is created.
- Both exporters create exactly two visible sheets: `Evalfuture` and `amort`.
- The browser workbook includes chart-ready data; the backend workbook can include
  richer formatting and an embedded chart.

## Local Development

Frontend:

```bash
cd frontend
npm ci
npm run dev -- --port 3000
```

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

To connect the two locally, copy the example variables without committing the
result:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`. This variable is public by
design and must contain only the API origin—never a key or secret.

## API

- `GET /api/health` — health and lead-integration configuration status
- `POST /api/preview` — validated calculated JSON
- `POST /api/export` — richer two-sheet XLSX workbook
- `POST /api/leads` — validated, rate-limited inquiry submission

API percentage values are decimals: `20%` is sent as `0.2`.

The lead endpoint normalizes input, limits lengths, validates email/phone,
rejects unexpected fields, uses a honeypot, applies a five-attempt-per-15-minute
in-memory limit per client, and returns non-sensitive errors. It sends only the
fields shown in the contact form; full calculator assumptions are not submitted.
If neither optional delivery service is configured, it returns `503` and the
frontend explicitly says that online inquiries are unavailable.

Environment variables:

| Scope | Variable | Purpose |
| --- | --- | --- |
| Browser-safe | `NEXT_PUBLIC_API_BASE_URL` | Optional FastAPI origin |
| Server-only | `ALLOWED_FRONTEND_ORIGINS` | Exact comma-separated CORS origins |
| Server-only | `TRUST_PROXY_HEADERS` | Trust forwarded IP only behind a trusted proxy |
| Server-only | `SUPABASE_URL` | Optional Supabase project URL |
| Server-only | `SUPABASE_SERVICE_ROLE_KEY` | Optional lead insert credential |
| Server-only | `RESEND_API_KEY` | Optional email credential |
| Server-only | `RESEND_FROM_EMAIL` | Verified sending identity |
| Server-only | `NOTIFICATION_EMAIL` | Inquiry notification destination |

Never expose the Supabase service-role or Resend keys through a
`NEXT_PUBLIC_` variable. See [deployment and operations](docs/IMPLEMENTATION.md)
for setup, RLS, monitoring, recovery, and rollback guidance.

## Verification

Frontend:

```bash
cd frontend
npm ci
npm run typecheck
npm test
npm run lint
npm run build
npm run verify:export
```

`npm run lint` currently runs `tsc --noEmit`; no ESLint configuration is
present. Vitest covers pure model behavior, validation-sensitive scenarios, the
Year 0 chart baseline, and the browser workbook ZIP/sheet structure.

Backend:

```bash
cd backend
python3 -m pytest
```

The Python suite covers calculations, shared vectors, invalid inputs, API lead
behavior, rate limiting, and workbook structure/formulas.

## GitHub Pages

The public frontend is exported below `/evalfuture/`. The required settings remain
in `frontend/next.config.ts`:

```ts
output: "export"
trailingSlash: true
basePath: "/evalfuture"
assetPrefix: "/evalfuture/"
images: { unoptimized: true }
```

`.github/workflows/deploy.yml` builds inside `frontend`, adds
`frontend/out/.nojekyll`, uploads only `frontend/out`, and deploys it on pushes to
`main`. Trailing-slash route output supports direct navigation on GitHub Pages.

The API cannot run on GitHub Pages. Deploy it separately only when backend export
or inquiry delivery is required, then rebuild the frontend with the public API
base URL. No production secret is required for ordinary pull-request CI.

## Known Limitations

- Browser-generated workbooks do not embed an Excel chart object.
- The in-memory rate limiter is per API instance; use a shared store or
  edge-provider limit before horizontally scaling.
- Supabase, Resend, Render, DNS, monitoring, backups, and real contact details
  require external configuration and credentials.
- Phone `xxxx` and email `xxxxxx` are intentional placeholders and must not be
  replaced without approved details.
- No live currency conversion is provided.
