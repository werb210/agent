#!/usr/bin/env node
// AGENT_v789_SOURCE_GREP - counts test files that read files under src/ to assert on source
// text (readFileSync("src/...ts") and friends). Such tests pass while the behaviour is broken
// and break on harmless refactors, so their number may only go down: the check fails when
// the count is above scripts/source-grep-baseline.json. Run with --write-baseline to lower it.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const baselinePath = join(root, "scripts", "source-grep-baseline.json");
const TEST_DIRS = ["src", "test", "tests"];
const SKIP = new Set(["node_modules", "dist", ".git"]);

// Reads a file at runtime...
const READS_FILE = /\b(?:readFileSync|readFile)\s*\(/;
// ...and names a source file: "src/x/y.ts" anywhere, or a relative "../x.ts" (imports use .js).
const NAMES_SOURCE = /["'`](?:[\w./-]*\/)?src\/[\w./-]+\.(?:ts|tsx|js|mjs)["'`]|["'`]\.\.?\/[\w./-]+\.tsx?["'`]/;

function walk(dir, out) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.test\.(?:ts|tsx|js|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

export function sourceGrepTests(base = root) {
  return TEST_DIRS.flatMap((d) => walk(join(base, d), []))
    .filter((f) => {
      const text = readFileSync(f, "utf8");
      return READS_FILE.test(text) && NAMES_SOURCE.test(text);
    })
    .map((f) => relative(base, f).split("\\").join("/"))
    .sort();
}

const files = sourceGrepTests();
if (process.argv.includes("--write-baseline")) {
  writeFileSync(baselinePath, JSON.stringify({ max: files.length, files }, null, 2) + "\n");
  console.log(`source-grep baseline set to ${files.length}`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
} catch (e) {
  console.error(`check-source-grep-tests: cannot read ${relative(root, baselinePath)}: ${e.message}`);
  process.exit(1);
}
const max = Number(baseline.max);
console.log(`source-grep tests: ${files.length} (baseline ${max})`);
for (const f of files) console.log(`  ${f}`);
if (!Number.isFinite(max) || files.length > max) {
  const known = new Set(baseline.files ?? []);
  const added = files.filter((f) => !known.has(f));
  console.error(`\nToo many tests assert on source text (${files.length} > ${max}). Test the behaviour instead.`);
  if (added.length) console.error(`New: ${added.join(", ")}`);
  process.exit(1);
}
