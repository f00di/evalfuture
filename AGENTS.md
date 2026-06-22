# Evalfuture. Agent Guide

## 1. Project Overview

Evalfuture. is a property evaluation and rent-vs-buy comparison website. The product helps users compare renting, renting out, buying outright, buying with mortgage or other financing, loan payments, financing costs, interest, service charges, rental returns, market value rise/drop, and long-term resale outcomes.

The brand name is **Evalfuture.** with the trailing period. Preserve it in product copy, UI labels, metadata, and generated documents unless a technical identifier cannot include punctuation.

## 2. Current Business Goal

The site should feel like a professional finance/accounting/property consulting website first, with the comparison model available through the main comparison flow. The calculator must remain functional, but it should not be the only homepage experience.

Core service positioning:
- Free Initial Comparison
- Detailed Property Evaluation
- Consulting Session
- Download Your Excel Comparison

Do not make guaranteed-return claims. Do not describe the output as formal financial advice.

## 3. Tech Stack

- Frontend: Next.js App Router, TypeScript, React
- Styling: Tailwind CSS
- Charts: Recharts
- Static hosting target: GitHub Pages
- Backend: FastAPI calculation/export service exists, but the GitHub Pages deployment must work as a static frontend
- Client XLSX fallback: `frontend/src/lib/workbook.ts`

## 4. Routes and Base Path

The production site is intended to run at:

```text
https://f00di.github.io/evalfuture/
```

Next.js is statically exported from `frontend/out` and must preserve:

```ts
output: "export"
basePath: "/evalfuture"
assetPrefix: "/evalfuture/"
images: { unoptimized: true }
```

Do not break GitHub Pages compatibility under `/evalfuture/`. Internal anchor links can use hash fragments such as `#free-comparison`; asset and route paths must continue to work with the base path.

## 5. Commands

From the repository root:

```bash
cd frontend
npm ci
npm run dev -- --port 3000
npm run typecheck
npm run build
npm run lint
```

Backend tests, if backend dependencies are installed:

```bash
cd backend
python -m pytest
```

Notes:
- The frontend package currently has no `npm test` script.
- `npm run lint` uses the configured package script; if the framework no longer supports it, report the failure clearly instead of claiming lint passed.

## 6. Styling Rules

Use a modern finance/accounting/property consulting style:
- Deep navy: `#0B1F33`
- Dark blue: `#102A43`
- Slate: `#334155`
- Emerald/teal: `#0F766E`
- Muted gold: `#D4AF37`
- Soft cream: `#F8FAF6`
- Light blue-gray: `#E7F0F7`
- Amber input highlight: `#FEF3C7`
- Positive green: `#047857`
- Risk red: `#B91C1C`

Keep UI professional, calm, and easy to scan. Use amber/yellow only for model input cells. Avoid unsupported financial-advice claims. Keep contact placeholders:

```text
Phone: xxxx
Email: xxxxxx
```

## 7. Calculation and Model Rules

Preserve the working comparison model:
- Keep the calculator dynamic based on loan term.
- Loan term 10 means exactly 10 market variation rows.
- Loan term 25 means exactly 25 market variation rows.
- Preserve default/custom scenario logic.
- Keep default market variation and custom market variation tables.
- Keep KPI cards, chart, amortization summary, and rent-vs-buy comparison.
- Keep input names aligned with the original Excel assumptions.
- Do not hardcode calculations only in the UI if the XLSX export needs equivalent model data.

## 8. XLSX Export Rules

Do not break XLSX download. The static GitHub Pages build must provide the best available client-side export. Backend export can be used only when `NEXT_PUBLIC_API_BASE_URL` is configured.

The expected workbook structure is two sheets:

```text
Evalfuture
amort
```

If a future change adds ExcelJS or a backend formula export, preserve the two-sheet workbook concept and keep formulas/calculations consistent with the preview.

## 9. Deployment Rules

GitHub Pages deployment should:
- Trigger on pushes to `main`
- Build in `frontend`
- Upload `frontend/out`
- Add `.nojekyll` to the output artifact so `_next` assets are served
- Use GitHub Pages source: GitHub Actions

Do not deploy the repository root. Do not replace the app with README content. `README.md` is documentation only.

## 10. Common Mistakes to Avoid

- Removing the trailing period from `Evalfuture.`
- Serving the README or repository root instead of the frontend static export
- Breaking `/evalfuture/` asset paths
- Replacing dynamic market rows with fixed rows
- Losing the Default/Custom scenario selector
- Hiding or removing XLSX export
- Making unsupported financial, investment, mortgage, tax, or legal advice claims
- Using contact details other than the placeholders unless the user explicitly provides real details
- Adding dependencies without a clear reason
- Reporting tests as passed when no test runner exists

## 11. Definition of Done

A change is done when:
- The homepage opens as a professional Evalfuture. business site
- The main CTA clearly opens the comparison flow
- The calculator remains reachable and functional
- Loan-term market rows stay dynamic
- The chart and preview metrics update from user input
- XLSX download still works or a limitation is clearly documented
- The app builds successfully for static export
- GitHub Pages compatibility under `/evalfuture/` is preserved
- Relevant docs are updated when workflow, deployment, or model behavior changes
