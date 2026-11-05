import { createRequire } from 'node:module';
import { resolve } from 'node:path';
export const root = resolve(import.meta.dirname, '../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
export async function loadRules() {
  const { createServer } = await import(require.resolve('vite'));
  const vite = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, root, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const rules = await vite.ssrLoadModule(resolve(root, 'packages/game-rules/src/cardrpg/index.ts'));
  return { rules, vite, load: p => vite.ssrLoadModule(resolve(root, p)) };
}
