// Optional independent check: evaluate pure art data using workspace TypeScript,
// then compare actual export dimensions/frame counts with Python's static inventory.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const ts = require('typescript');
const inventory = JSON.parse(readFileSync(resolve(root, 'docs/ui/art/inventory.json'), 'utf8'));
let inspected = 0;
for (let chapter = 1; chapter <= 5; chapter++) {
  const path = `apps/web/src/art/monsters/ch${chapter}.ts`;
  const source = readFileSync(resolve(root, path), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = { exports: {} };
  vm.runInNewContext(js, context, { timeout: 1000 });
  const recorded = inventory.files.find(row => row.path === path).sprites;
  const actual = {};
  for (const [name, value] of Object.entries(context.exports)) {
    const sprites = value.id ? [value] : Object.values(value);
    for (const sprite of sprites) {
      actual[`${name}:${sprite.id}`] = { width: sprite.size.w, height: sprite.size.h,
        animations: Object.fromEntries(Object.entries(sprite.frames).map(([key, frames]) => [key, frames.length])) };
    }
  }
  assert.deepEqual(recorded, actual);
  inspected += Object.keys(actual).length;
  console.log(`${path}: ${Object.keys(actual).length} exact sprite records match evaluated exports`);
}
console.log(`${inspected} existing sprites checked (classic, pilot and hero); no source writes`);
