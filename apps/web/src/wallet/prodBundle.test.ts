import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

function bundleText(outDir: string): string {
  const assets = join(outDir, 'assets');
  return readdirSync(assets).filter(f => f.endsWith('.js')).map(f => readFileSync(join(assets, f), 'utf8')).join('\n');
}
function build(env: Record<string, string>): string {
  const outDir = mkdtempSync(join(tmpdir(), 'th-prod-'));
  try {
    execFileSync('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vite', 'build', '--outDir', outDir, '--emptyOutDir'], {
      cwd: process.cwd(), stdio: 'ignore', env: { ...process.env, NODE_ENV: 'production', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', ...env },
    });
    return bundleText(outDir);
  } finally { rmSync(outDir, { recursive: true, force: true }); }
}

// The wallet-free test modes (demo localStorage mock, tools/ui-audit.mjs, local PGlite server) all run outside
// production. This proves a normal production build contains no mock sign-in code at all.
it('a production build without the opt-in flag excludes mock sign-in', () => {
  expect(build({ VITE_GAME_V2: '1' })).not.toContain('mocknonce');
}, 120_000);

it('mock sign-in only ships when a build explicitly opts in (demo/e2e builds)', () => {
  expect(build({ VITE_GAME_V2: '1', VITE_ALLOW_MOCK_AUTH: '1' })).toContain('mocknonce');
}, 120_000);
