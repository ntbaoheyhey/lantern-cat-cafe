import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Same aliases as tsconfig.json paths and the Edge Functions' deno.json import maps. The function
// code lives outside this package, so bare imports it makes resolve to this package's copies.
const here = (spec: string) => fileURLToPath(import.meta.resolve(spec));

export default defineConfig({
  test: {
    globalSetup: "./global-setup.ts",
    // Under load (parallel build, 4 cores) starting a PGlite and the concurrency tests take much
    // longer than vitest's 10 s hook / 5 s test defaults; a timeout there is noise, not a bug.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
  resolve: {
    // Exact matches for viem: a bare "viem" alias would also rewrite subpaths such as "viem/siwe".
    alias: [
      { find: "@taskbar-hero/api-contract", replacement: fileURLToPath(new URL("../../packages/api-contract/src/index.ts", import.meta.url)) },
      { find: "@taskbar-hero/chain", replacement: fileURLToPath(new URL("../../packages/chain/src/index.ts", import.meta.url)) },
      { find: "@taskbar-hero/game-rules", replacement: fileURLToPath(new URL("../../packages/game-rules/src/index.ts", import.meta.url)) },
      { find: /^viem\/accounts$/, replacement: here("viem/accounts") },
      { find: /^viem$/, replacement: here("viem") },
    ],
  },
});
