import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const cwd = `${process.cwd()}/apps/web`;
const probes = [
 ['audit', 'ui-audit.mjs', source => source.replace('signedIn ? 4175 : 5199, apiPort = 4176', 'signedIn ? 4372 : 4370, apiPort = 4373'), ['../../reports/scorecard/cxu5/audit', 'bossReadyStrong']],
 ['audit-signed', 'ui-audit.mjs', source => source.replace('signedIn ? 4175 : 5199, apiPort = 4176', 'signedIn ? 4372 : 4370, apiPort = 4373'), ['../../reports/scorecard/cxu5/audit-signed', 'strong', '--signed-in']],
 ['effects-1280', 'effects-test.mjs', source => source.replace('const port = 5198', 'const port = 4370'), ['../../reports/scorecard/cxu5/effects-1280']],
 ['effects-1600', 'effects-test.mjs', source => source.replace('const port = 5198', 'const port = 4370').replace('size = { width: 1280, height: 720 }', 'size = { width: 1600, height: 900 }'), ['../../reports/scorecard/cxu5/effects-1600']],
];
for (const [name, original, adapt, args] of probes) {
 if (process.env.CXU5_AUDIT_ONLY === '1' && name.startsWith('effects')) continue;
 const temporary = `${cwd}/tools/.cxu5-${name}.mjs`;
 writeFileSync(temporary, adapt(readFileSync(`${cwd}/tools/${original}`, 'utf8')));
 try {
  const syntax = spawnSync('node', ['--check', temporary], { encoding: 'utf8' });
  if (syntax.status !== 0) throw Error(syntax.stderr);
  const result = spawnSync('node', [temporary, ...args], { cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, env: { ...process.env, SCREENSHOTS: '0' } });
  writeFileSync(`reports/scorecard/cxu5/logs/${name}.log`, `Original ${original}; adaptation only owned ports and effects viewport.\n${result.stdout}${result.stderr}\nEXIT ${result.status}\n`);
  console.log(name, result.status);
 } finally { unlinkSync(temporary); }
}
