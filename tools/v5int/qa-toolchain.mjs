/** Shared, read-only QA tools for lane harnesses without local node_modules. */
import { createRequire } from 'node:module';
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const requireWeb = createRequire(resolve(root, 'apps/web/package.json'));
export const { chromium } = requireWeb('@playwright/test');
export const sharp = requireWeb('sharp');
export const toolchain = Object.freeze({
  root,
  node: process.version,
  playwright: requireWeb('@playwright/test/package.json').version,
  sharp: requireWeb('sharp/package.json').version,
  chromiumExecutable: chromium.executablePath(),
  chromiumExecutableExists: existsSync(chromium.executablePath()),
});

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(toolchain));
}
