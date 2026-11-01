#!/usr/bin/env node
// Offline import-map guard. Remote/npm/jsr modules are terminal nodes; local modules are
// walked separately for each function because each deno.json is its own resolution context.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const functions = join(root, 'supabase/functions');
const urlLike = (s) => /^(?:\.{1,2}\/|\/|[a-z][a-z\d+.-]*:)/i.test(s);
const normalize = (s, base) => urlLike(s) ? new URL(s, base).href : s;

// Tokenize first so commented-out imports and strings containing "from" are not edges.
// Includes type imports, re-exports, side effects and literal dynamic imports. No source
// is executed, and Node's extension/index fallback is deliberately never used.
function imports(source) {
  const tokens = [...source.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[\w$]+|[^\s]/g)]
    .map(m => m[0]).filter(t => !t.startsWith('//') && !t.startsWith('/*'));
  const string = t => t && (t.startsWith('"') || t.startsWith("'"));
  const unquote = t => t.slice(1, -1).replace(/\\(['"\\])/g, '$1');
  const found = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!['import', 'export'].includes(tokens[i]) || tokens[i - 1] === '.') continue;
    if (tokens[i] === 'import' && string(tokens[i + 1])) found.push(unquote(tokens[i + 1]));
    else if (tokens[i] === 'import' && tokens[i + 1] === '(' && string(tokens[i + 2])) found.push(unquote(tokens[i + 2]));
    else {
      for (let j = i + 1; j < tokens.length && ![';', 'import', 'export'].includes(tokens[j]); j++) {
        if (tokens[j] === 'from' && string(tokens[j + 1])) { found.push(unquote(tokens[j + 1])); break; }
      }
    }
  }
  return [...new Set(found)];
}

let failures = 0;
let checked = 0;
for (const fn of readdirSync(functions).sort()) {
  const entry = join(functions, fn, 'index.ts');
  if (fn.startsWith('_') || !existsSync(entry)) continue;
  checked++;
  const fail = (importer, specifier) => {
    console.error(`${fn}: ${relative(root, importer)} -> ${specifier}`);
    failures++;
  };
  const config = join(functions, fn, 'deno.json');
  let map;
  try {
    const base = pathToFileURL(config);
    map = new Map(Object.entries(JSON.parse(readFileSync(config, 'utf8')).imports ?? {})
      .map(([key, value]) => [normalize(key, base), typeof value === 'string' ? normalize(value, base) : null]));
  } catch { fail(entry, 'deno.json (missing or invalid)'); continue; }
  const visited = new Set();
  const walk = file => {
    if (visited.has(file)) return;
    visited.add(file);
    for (const specifier of imports(readFileSync(file, 'utf8'))) {
      const normalized = normalize(specifier, pathToFileURL(file));
      const exact = map.has(normalized);
      let target = exact ? map.get(normalized) : normalized;
      if (!exact) {
        const prefix = [...map.keys()].filter(k => k.endsWith('/') && normalized.startsWith(k)).sort((a, b) => b.length - a.length)[0];
        if (prefix) target = map.get(prefix)?.endsWith('/') ? map.get(prefix) + normalized.slice(prefix.length) : null;
      }
      const inPackages = relative(root, file).startsWith('packages/');
      if (inPackages && /^\.{1,2}\//.test(specifier) && !specifier.endsWith('.ts') && !exact) {
        fail(file, specifier); continue;
      }
      if (!target || !urlLike(target)) { fail(file, specifier); continue; }
      const url = new URL(target);
      if (url.protocol !== 'file:') continue;
      const local = fileURLToPath(url);
      if (!existsSync(local) || !statSync(local).isFile()) { fail(file, specifier); continue; }
      if (/\.[cm]?[jt]sx?$/.test(local)) walk(local);
    }
  };
  walk(entry);
}
if (failures) process.exitCode = 1;
else console.log(`Deno import guard: ${checked} functions clean`);
