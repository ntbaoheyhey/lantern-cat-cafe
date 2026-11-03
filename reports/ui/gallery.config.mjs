import { createRequire } from 'node:module';
const require = createRequire(new URL('../../apps/web/package.json', import.meta.url));
const { defineConfig } = require('@playwright/test');
const size = process.env.E2E_VIEWPORT ?? '1280x720';
if (!['1280x720', '1600x900'].includes(size)) throw new Error('Unsupported review viewport');
const [width, height] = size.split('x').map(Number);
export default defineConfig({ testDir: '.', testMatch: 'gallery.spec.mjs', workers: 1, retries: 0,
  outputDir: `../../reports/ui/logs/gallery-artifact-results-${size}`,
  use: { viewport: { width, height }, reducedMotion: 'reduce' } });
