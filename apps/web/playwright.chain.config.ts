import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e/chain', outputDir: 'test-results/chain', workers: 1, retries: 0,
  timeout: 90_000, expect: {timeout: 15_000},
  use: {actionTimeout: 15_000,baseURL: 'http://127.0.0.1:5980', viewport: {width: 1280,height: 900}, trace: 'retain-on-failure', launchOptions: {args: ['--mute-audio']}},
  webServer: {
    command: 'node ../../tools/chain/local.mjs --legacy-economy',
    url: 'http://127.0.0.1:5980', reuseExistingServer: false, timeout: 120_000,
  },
});
