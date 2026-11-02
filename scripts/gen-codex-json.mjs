#!/usr/bin/env node
/** Offline snapshot of current rules. Uses only Node and the package's locked TypeScript.
 * stdout by default; --out <file> writes explicitly. Generated JSON is not a repository input. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rules = resolve(root, 'packages/game-rules');

/** In-memory TS loading keeps Node 20 support without an extra loader dependency or build files.
 * Only repository-local relative modules are accepted; nothing resolves over the network. */
export function loadCompendium() {
  const ts = createRequire(resolve(rules, 'package.json'))('typescript');
  const cache = new Map();
  const load = (request) => {
    const file = [request, `${request}.ts`, resolve(request, 'index.ts')]
      .find(candidate => candidate.endsWith('.ts') && existsSync(candidate));
    if (!file || relative(resolve(rules, 'src'), file).startsWith(`..${sep}`)) {
      throw new Error(`Cannot load local rules module: ${request}`);
    }
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
      fileName: file,
    }).outputText;
    const localRequire = (specifier) => {
      if (!specifier.startsWith('.')) throw new Error(`Non-local rules import: ${specifier}`);
      return load(resolve(dirname(file), specifier));
    };
    // Trusted checked-in TypeScript, compiled with the same locked compiler as the package.
    new Function('exports', 'require', 'module', compiled)(module.exports, localRequire, module);
    return module.exports;
  };
  return load(resolve(rules, 'src/v2/codex/index.ts')).compendiumData();
}

export function generateCodexJson() {
  return `${JSON.stringify(loadCompendium(), null, 2)}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--out' || !args[1])) {
      throw new Error('Usage: node scripts/gen-codex-json.mjs [--out <file>]');
    }
    const json = generateCodexJson();
    if (args.length) writeFileSync(resolve(args[1]), json, 'utf8');
    else process.stdout.write(json);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
