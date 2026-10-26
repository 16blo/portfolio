import test from "node:test";
import assert from "node:assert/strict";
import { forbiddenPath, secretFindings } from "../scripts/check-sensitive-files.mjs";

test("sensitive files are forbidden even under the published directory", () => {
  for (const file of [".env", ".env.production", "public/.env.local", "docs/.dev.vars", "docs/key.pem", "id_ed25519", "private/config.json", "docs/portfolio-sauvegarde-privee.json", "backup.zip", "public/.git/config", "docs/.aws/credentials"]) assert.ok(forbiddenPath(file), file);
  for (const file of ["public/portfolio.json", "docs/assets/portfolio.js", ".github/workflows/security.yml"]) assert.equal(forbiddenPath(file), false, file);
});

test("recognized credential values are reported by category without disclosure", () => {
  const key = ["ghp", "_", "a".repeat(36)].join("");
  assert.deepEqual(secretFindings(key), ["github-token"]);
  assert.deepEqual(secretFindings(["-----BEGIN ", "PRIVATE KEY-----"].join("")), ["private-key"]);
  assert.deepEqual(secretFindings("https://github.com/16blo/portfolio"), []);
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("build guard refuses an ignored env file under public without displaying its value", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-public-guard-"));
  try {
    fs.mkdirSync(path.join(temp, "public"));
    fs.writeFileSync(path.join(temp, "public", ".env.local"), "DEMO_VALUE=harmless-private-placeholder");
    const result = spawnSync(process.execPath, [path.resolve("scripts/check-sensitive-files.mjs")], { cwd: temp, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("public/.env.local"));
    assert.ok(!result.stderr.includes("harmless-private-placeholder"));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
