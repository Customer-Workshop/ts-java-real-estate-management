#!/usr/bin/env node
/**
 * Minimal lint gate for the backend: syntax-checks every JavaScript source file
 * with `node --check`. The backend has no ESLint setup, so this keeps CI honest
 * without pretending to run a linter that does not exist.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src", "scripts"];
const IGNORED = new Set(["node_modules", ".git"]);

function* jsFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* jsFiles(path);
    else if (entry.name.endsWith(".js")) yield path;
  }
}

let failures = 0;
for (const root of ROOTS) {
  for (const file of jsFiles(root)) {
    try {
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } catch (error) {
      failures += 1;
      process.stderr.write(`${file}\n${error.stderr?.toString() ?? error}\n`);
    }
  }
}

if (failures > 0) {
  process.stderr.write(`\n${failures} file(s) failed the syntax check.\n`);
  process.exit(1);
}

console.log("Syntax check passed for all backend JavaScript files.");
