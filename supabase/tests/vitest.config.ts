import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Same alias as tsconfig.json paths and the Edge Functions' deno.json import maps.
export default defineConfig({
  resolve: {
    alias: {
      "@taskbar-hero/game-rules": fileURLToPath(new URL("../../packages/game-rules/src/index.ts", import.meta.url)),
    },
  },
});
