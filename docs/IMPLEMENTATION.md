# Evalfuture. Implementation and Deployment Guide

## Implemented Repository Layers

### Frontend foundation

The Next.js app is a static export with route directories and trailing slashes
for GitHub Pages. Shared design tokens, site primitives, responsive navigation,
visible focus states, reduced-motion behavior, accessible form feedback, and
text alternatives for chart/table data are implemented.

The comparison uses a browser model and keeps personal data in React memory for
the current session. It does not write personal information to local storage.
The workbook downloader prevents duplicate clicks, reports preparing/success/
failure states, tries the optional API, and falls back to the two-sheet browser
workbook.

### API and lead delivery

FastAPI validates preview, export, and lead requests. The inquiry endpoint:

- normalizes and length-limits text;
- validates email and optional phone;
- rejects unexpected fields;
- accepts a honeypot field;
- limits each client to five attempts per 15 minutes;
- uses an exact CORS allowlist;
- optionally inserts through Supabase with a server-only service role;
- optionally sends a Resend notification; and
- returns safe, non-sensitive errors.

The health endpoint reports whether any lead delivery integration is configured.
Preview and workbook export do not require Supabase or Resend.

### Calculation and export integrity

`shared/calculation-vectors.json` is tested by TypeScript and Python. It includes
the default case, zero mortgage rate, maximum loan term, fixed-amount modes,
square-metre service-charge conversion, Custom scenarios, and blank Custom
fallback. Focused tests also cover invalid values, negative/zero market movement,
dynamic rows, early settlement, Year 0, and the exact two-sheet workbook shape.

## Environment Variables

Frontend build variable:

```text
NEXT_PUBLIC_API_BASE_URL=
```

This value is visible in the browser. Set it to the public HTTPS API origin
without a trailing slash. Never place credentials in it.

Backend variables:

```text
ALLOWED_FRONTEND_ORIGINS=https://f00di.github.io
TRUST_PROXY_HEADERS=false
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NOTIFICATION_EMAIL=
```

Use exact origins without `/evalfuture`; CORS origins do not include URL paths.
Set `TRUST_PROXY_HEADERS=true` only when the API is behind a trusted proxy that
overwrites `X-Forwarded-For`.

## Recommended Deployment Order

1. Run all commands in the verification section of `README.md`.
2. Create a Supabase project only if lead storage is required.
3. Apply `backend/supabase/leads.sql` and confirm RLS is forced and browser roles
   cannot select or insert.
4. Set a retention period for inquiries and document the deletion owner.
5. Configure a verified Resend sender only if email notification is required.
6. Deploy `backend` to Render with a supported Python runtime, install command
   `python -m pip install -r requirements.txt`, and start command
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
7. Add server-only variables in Render. Do not put them in GitHub variables that
   become part of the static frontend build.
8. Test `/api/health`, one valid inquiry, validation rejection, honeypot behavior,
   rate limiting, Supabase insertion, and notification delivery.
9. Set the GitHub Pages build variable `NEXT_PUBLIC_API_BASE_URL` to the API HTTPS
   origin only after the API is ready.
10. Deploy the static frontend through `.github/workflows/deploy.yml`.
11. Smoke-test every route, a 10-year and 25-year calculation, Default and Custom
    scenarios, blank fallback, browser workbook fallback, backend workbook, and
    the contact unavailable/success/error states.

Cloudflare is optional for DNS, managed rate limiting, and bot protection. It is
not required for GitHub Pages or the initial single-instance API. Any added
security headers must be tested against Next assets, API calls, and Resend/
Supabase integrations.

## Production Operations

### Security and privacy

- Keep service-role and email credentials only in Render secret storage.
- Rotate a credential immediately if it appears in source control or logs.
- Collect only the contact form fields; do not submit full financial assumptions
  without explicit consent.
- Keep logs free of request bodies, contact messages, and credentials.
- Define inquiry access, retention, export, and deletion procedures.
- Require MFA for GitHub, Render, Supabase, Resend, and DNS administrators.

### Availability and scaling

The built-in limiter is appropriate only for an initial single API instance.
Before multiple workers or instances, add a shared limiter such as managed Redis
or an edge limit in Cloudflare. Confirm Render request timeouts and cold-start
behavior for workbook generation under expected load.

Use GitHub Pages/CDN for all static assets. Do not publicly cache lead responses
or user-specific preview/export responses.

### Monitoring and maintenance

- Monitor GitHub Actions build/deployment failures.
- Add Render uptime and latency checks for `/api/health`.
- Alert on API 5xx/429 spikes and repeated Supabase or Resend failures.
- Review npm and Python dependencies monthly and before releases.
- Run the full test suite for calculation or workbook changes.
- Review Supabase storage growth and expired leads on the retention schedule.

### Backup and recovery

- Enable Supabase backups appropriate to the chosen plan and periodically test a
  restore in a non-production project.
- Treat repository history and the last successful Pages artifact/commit as the
  frontend rollback source.
- Keep the previous working Render deployment available for rollback.
- Record owners for GitHub, DNS, Render, Supabase, and Resend recovery.
- Test DNS/admin account recovery and rotate emergency credentials on a defined
  schedule.

Rollback sequence:

1. Disable inquiry delivery or unset `NEXT_PUBLIC_API_BASE_URL` if the API is
   returning unsafe or incorrect responses.
2. Redeploy the last known-good Render revision.
3. Re-run the Pages workflow for the last known-good frontend commit.
4. Verify routes, assets, calculator behavior, workbook fallback, and API health.
5. Restore lead data only through the documented Supabase restore procedure.

## Deliberately Deferred

- Authentication is unnecessary because no customer account or private dashboard
  exists.
- A browser Supabase client is unnecessary and would expand the security surface.
- Shared rate-limit infrastructure is deferred until more than one API instance
  is planned.
- Analytics, error-tracking vendors, PDF reports, and live currency conversion
  require explicit product decisions.
- Real contact information must remain `xxxx` / `xxxxxx` until approved.
