# Evalfuture. Project Summary

_Last updated: July 29, 2026_

## Product

Evalfuture. is a professional property evaluation and rent-versus-buy comparison
website. Its static-first model compares purchase and financing costs, rent,
service charges, savings earnings, market movement, early settlement, resale,
and amortization under user-entered assumptions.

Public routes cover the homepage, services, methodology, about, contact, and the
free comparison. Contact details remain the approved placeholders:

- Phone: `xxxx`
- Email: `xxxxxx`

The output is informational and is not formal financial, investment, mortgage,
tax, or legal advice.

## Architecture and Behavior

- Next.js App Router, React, TypeScript, Tailwind CSS, and Recharts
- Static export beneath `/evalfuture/` for GitHub Pages
- Browser calculation engine and two-sheet XLSX fallback
- Optional FastAPI preview, richer workbook export, and inquiry endpoint
- Optional server-only Supabase storage and Resend notification
- Shared calculation fixtures executed by TypeScript and Python tests

The frontend remains fully usable for comparison and workbook download without
the backend. A configured API improves workbook formatting and enables inquiry
delivery. Backend export failure falls back to the browser workbook.

Core rules:

- AED is available and is the default display/assumption currency.
- Currency selection does not perform conversion.
- A 10-year term creates 10 market rows; a 25-year term creates 25.
- Default and Custom scenarios are supported.
- Blank Custom values fall back to the corresponding Default values.
- Retained Custom years survive loan-term changes.
- The exact label **Profit rate your savings can earn per year** is shared by the
  UI and workbook.
- Year 0 is display-only and is excluded from payments and amortization.
- Both workbooks contain exactly `Evalfuture` and `amort`.

## Contact and Security

`POST /api/leads` validates, normalizes, and limits inquiry input; rejects
unexpected fields; checks email and optional phone formats; includes a honeypot;
and applies an in-memory per-client rate limit. CORS is configured from an exact
origin allowlist. Errors do not expose credentials or stack traces.

Supabase uses a server-only service role and a table with RLS forced, privileges
revoked from `public`, `anon`, and `authenticated`, and no browser-facing policy.
Resend credentials and the notification destination are server-only. If neither
delivery service is configured, the API returns an unavailable status and the
static frontend does not claim success.

## Deployment

`frontend/next.config.ts` preserves:

```ts
output: "export"
trailingSlash: true
basePath: "/evalfuture"
assetPrefix: "/evalfuture/"
images: { unoptimized: true }
```

The Pages workflow builds inside `frontend`, creates `.nojekyll`, and uploads only
`frontend/out`. CI checks Python tests, frontend audit/typecheck/tests/configured
lint/build, and static export integrity.

The API must be deployed separately, such as on Render. External Supabase,
Resend, Cloudflare/DNS, monitoring, backup, and recovery settings are documented
in `docs/IMPLEMENTATION.md`; they are not provisioned by repository code.

## Verification Commands

```bash
cd frontend
npm ci
npm run typecheck
npm test
npm run lint
npm run build
npm run verify:export

cd ../backend
python3 -m pytest
```

`npm run lint` is currently a TypeScript `tsc --noEmit` check, not ESLint.

## Known Limitations

- The browser workbook includes chart-ready data but no embedded Excel chart.
- The API rate limiter is process-local and must be replaced or supplemented
  before horizontal scaling.
- Production services, credentials, contact details, monitoring, and retention
  policy require external configuration.
- The selector labels currency but does not fetch or apply exchange rates.

See `README.md`, `docs/ROADMAP.md`, and `docs/IMPLEMENTATION.md` for details.
