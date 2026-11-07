import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const paths = [...new Set(spawnSync('git', ['ls-files', '-m', '-o', '--exclude-standard'], { encoding: 'utf8' }).stdout.trim().split('\n'))];
const sensitive = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{30,}\b/,
  /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@(?!localhost|127\.0\.0\.1)[^\s]+/,
  /\bsk-[A-Za-z0-9]{32,}\b/,
];
const findings = [], files = [], screenshots = [];
for (const path of paths.filter(Boolean)) {
  if (path.endsWith('.png')) screenshots.push({ path, bytes: statSync(path).size });
  if (!/\.(tsx?|mjs|json|md|css|log)$/.test(path)) continue;
  const source = readFileSync(path, 'utf8');
  source.split('\n').forEach((line, index) => {
    if (sensitive.some(pattern => pattern.test(line))) findings.push({ path, line: index + 1, kind: 'possible secret; value omitted' });
  });
  files.push(path);
}
const diff = spawnSync('git', ['diff', '--unified=0'], { encoding: 'utf8' }).stdout;
const suspicious = diff.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++') && /test\.skip|\.only\(|\.fixme\(|describe\.skip|it\.todo|testTimeout|retries:|test\.retry|eslint-disable|@ts-ignore|@ts-expect-error|as any|console\.log/.test(line));
const assets = paths.filter(path => /(?:^|\/)public\/(?:art|assets)|^packages\/.*\.(png|svg)$/.test(path));
writeFileSync('reports/scorecard/cxu4/integrity.json', JSON.stringify({ files, findings, suspiciousAddedDiffLines: suspicious, changedArtPaths: assets, screenshots, screenshotsWithinBudget: screenshots.length <= 16 && screenshots.every(file => file.bytes < 200 * 1024) }, null, 2) + '\n');
console.log(JSON.stringify({ textFilesScanned: files.length, possibleSecrets: findings.length, suspiciousAddedDiffLines: suspicious.length, changedArtPaths: assets, screenshots: screenshots.length, screenshotsWithinBudget: screenshots.length <= 16 && screenshots.every(file => file.bytes < 200 * 1024) }));
if (findings.length || assets.length || screenshots.length > 16 || screenshots.some(file => file.bytes >= 200 * 1024)) process.exitCode = 1;
