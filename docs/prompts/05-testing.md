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
  npm run lint
  npm test
  npm run verify:export after a successful build
  backend pytest if dependencies are available
- Report that the configured lint script is TypeScript-based, not ESLint.
- Extend the shared calculation vectors when formula behavior changes.
- Add focused tests without unnecessary dependencies.
- Prioritize dynamic loan-term rows, Default/Custom scenario logic, calculation consistency, XLSX export, and GitHub Pages static export.
- Preserve /evalfuture/ compatibility.

Implement scoped verification improvements, run checks, and report exact outcomes.
```

## Acceptance Criteria

- Available checks are run.
- Failures are fixed or clearly documented.
- No fake test results are reported.
- Added tests are relevant and maintainable.
