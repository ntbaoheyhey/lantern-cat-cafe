import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const base='1195b13fa';
const paths=execFileSync('git',['ls-tree','-r','--name-only',base,'packages/game-rules','apps/web/src/game/cardrpg/depth/model.ts'],{encoding:'utf8'}).trim().split('\n');
const differences=[];
for(const p of paths){const a=execFileSync('git',['show',base+':'+p],{maxBuffer:100*1024*1024});const b=readFileSync(p);if(!a.equals(b))differences.push(p);}
assert.deepEqual(differences,[],'Protected rules/model changed');
const report=readFileSync('reports/cardrpg-big/skills-v5/V5A-REPORT.md','utf8');
const hashes=[...report.matchAll(/`([a-f0-9]{64})`/g)].map(m=>m[1]).slice(0,3);
assert.equal(hashes.length,3);
const result={status:'PASS',method:'Byte-for-byte source identity against S6; inherited exact behavioral receipts, no new acceptance sample.',base,files:paths.length,off:hashes[0],fallbackBattles:hashes[1],fallbackRoutes:hashes[2],reportSha256:createHash('sha256').update(report).digest('hex')};
mkdirSync('reports/ui-v3',{recursive:true});writeFileSync('reports/ui-v3/compatibility.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
