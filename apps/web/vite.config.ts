import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 }, // Phaser is ~1.2 MB minified
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
});
