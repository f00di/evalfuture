# UI Polish Prompt

## Purpose

Improve the Evalfuture. website interface while preserving the existing comparison model.

## When To Use It

Use this when improving layout, spacing, responsiveness, navigation, cards, typography, calculator grouping, or visual hierarchy.

## Ready-To-Paste Codex Prompt

```text
You are working on Evalfuture., a Next.js/TypeScript/Tailwind property comparison website deployed to GitHub Pages under /evalfuture/.

Goal: Improve the UI polish without breaking the comparison model.

Requirements:
- Preserve the brand name "Evalfuture." with the trailing period.
- Keep the professional finance/property consulting style.
- Use the existing palette: navy, slate, teal, muted gold, cream, panel blue, amber inputs, positive green, risk red.
- Keep the homepage as a professional business website, not only a calculator.
- Keep the calculator in the "Get a Free Comparison" flow.
- Preserve dynamic loan-term market rows.
- Preserve Default/Custom scenario logic.
- Preserve XLSX download.
- Keep contact placeholders: UAE: xxxx and Email: xxxxxx.
- Preserve GitHub Pages base path /evalfuture/.

Inspect the repo first, then implement scoped UI improvements. Run available checks and summarize exactly what changed.
```

## Acceptance Criteria

- Homepage remains professional and easy to scan.
- The main CTA says "Get a Free Comparison."
- Calculator remains reachable and functional.
- No text clipping on common laptop and mobile widths.
- Build succeeds.
