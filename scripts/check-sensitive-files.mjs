import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export function forbiddenPath(name) {
  return /(^|\/)\.(?:env(?:\.[^/]*)?|dev\.vars(?:\.[^/]*)?|npmrc|pypirc|netrc|git-credentials)$|(^|\/)(?:id_rsa|id_ed25519)(?:\.[^/]*)?$|\.(?:pem|key|p12|pfx|db|sqlite\d*|sql|dump|bak|backup|zip)$|sauvegarde-privee[^/]*\.json$|(^|\/)(?:private|backups|output|\.wrangler|\.vercel|\.netlify|\.openai|\.git|\.ssh|\.aws|\.azure)\//i.test(name);
}

export function secretFindings(content) {
  const patterns = [
    ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["github-token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
    ["aws-access-key", /\bAKIA[0-9A-Z]{16}\b/],
    ["google-api-key", /\bAIza[0-9A-Za-z_-]{35}\b/],
    ["live-secret-key", /\bsk_live_[A-Za-z0-9]{20,}\b/]
  ];
  return patterns.filter(([, pattern]) => pattern.test(content)).map(([label]) => label);
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

function scan() {
  const failures = [];
  const check = (name, content) => {
    if (forbiddenPath(name)) failures.push(name + " : fichier sensible interdit");
    for (const label of secretFindings(content)) failures.push(name + " : " + label);
  };
  let tracked = [];
  try { tracked = git("ls-files", "-z").split("\0").filter(Boolean); } catch { /* ZIP checkout: inspect public output below. */ }
  const files = new Set(tracked);
  const walk = directory => {
    if (!fs.existsSync(directory)) return;
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const name = directory + "/" + item.name;
      if (item.isSymbolicLink()) failures.push(name + " : lien symbolique interdit dans les fichiers publics");
      else if (item.isDirectory()) walk(name);
      else files.add(name);
    }
  };
  walk("public"); walk("docs");
  for (const name of files) if (fs.existsSync(name) && fs.lstatSync(name).isFile()) check(name, fs.readFileSync(name).toString("utf8"));

  let historicalBlobs = 0;
  if (process.argv.includes("--history")) {
    for (const row of git("rev-list", "--objects", "--all").trim().split("\n")) {
      const space = row.indexOf(" ");
      if (space < 0) continue;
      const sha = row.slice(0, space), name = row.slice(space + 1);
      if (git("cat-file", "-t", sha).trim() !== "blob") continue;
      historicalBlobs++;
      check(name, git("cat-file", "blob", sha));
    }
  }
  if (failures.length) {
    // Only paths and categories are printed, never matched credential values.
    for (const item of new Set(failures)) console.error(item);
    process.exitCode = 1;
  } else console.log(`Contrôle réussi : ${files.size} fichiers, ${historicalBlobs} objets historiques, aucun motif de secret reconnu.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) scan();
