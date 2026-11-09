// Reuse complete combat receipts only when the entire production-rules hash map is identical.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [from,to]=process.argv.slice(2);for(const p of [from,to])assert.match(p??'',/^[a-z0-9-]+$/);
const root='reports/cardrpg-big/skills-v5/',previous=root+from,next=root+to;
const sha=b=>createHash('sha256').update(b).digest('hex');
const paths=[...new Set(execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],{encoding:'utf8'}).trim().split('\n'))].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort();
const source=Object.fromEntries(await Promise.all(paths.map(async p=>[p,sha(await readFile(p))])));
assert.deepEqual(source,JSON.parse(await readFile(previous+'/off/source.json','utf8')));
const audit=JSON.parse(await readFile(previous+'/audit.json','utf8'));assert.equal(audit.status,'PASS');assert.equal(audit.off.routes,8250);
await mkdir(next+'/off',{recursive:true});
for(const p of ['off/source.json','off/checks.json','fallback-checks.json'])await copyFile(previous+'/'+p,next+'/'+p);
await writeFile(next+'/compatibility-reuse.json',JSON.stringify({previous,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDigest:sha(JSON.stringify(source)),auditSha256:sha(await readFile(previous+'/audit.json')),reason:'Only meta presentation or tooling changed; every production rule byte matches the earlier fully measured compatibility receipts. No repeated battles or new acceptance seeds.'},null,2));
console.log(JSON.stringify({status:'PASS',from,to,productionFiles:paths.length}));
