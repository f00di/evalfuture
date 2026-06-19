# XLSX Export Prompt

## Purpose

Improve the Excel workbook download and keep it aligned with the preview model.

## When To Use It

Use this when adding formulas, improving workbook styling, adding ExcelJS, fixing sheet names, or aligning static/client and backend export paths.

## Ready-To-Paste Codex Prompt

```text
You are working on Evalfuture., a property comparison website with XLSX export.

Goal: Improve or fix the Excel workbook export without breaking GitHub Pages.

Requirements:
- Preserve the workbook concept: two sheets named Evalfuture and amort.
- Preserve "Download Your Excel Comparison."
- Keep client-side export working on GitHub Pages without a backend.
- If using backend export, only use it when NEXT_PUBLIC_API_BASE_URL is configured.
- Keep preview calculations and workbook data aligned.
- Do not hardcode UI-only calculations if workbook formulas/data need the same logic.
- Preserve dynamic loan-term market rows.
- Preserve Default/Custom scenario logic.
- Preserve /evalfuture/ static deployment.

Inspect frontend/src/lib/workbook.ts, frontend/src/lib/model.ts, and backend/app/xlsx_generator.py before editing. Run available checks and test the download path where feasible.
```

## Acceptance Criteria

- XLSX download still produces a usable workbook.
- Workbook includes the expected two sheets.
- Exported rows match the selected loan term.
- Build succeeds.
- Any browser/backend limitation is clearly documented.
