// Test-only sidecar bundle. Never writes to the production dist directory.
import { resolve } from 'node:path';
import { build } from 'vite';
const directory = process.argv[2];
if (!/^dist-v2\/e2e-[1-9]\d*$/.test(directory ?? '')) throw new Error('Market fixture requires an isolated E2E output directory');
await build({
  configFile: resolve('vite.config.ts'), envDir: false, publicDir: false,
  base: '/market-fixture/',
  build: {
    outDir: `${directory}/market-fixture`, emptyOutDir: true,
    rollupOptions: { input: resolve('e2e/fixtures/market-view.html') },
  },
});

// Isolated ART2 test fixture; production output/config stays untouched.
await build({
  configFile: resolve("vite.config.ts"), envDir: false, publicDir: false,
  base: "/art2-fixture/",
  build: { outDir: `${directory}/art2-fixture`, emptyOutDir: true,
    rollupOptions: { input: resolve("e2e/fixtures/art2-view.html") } },
});
