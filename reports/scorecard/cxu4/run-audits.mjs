import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd(), web = resolve(root, 'apps/web'), evidence = resolve(root, 'reports/scorecard/cxu4');
const results = [];
for (const [kind, file, args, before, after] of [
  ['audit-demo', 'ui-audit.mjs', [resolve(evidence, 'audit-demo'), 'bossReadyStrong', '--strict'], 'const port = signedIn ? 4175 : 5199, apiPort = 4176;', 'const port = 4362, apiPort = 4363;'],
  ['audit-local', 'ui-audit.mjs', [resolve(evidence, 'audit-local'), 'strong', '--signed-in', '--strict'], 'const port = signedIn ? 4175 : 5199, apiPort = 4176;', 'const port = 4362, apiPort = 4363;'],
  ['effects', 'effects-test.mjs', [resolve(evidence, 'effects')], 'const port = 5198,', 'const port = 4362,'],
  ['effects-1600', 'effects-test.mjs', [resolve(evidence, 'effects-1600')], 'const port = 5198,', 'const port = 4362,'],
]) {
  if (process.argv.includes('--only-1600') && kind !== 'effects-1600') continue;
  const source = readFileSync(resolve(web, 'tools', file), 'utf8');
  if (!source.includes(before)) throw new Error('Port patch anchor missing');
  const temporary = resolve(web, 'tools', '.cxu4-' + file);
  try {
    let adapted = source.replace(before, after);
    if (kind === 'effects-1600') adapted = adapted.replace('size = { width: 1280, height: 720 }', 'size = { width: 1600, height: 900 }');
    writeFileSync(temporary, adapted);
    const checked = spawnSync('node', ['--check', temporary], { encoding: 'utf8' });
    if (checked.status !== 0) throw new Error(checked.stderr);
    const result = spawnSync('node', [temporary, ...args], { cwd: web, encoding: 'utf8', env: { ...process.env, SCREENSHOTS: '0', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' } });
    writeFileSync(resolve(evidence, 'logs', kind + '.log'), result.stdout + result.stderr + '\nEXIT_CODE=' + result.status + '\n');
    results.push({ kind, exit: result.status, portAdaptation: { before, after }, viewportAdaptation: kind === 'effects-1600' ? '1600x900 default viewport' : null });
    console.log(JSON.stringify(results.at(-1)));
  } finally { unlinkSync(temporary); }
}
writeFileSync(resolve(evidence, process.argv.includes('--only-1600') ? 'audit-runs-1600.json' : 'audit-runs.json'), JSON.stringify(results, null, 2) + '\n');
if (results.some(result => result.exit !== 0)) process.exitCode = 1;
