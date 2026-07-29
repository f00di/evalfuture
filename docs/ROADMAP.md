# Evalfuture. Roadmap

## Phase 1 - Professional landing page — complete

- Add homepage hero
- Add navigation
- Add value proposition
- Add services
- Add contact section
- Move calculator into free comparison section

## Phase 2 - Calculator polish — complete

- Improve layout and spacing
- Group assumptions
- Improve KPI cards
- Improve dynamic market variation tables
- Improve chart responsiveness
- Improve XLSX button and user feedback

## Phase 3 - Lead capture — repository implementation complete

- Add optional client details form:
  - Name
  - Email
  - Phone
  - Property location
  - Purpose: buy / rent / invest / rent out / refinance
- Submit through a configurable FastAPI integration without local personal-data storage
- Validate, rate-limit, and protect submissions with a honeypot and strict CORS
- Optionally store through server-only Supabase credentials
- Optionally notify through server-only Resend credentials
- Show an explicit unavailable state when no delivery service is configured

External Render, Supabase, Resend, DNS, monitoring, and approved contact-detail
configuration remain deployment tasks.

## Phase 4 - Detailed report workflow

- Add detailed quote option
- Add scenario comparison export
- Add PDF summary option
- Add branded Excel output

## Phase 5 - Production readiness — core repository controls complete

- Maintain shared TypeScript/Python calculation vectors
- Maintain invalid-input, workbook, contact, and rate-limit tests
- Maintain static-export and GitHub Pages checks in CI
- Add shared rate limiting before horizontal API scaling
- Configure uptime/error monitoring when the API is deployed
- Define lead retention, backup, restore, and deletion procedures
- Add analytics later if required
