// REFERENCE: reports/cardrpg-big2/memory/PROMPT.md; exact base #340.
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),base='97c18853550000deb211912fdbaf66e9229b0c81';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const changed=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
const rules=changed.filter(p=>p.startsWith('packages/game-rules/'));
const forbidden=changed.filter(p=>/^(?:contracts|supabase|packages\/chain|packages\/auth)\//.test(p)
 ||/^apps\/web\/src\/(?:wallet|api)\//.test(p)||p==='packages/game-rules/src/config.ts');
assert.deepEqual(forbidden,[]);
assert.ok(rules.every(p=>p.startsWith('packages/game-rules/src/cardrpg/depth/auto-extras/')));
const immutable=['packages/game-rules/src/config.ts','packages/game-rules/src/cardrpg/depth/save.ts','packages/game-rules/src/cardrpg/depth/contract.ts','apps/web/src/game/squad/gate.ts'];
const parity=await Promise.all(immutable.map(async path=>{
 const before=execFileSync('git',['show',`${base}:${path}`],{cwd:root}),after=await readFile(resolve(root,path));
 const hash=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(hash(before),hash(after));return{path,before:hash(before),after:hash(after),equal:true};
}));
const report={base,head:git('rev-parse','HEAD'),method:'Committed path diff against #340 and exact source bytes for protected flags/config/save/contract. Simulation state parity is measured separately in mechanics/summary.json.',changed,rules,forbidden,parity,
 sharedEdits:[{path:'apps/web/src/game/cardrpg/depth/feel-lab.ts',commit:'29b32479',authorization:'Lane A 2026-11-06T16:59:02Z ANSWER: recipe-driven passive gallery IDs.'}]};
await mkdir(resolve(root,'reports/cardrpg-big2/delivery'),{recursive:true});
await writeFile(resolve(root,'reports/cardrpg-big2/delivery/scope.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({head:report.head,changed:changed.length,rules:rules.length,forbidden,parity:parity.length}));
