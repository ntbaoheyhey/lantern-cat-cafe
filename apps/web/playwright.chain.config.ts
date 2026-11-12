import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e/chain', outputDir: 'test-results/chain', workers: 1, retries: 0,
  timeout: 90_000, expect: {timeout: 15_000},
  use: {baseURL: 'http://127.0.0.1:5980', viewport: {width: 1280,height: 900}, trace: 'retain-on-failure'},
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 5980 --strictPort',
    url: 'http://127.0.0.1:5980', reuseExistingServer: false, timeout: 120_000,
    env: {VITE_GUEST_WALLET:'1', VITE_SUPABASE_URL:'', VITE_ALLOW_MOCK_AUTH:'1'},
  },
});
