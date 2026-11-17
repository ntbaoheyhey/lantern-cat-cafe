import { pixelPackingPlugin } from '../../tools/cardrpg-big/pixel-packing.mjs';
import { excludeUnusedPosters } from '../../tools/v5int/build-asset-exclusions.mjs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), pixelPackingPlugin(), excludeUnusedPosters()],
  build: {
    chunkSizeWarningLimit: 1500, // Phaser is ~1.2 MB minified
    rollupOptions: {
      output: {
        // Separate cacheable vendor chunks: an app-code change no longer re-downloads them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?phaser[\\/]/.test(id)) return 'phaser';
          if (/[\\/]node_modules[\\/](\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/]node_modules[\\/](\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(wagmi|viem|ox|abitype|@wagmi|@tanstack|@noble|@scure)[\\/]/.test(id)) return 'web3';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // Bound jsdom workers so concurrent suites do not starve DOM assertions
    // and cold lazy imports of CPU time on shared development machines.
    maxWorkers: 2,
  },
});
