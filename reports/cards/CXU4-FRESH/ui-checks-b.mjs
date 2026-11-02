import { readFileSync, writeFileSync, unlinkSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = process.argv[2]; const out = process.argv[3];
const cwd = `${root}/apps/web`; mkdirSync(`${out}/logs`, { recursive: true });
const probes = [
 ['audit', 'ui-audit.mjs', s => s.replace('signedIn ? 4175 : 5199, apiPort = 4176', 'signedIn ? 4852 : 4850, apiPort = 4853'), [`${out}/audit`, 'bossReadyStrong', '--strict']],
 ['audit-signed', 'ui-audit.mjs', s => s.replace('signedIn ? 4175 : 5199, apiPort = 4176', 'signedIn ? 4852 : 4850, apiPort = 4853'), [`${out}/audit-signed`, 'strong', '--signed-in', '--strict']],
 ['effects-1280', 'effects-test.mjs', s => s.replace('const port = 5198', 'const port = 4851'), [`${out}/effects-1280`, '--viewport=1280x720']],
 ['effects-1600', 'effects-test.mjs', s => s.replace('const port = 5198', 'const port = 4851'), [`${out}/effects-1600`, '--viewport=1600x900']],
];
const results = [];
const isolatedBuild = mkdtempSync('/tmp/tbh-ui-audit-build-');
for (const [name, original, adapt, args] of probes) {
 const temporary = `${cwd}/tools/.fresh-${name}.mjs`;
 writeFileSync(temporary, adapt(readFileSync(`${cwd}/tools/${original}`, 'utf8')).replace('screen.screenshot && size.width >= 1280', "(screen.id === 'hero' || screen.id === 'help') && size.width >= 1280").replace("const outDir = 'dist/ui-audit-signed-in'", `const outDir = ${JSON.stringify(isolatedBuild)}`).replaceAll("server: { port, strictPort: true }", "server: { port, strictPort: true, watch: { ignored: ['**/dist/**', '**/dist-v2/**'] } }"));
 try {
  const result = spawnSync('node', [temporary, ...args], {cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, env: {...process.env, SCREENSHOTS: name === 'audit' ? '1' : '0'}});
  writeFileSync(`${out}/logs/${name}.log`, `${result.stdout}${result.stderr}`);
  writeFileSync(`${out}/logs/${name}.exit`, `${result.status}\n`);
  results.push({name, original, args, exit: result.status, adaptations: 'Ports, isolated temporary audit build, and Hero/Help guest-only screenshot output; --strict audits and existing viewport option; generated build outputs ignored by dev watcher; assertions unchanged'});
  writeFileSync(`${out}/commands.json`, JSON.stringify(results, null, 2));
  console.log(name, `exit=${result.status}`);
  if (result.status !== 0) { process.exitCode = 1; break; }
 } finally { unlinkSync(temporary); }
}
