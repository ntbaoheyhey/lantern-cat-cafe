import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compendiumData } from './index';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const generator = join(root, 'scripts/gen-codex-json.mjs');

describe('offline Compendium generator and provenance', () => {
  it('resolves every source file/symbol and pins existing Relic names to their metadata', () => {
    const data = compendiumData();
    for (const entry of data.entries) for (const source of entry.sources) {
      if (!['registry', 'rule', 'metadata'].includes(source.kind)) continue;
      const [file, symbol] = source.ref.split('#');
      expect(existsSync(join(root, file)), source.ref).toBe(true);
      const text = readFileSync(join(root, file), 'utf8');
      if (symbol) expect(text, source.ref).toMatch(new RegExp(`export (?:const|function) ${symbol}\\b`));
      if (source.kind === 'metadata') expect(JSON.parse(text).name).toBe(entry.name);
    }
  });

  it('runs outside the repo root, twice with all Node network entry points disabled, and writes identical JSON', () => {
    const scratch = mkdtempSync(join(root, 'reports/scorecard/CXL1/generator-'));
    try {
      const guard = join(scratch, 'offline.cjs');
      writeFileSync(guard, `const fail = () => { throw new Error('Network forbidden in offline generator'); };
for (const id of ['node:http', 'node:https']) {
  const mod = require(id); mod.request = fail; mod.get = fail;
}
const net = require('node:net'); net.connect = fail; net.createConnection = fail; net.Socket.prototype.connect = fail;
require('node:tls').connect = fail; global.fetch = fail; global.WebSocket = fail;
require('node:module').syncBuiltinESMExports();\n`);
      const args = ['--require', guard, generator];
      const options = { cwd: scratch, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024,
        env: { PATH: process.env.PATH, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' } };
      const first = spawnSync(process.execPath, args, options);
      expect(first.status, first.stderr).toBe(0);
      expect(first.stderr).toBe('');
      const data = JSON.parse(first.stdout);
      expect(data).toEqual(compendiumData());
      expect(data.entries).toHaveLength(209);
      const second = spawnSync(process.execPath, [...args, '--out', 'codex.json'], options);
      expect(second.status, second.stderr).toBe(0);
      expect(second.stdout).toBe('');
      expect(readFileSync(join(scratch, 'codex.json'), 'utf8')).toBe(first.stdout);
      expect(JSON.parse(first.stdout).chestOdds['chest.ch1.first'].rolls[0].rarities[0].perChest.oneIn).toBeNull();
    } finally { rmSync(scratch, { recursive: true, force: true }); }
  });

  it('reports invalid arguments and unwritable output with a failing exit', () => {
    const invalid = spawnSync(process.execPath, [generator, '--unknown'], { encoding: 'utf8' });
    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain('Usage:');
    const unwritable = spawnSync(process.execPath, [generator, '--out', root], { encoding: 'utf8' });
    expect(unwritable.status).toBe(1);
    expect(unwritable.stderr).toContain('EISDIR');
  });
});
