import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Same aliases as tsconfig.json paths and the Edge Functions' deno.json import maps. The function
// code lives outside this package, so bare imports it makes resolve to this package's copies.
const here = (spec: string) => fileURLToPath(import.meta.resolve(spec));

export default defineConfig({
  resolve: {
    alias: {
      "@taskbar-hero/game-rules": fileURLToPath(new URL("../../packages/game-rules/src/index.ts", import.meta.url)),
      "viem/accounts": here("viem/accounts"),
      viem: here("viem"),
    },
  },
});
