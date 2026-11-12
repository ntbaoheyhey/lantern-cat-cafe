import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { serverPort, apiPort, serverURL, apiURL } from './e2e/support/server-ports';
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
if (new Set([classicPort, v2Port, serverPort, apiPort]).size !== 4) throw new Error('All four E2E ports must differ');
const externalServer = process.env.F2_EXTERNAL_SERVER === '1';
const demoEnv = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_ALLOW_MOCK_AUTH: '1' };
const viewportName = process.env.E2E_VIEWPORT ?? '1280x720';
if (!['1280x720', '1600x900'].includes(viewportName)) {
  throw new Error('E2E_VIEWPORT must be 1280x720 or 1600x900');
}
const desktopViewport = viewportName === '1600x900'
  ? { width: 1600, height: 900 } : { width: 1280, height: 720 };

export default defineConfig({
  testDir: 'e2e',
  outputDir: `test-results/${classicPort}-${v2Port}`,
  webServer: [
    ...(externalServer ? [] : [{
      command: 'node ../../scripts/local-server.mjs',
      url: `${apiURL}/health`, reuseExistingServer: false, timeout: 120_000,
    }]),
    { command: `node e2e/support/server-build.mjs${process.env.F2_SERVER_PREBUILT === '1' ? ' --preview-only' : ''}`, url: serverURL, reuseExistingServer: false, timeout: 120_000 },
    {
      command: `npx -y pnpm@10.28.0 exec vite build --outDir ${classicDist} && node e2e/support/serve.mjs ${classicDist} ${classicPort}`,
      env: { ...demoEnv, VITE_GAME_V2: '0' },
      url: classicURL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx -y pnpm@10.28.0 exec vite build --mode g1-perf --outDir ${v2Dist} && node e2e/support/market-build.mjs ${v2Dist} && node e2e/support/serve.mjs ${v2Dist} ${v2Port}`,
      env: { ...demoEnv, VITE_GAME_V2: '1' },
      url: v2URL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'v2-server',
      testMatch: ['server/**/*.spec.ts', 'v2/errors-notice.spec.ts'],
      fullyParallel: false,
      use: { baseURL: serverURL, viewport: desktopViewport, launchOptions },
    },
    {
      name: 'v2-loop',
      testMatch: 'v2/**/*.spec.ts',
      testIgnore: ['v2/errors-notice.spec.ts'],
      use: { baseURL: v2URL, viewport: desktopViewport, launchOptions },
    },
    {
      name: 'classic',
      testIgnore: ['layout/**', 'v2/**', 'ui/**', 'qa/**', 'server/**', 'chain/**'],
      use: { baseURL: classicURL, viewport: desktopViewport, launchOptions },
    },
    {
      name: 'stage-layout',
      testMatch: ['layout/**/*.spec.ts', 'ui/**/*.spec.ts', 'qa/**/*.spec.ts'],
      use: { baseURL: v2URL, viewport: desktopViewport, launchOptions },
    },
  ],
});
