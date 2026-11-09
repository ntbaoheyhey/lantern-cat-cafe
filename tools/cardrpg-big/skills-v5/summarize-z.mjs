// Verify every registered group without opening a browser or recapturing images.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s6/z',reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json','utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(await readFile(reg.script)),reg.scriptSha256);const groups=[];
for(const c of reg.cases){
 const path=`${root}/${c.width}-look-${c.look}/checks.json`,r=JSON.parse(await readFile(path,'utf8'));assert(r.complete);assert.equal(r.artifactSha256,reg.artifactSha256);assert.equal(r.rows.length,reg.screensPerCase);assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 const captures=[];for(const row of r.rows)captures.push({path:row.path,sha256:sha(await readFile(row.path))});
 groups.push({width:r.width,look:r.look,path,sha256:sha(await readFile(path)),captures,minimumContrast:r.minimumContrast,contrastFailures:r.contrastFailures,overflowFailures:r.overflowFailures});
}
const result={complete:true,artifactSha256:reg.artifactSha256,groups,captures:groups.reduce((n,g)=>n+g.captures.length,0),minimumContrast:Math.min(...groups.map(g=>g.minimumContrast)),overflowFailures:groups.reduce((n,g)=>n+g.overflowFailures.length,0),contrastFailures:groups.reduce((n,g)=>n+g.contrastFailures.length,0),scope:'Receipt completeness is independent of numeric contrast/overflow verdicts; no human status-recognition claim.'};
await writeFile(root+'/summary.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({complete:true,captures:result.captures,minimumContrast:result.minimumContrast,overflowFailures:result.overflowFailures,contrastFailures:result.contrastFailures}));
