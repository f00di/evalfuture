# Lead Capture Prompt

## Purpose

Add a future lead-capture flow for users who want a detailed evaluation or consulting session.

## When To Use It

Use this when adding client details, purpose fields, local storage, placeholder submission, or backend/external form integration.

## Ready-To-Paste Codex Prompt

```text
You are working on Evalfuture., a property comparison and consulting website.

Goal: Add lead capture while preserving the free comparison model.

Requirements:
- Add optional fields:
  Name
  Email
  Phone
  Property location
  Purpose: buy / rent / invest / rent out / refinance
- Keep contact placeholders unless real values are provided:
  Phone: xxxx
  Email: xxxxxx
- If no backend is available, store locally or add a clear "Send request" placeholder.
- Do not collect more data than needed.
- Do not break the calculator, dynamic loan-term rows, scenario logic, chart, or XLSX download.
- Preserve GitHub Pages static deployment under /evalfuture/.
- Avoid making financial-advice claims.

Inspect the current frontend structure before editing. Run available checks and summarize user-visible behavior.
```

## Acceptance Criteria

- Lead capture is optional and does not block the calculator.
- Form labels are clear and accessible.
- Placeholder submission behavior is explicit.
- Build succeeds.
