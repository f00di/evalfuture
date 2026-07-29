import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "out");
const routes = [
  "index.html",
  "about/index.html",
  "contact/index.html",
  "free-comparison/index.html",
  "how-it-works/index.html",
  "services/index.html"
];

await stat(output);
for (const route of routes) {
  const html = await readFile(path.join(output, route), "utf8");
  if (!html.includes("/evalfuture/_next/")) {
    throw new Error(`${route} does not reference /evalfuture/_next assets.`);
  }
  if (!html.includes("Evalfuture.")) {
    throw new Error(`${route} does not contain Evalfuture. content.`);
  }
}

const sitemap = await readFile(path.join(output, "sitemap.xml"), "utf8");
if (!sitemap.includes("https://f00di.github.io/evalfuture/")) {
  throw new Error("The exported sitemap does not use the production base path.");
}

const deployWorkflow = await readFile(
  path.join(root, "..", ".github", "workflows", "deploy.yml"),
  "utf8"
);
if (
  !deployWorkflow.includes("touch out/.nojekyll") ||
  !deployWorkflow.includes("path: frontend/out")
) {
  throw new Error("The Pages workflow must add .nojekyll and upload frontend/out.");
}

console.log(`Verified ${routes.length} exported routes beneath /evalfuture/.`);
