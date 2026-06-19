# Calculation Fixes Prompt

## Purpose

Fix or validate rent-vs-buy, financing, amortization, market variation, or scenario calculations.

## When To Use It

Use this when numbers appear wrong, loan-term rows are incorrect, scenario behavior is broken, or frontend/backend calculations diverge.

## Ready-To-Paste Codex Prompt

```text
You are working on Evalfuture., a property comparison website with frontend model logic and a FastAPI backend model.

Goal: Fix calculation behavior while preserving UI and deployment compatibility.

Requirements:
- Inspect frontend/src/lib/model.ts and backend/app/calculations.py before editing.
- Preserve loan-term dynamic behavior: loan term 10 = exactly 10 rows, loan term 25 = exactly 25 rows.
- Preserve Default/Custom scenario selection.
- Keep market variation, comparison rows, amortization summary, and KPI cards consistent.
- Do not hardcode values only in the UI.
- If frontend and backend logic both exist, keep them aligned or document intentional differences.
- Preserve XLSX export behavior.
- Preserve GitHub Pages static build under /evalfuture/.

Add or update tests where the repo setup supports it. Run available checks and report any gaps.
```

## Acceptance Criteria

- Calculations are consistent across affected outputs.
- Dynamic market row counts are correct.
- Scenario selection changes selected values correctly.
- Build succeeds.
- Any test gaps are documented.
