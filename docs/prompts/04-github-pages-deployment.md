# GitHub Pages Deployment Prompt

## Purpose

Fix or verify static deployment for GitHub Pages.

## When To Use It

Use this when GitHub Pages serves README content, assets 404, the app is blank, routing breaks, or workflow artifacts point to the wrong folder.

## Ready-To-Paste Codex Prompt

```text
You are working on Evalfuture., a Next.js static export deployed to GitHub Pages at https://f00di.github.io/evalfuture/.

Goal: Make GitHub Pages serve the built frontend app, not README or repository docs.

Requirements:
- Confirm the stack and build output folder.
- Preserve Next static export settings:
  output: "export"
  basePath: "/evalfuture"
  assetPrefix: "/evalfuture/"
  images: { unoptimized: true }
- Ensure GitHub Actions builds from frontend and uploads frontend/out.
- Ensure .nojekyll is present in the uploaded artifact.
- Do not deploy repository root.
- Keep README.md as documentation only.
- Verify the exported index.html contains app UI and /evalfuture/_next asset paths.

Run available checks and summarize deployment-relevant changes.
```

## Acceptance Criteria

- `npm run build` creates `frontend/out/index.html`.
- Artifact path is `frontend/out`.
- Exported assets use `/evalfuture/_next/...`.
- Workflow deploys via GitHub Actions Pages.
- README content is not the deployed app page.
