# Lead Capture Prompt

## Purpose

Add a future lead-capture flow for users who want a detailed evaluation or consulting session.

## When To Use It

Use this when changing client details, inquiry submission, or the optional
backend delivery integrations.

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
- Do not store personal information in local storage.
- Submit only through `NEXT_PUBLIC_API_BASE_URL`.
- If the API or delivery services are unavailable, show an explicit failure or
  not-configured message and retain the approved contact placeholders.
- Keep private Supabase and Resend keys server-only.
- Preserve Pydantic validation, normalization, length limits, a honeypot, rate
  limiting, safe errors, and a strict production CORS allowlist.
- Do not send full calculator assumptions without explicit consent.
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
- Unconfigured submission never reports false success.
- No secret appears in the static frontend.
- Build succeeds.
