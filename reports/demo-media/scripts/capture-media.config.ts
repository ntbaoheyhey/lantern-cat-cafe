import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e/capture',
  outputDir: '/workspace/taskbar-captures/test-results',
  workers: 1,
  timeout: 120_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4181', launchOptions: { args: ['--no-sandbox'] } },
});
