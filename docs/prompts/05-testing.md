# Testing Prompt

## Purpose

Add or improve verification for the website, model, export, or deployment.

## When To Use It

Use this when adding tests, smoke checks, formula validation, deployment checks, or documentation for missing test coverage.

## Ready-To-Paste Codex Prompt

```text
You are working on Evalfuture., a Next.js/TypeScript frontend with a FastAPI backend.

Goal: Improve test coverage and verification without inventing fake pass results.

Requirements:
- Inspect package scripts and backend test setup first.
- Run available checks:
  npm run typecheck
  npm run build
  npm run lint if configured
  npm test if configured
  backend pytest if dependencies are available
- If a test runner is not configured, say so clearly.
- Add focused tests only if the repo setup supports it without unnecessary dependencies.
- Prioritize dynamic loan-term rows, Default/Custom scenario logic, calculation consistency, XLSX export, and GitHub Pages static export.
- Preserve /evalfuture/ compatibility.

Implement scoped verification improvements, run checks, and report exact outcomes.
```

## Acceptance Criteria

- Available checks are run.
- Failures are fixed or clearly documented.
- No fake test results are reported.
- Added tests are relevant and maintainable.
