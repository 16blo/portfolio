import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Run the actual TypeScript modules without adding a test-runner dependency.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-security-"));
after(() => fs.rmSync(directory, { recursive: true, force: true }));
for (const name of ["assets", "validation", "workspace", "zip", "publishing", "portfolio"]) {
  const extension = name === "portfolio" ? "tsx" : "ts";
  let js = ts.transpileModule(fs.readFileSync(`src/${name}.${extension}`, "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  js = js.replace(/from "\.\/([a-z]+)"/g, 'from "./$1.mjs"');
  for (const external of ["zod", "react", "react/jsx-runtime", "lucide-react"]) js = js.replaceAll(`from "${external}"`, `from "${import.meta.resolve(external)}"`);
  fs.writeFileSync(path.join(directory, `${name}.mjs`), js);
}
const moduleUrl = name => pathToFileURL(path.join(directory, `${name}.mjs`));
const { validatePortfolio, publicPortfolio } = await import(moduleUrl("validation"));
const { inspectAsset } = await import(moduleUrl("assets"));
const { makeBackup, readBackup } = await import(moduleUrl("workspace"));
const { publicationZip } = await import(moduleUrl("zip"));
const { default: PortfolioView } = await import(moduleUrl("portfolio"));
const original = JSON.parse(fs.readFileSync("public/portfolio.json", "utf8"));
const png = new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });

test("the verified initial content remains valid", () => {
  const data = validatePortfolio(original);
  assert.equal(data.projects.length, 4); assert.equal(data.certificates.length, 11);
});
for (const link of ["javascript:alert(1)", "data:text/html,hello", "http://example.org", "https://user:password@example.org", "https://", "https://exa mple.org"]) test(`rejects unsafe URL ${link.split(":")[0]}`, () => {
  const data = structuredClone(original); data.projects[0].link = link;
  assert.throws(() => validatePortfolio(data));
});
test("rejects traversal, executable attachments, and duplicate IDs", () => {
  for (const value of ["../secret.pdf", "uploads/script.svg", "uploads/script.html", "https://example.org/track.png"]) {
    const data = structuredClone(original); data.profile.photo = value; assert.throws(() => validatePortfolio(data));
  }
  const data = structuredClone(original); data.projects.push(data.projects[0]); assert.throws(() => validatePortfolio(data));
});
test("React escapes markup in portfolio content", () => {
  const data = structuredClone(original); data.profile.intro = '<img src=x onerror="alert(1)">';
  const html = renderToStaticMarkup(React.createElement(PortfolioView, { data: validatePortfolio(data) }));
  assert.ok(html.includes("&lt;img")); assert.ok(!html.includes('<img src="x"'));
});
test("rejects HTML and SVG disguised as images", async () => {
  await assert.rejects(inspectAsset(new Blob(["<script>alert(1)</script>"], { type: "image/png" })));
  await assert.rejects(inspectAsset(new Blob(["<svg onload='alert(1)'/>"], { type: "image/svg+xml" })));
  assert.equal(await inspectAsset(png), "png");
  await assert.rejects(inspectAsset(new Blob([new Uint8Array(5 * 1024 * 1024 + 1)])));
});
test("private backup retains drafts and attachment bytes", async () => {
  const data = structuredClone(original); data.projects[0].visible = false;
  const workspace = { data, assets: [{ path: "uploads/proof.png", blob: png }] };
  const saved = await makeBackup(workspace);
  const restored = await readBackup(new File([saved], "backup.json"));
  assert.equal(restored.data.projects[0].visible, false);
  assert.deepEqual(new Uint8Array(await restored.assets[0].blob.arrayBuffer()), new Uint8Array(await png.arrayBuffer()));
  assert.equal(publicPortfolio(restored.data).projects.length, 3);
});
test("rejects forged imports, path traversal and incompatible versions", async () => {
  for (const asset of [
    { path: "uploads/fake.png", base64: btoa("<html>script</html>") },
    { path: "uploads/fake.pdf", base64: btoa(String.fromCharCode(...new Uint8Array(await png.arrayBuffer()))) },
    { path: "../escape.png", base64: "AAAA" }
  ]) await assert.rejects(readBackup(new File([JSON.stringify({ version: 1, data: original, assets: [asset] })], "backup.json")));
  await assert.rejects(readBackup(new File([JSON.stringify({ version: 2, data: original, assets: [] })], "backup.json")));
});
test("publication exports omit private draft content and attachments", async () => {
  const data = structuredClone(original);
  data.projects.push({ ...data.projects[0], id: "private-draft", title: "PRIVATE_DRAFT_MARKER", image: "uploads/private.png", visible: false });
  globalThis.document = { baseURI: "https://example.test/portfolio/" };
  globalThis.location = { origin: "https://example.test" };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    const local = new URL(url).pathname.replace("/portfolio/", "public/");
    return new Response(fs.readFileSync(local), { headers: { "content-type": local.endsWith(".pdf") ? "application/pdf" : "image/png" } });
  };
  try {
    const zip = await publicationZip({ data, assets: [{ path: "uploads/private.png", blob: png }] });
    const text = Buffer.from(await zip.arrayBuffer()).toString("utf8");
    assert.ok(!text.includes("PRIVATE_DRAFT_MARKER")); assert.ok(!text.includes("uploads/private.png"));
    assert.ok(text.includes("docs/portfolio.json")); assert.ok(text.includes("public/portfolio.json"));
  } finally { globalThis.fetch = previousFetch; }
});
test("compiled pages contain the production security policy before scripts", () => {
  for (const page of ["index.html", "editeur.html"]) {
    const html = fs.readFileSync(`docs/${page}`, "utf8").replaceAll("&#39;", "'");
    assert.ok(html.indexOf("Content-Security-Policy") < html.indexOf("<script"));
    for (const directive of ["script-src 'self'", "connect-src 'self'", "object-src 'none'", "form-action 'none'"]) assert.ok(html.includes(directive));
    assert.ok(!html.includes("unsafe-eval")); assert.ok(html.includes('name="referrer" content="no-referrer"'));
  }
});
