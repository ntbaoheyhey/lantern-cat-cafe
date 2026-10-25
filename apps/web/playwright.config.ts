import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use the preinstalled Chromium when present (sandbox); CI installs its own.
const preinstalled = '/opt/pw-browsers/chromium';
const executablePath = existsSync(preinstalled) ? preinstalled : undefined;
const launchOptions = { executablePath, args: ['--no-sandbox'] };

// Keep the classic rollback suite on an explicit VITE_GAME_V2=0 build after cut-over.
// The stage suite uses VITE_GAME_V2=1 in its separate dist-v2 build.
export default defineConfig({
  testDir: 'e2e',
  webServer: [
    {
      command: 'VITE_GAME_V2=0 pnpm exec vite build && pnpm exec vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
    },
    {
      command:
        'VITE_GAME_V2=1 pnpm exec vite build --outDir dist-v2 && pnpm exec vite preview --outDir dist-v2 --port 4174 --strictPort',
      url: 'http://localhost:4174',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'classic',
      testIgnore: 'layout/**',
      use: { baseURL: 'http://localhost:4173', viewport: { width: 1280, height: 720 }, launchOptions },
    },
    {
      name: 'stage-layout',
      testMatch: 'layout/**/*.spec.ts',
      use: { baseURL: 'http://localhost:4174', viewport: { width: 1280, height: 720 }, launchOptions },
    },
  ],
});
