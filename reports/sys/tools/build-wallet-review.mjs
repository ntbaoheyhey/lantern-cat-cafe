import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [root, output] = process.argv.slice(2);
const web = resolve(root, 'apps/web');
const require = createRequire(resolve(web, 'package.json'));
const { build } = await import(pathToFileURL(require.resolve('vite')));

// Isolated browser fixture. All endpoint traffic is intercepted by the review.
await build({
  root: web,
  envDir: false,
  define: {
    'import.meta.env.VITE_GAME_V2': JSON.stringify('1'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://wallet-audit.invalid'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('browser-local-only'),
  },
  build: { outDir: output, emptyOutDir: true },
});
