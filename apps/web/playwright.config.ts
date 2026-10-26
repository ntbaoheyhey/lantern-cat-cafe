import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { classicPort, v2Port, classicURL, v2URL } from './e2e/support/servers';

// Use the preinstalled Chromium when present (sandbox); CI installs its own.
const preinstalled = '/opt/pw-browsers/chromium';
const executablePath = existsSync(preinstalled) ? preinstalled : undefined;
const launchOptions = { executablePath, args: ['--no-sandbox'] };

// ui/** joins stage-layout: both describe the same v2 stage-first UI. A new UI
// spec inherits v2 automatically; v2-loop keeps its separate gameplay counts.
// Never reuse an unknown preview (it may serve a stale build). After a cancelled
// run, find listeners with `lsof -nP -iTCP:4173 -iTCP:4174 -sTCP:LISTEN`, inspect
// their PID/cwd, then `kill <owned-pid>`. See docs/test-stability.md. Another run
// can use E2E_PORT_CLASSIC/E2E_PORT_V2; builds and test outputs are port-isolated.
const classicDist = `dist/e2e-${classicPort}`;
const v2Dist = `dist-v2/e2e-${v2Port}`;
const demoEnv = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };

export default defineConfig({
  testDir: 'e2e',
  outputDir: `test-results/${classicPort}-${v2Port}`,
  webServer: [
    {
      command: `npx -y pnpm@10.28.0 exec vite build --outDir ${classicDist} && npx -y pnpm@10.28.0 exec vite preview --outDir ${classicDist} --port ${classicPort} --strictPort`,
      env: { ...demoEnv, VITE_GAME_V2: '0' },
      url: classicURL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx -y pnpm@10.28.0 exec vite build --outDir ${v2Dist} && npx -y pnpm@10.28.0 exec vite preview --outDir ${v2Dist} --port ${v2Port} --strictPort`,
      env: { ...demoEnv, VITE_GAME_V2: '1' },
      url: v2URL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'v2-loop',
      testMatch: 'v2/**/*.spec.ts',
      use: { baseURL: v2URL, viewport: { width: 1280, height: 720 }, launchOptions },
    },
    {
      name: 'classic',
      testIgnore: ['layout/**', 'v2/**', 'ui/**', 'qa/**'],
      use: { baseURL: classicURL, viewport: { width: 1280, height: 720 }, launchOptions },
    },
    {
      name: 'stage-layout',
      testMatch: ['layout/**/*.spec.ts', 'ui/**/*.spec.ts', 'qa/**/*.spec.ts'],
      use: { baseURL: v2URL, viewport: { width: 1280, height: 720 }, launchOptions },
    },
  ],
});
