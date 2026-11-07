// REFERENCE: PROMPT-A4 G0. Bundle the unchanged production modules for offline sims.
// One shared bundle preserves module identity; no transformed rules or numeric overrides.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const root = resolve(import.meta.dirname, '../..');
// G0 may finish its long numeric receipts against a recorded immutable source
// snapshot while later documentation work proceeds in the checkout.
const sourceRoot = process.env.BIG_RULES_ROOT ? resolve(process.env.BIG_RULES_ROOT) : root;
const require = createRequire(resolve(root, 'apps/web/package.json'));
const paths = {
  legacy: 'packages/game-rules/src/cardrpg/index.ts',
  depth: 'packages/game-rules/src/cardrpg/depth/index.ts',
  bot: 'packages/game-rules/src/cardrpg/depth/run-bot.ts',
  onboarding: 'packages/game-rules/src/cardrpg/depth/onboarding.ts',
};
export async function loadRules() {
  const dir = await mkdtemp('/tmp/cardrpg-a4-rules-');
  const { build } = await import(require.resolve('vite'));
  const output = resolve(dir, 'rules.mjs');
  const entry = resolve(dir, 'entry.ts');
  await writeFile(entry, Object.entries(paths).map(([name,path]) => `export * as ${name} from '${resolve(sourceRoot,path)}';`).join('\n'));
  await build({ configFile:false, root, envDir:false, publicDir:false, logLevel:'silent',
    build:{emptyOutDir:false, outDir:dir, minify:false, lib:{entry,formats:['es'],fileName:()=> 'rules.mjs'}} });
  const bundle = await import(pathToFileURL(output).href);
  return { rules: bundle.legacy, vite: { close: () => rm(dir,{recursive:true,force:true}) },
    load: async path => {
      const name = Object.keys(paths).find(key => paths[key] === path);
      if (!name) throw Error(`Unbundled simulation module: ${path}`);
      return bundle[name];
    } };
}
