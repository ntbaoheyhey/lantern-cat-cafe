// Bind progression and local-edition protocols before sampling; master seed blocks are explicit.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [out,scope,mode,offsetText='0',inputs]=process.argv.slice(2),offset=Number(offsetText);
assert(out&&['economy','day7','editions'].includes(scope)&&['on','off'].includes(mode));assert([0,20000,30000,40000].includes(offset));
if(offset)assert((await readFile('reports/cardrpg-big/skills-v5/REGISTERED-METHOD.md','utf8')).includes(`${offset+1}–${offset+500}`));
const paths=[...new Set(execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],{encoding:'utf8'}).trim().split('\n'))].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort(),sha=x=>createHash('sha256').update(x).digest('hex');
const source=Object.fromEntries(await Promise.all(paths.map(async p=>[p,sha(await readFile(p))]))),scripts=[`tools/cardrpg-big/skills-v5/${scope}.mjs`,'tools/cardrpg-big/skills-v5/load.mjs'];
const registration={registeredAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope,offset,skillsV5:mode==='on',source,sourceDigest:sha(JSON.stringify(source)),tools:Object.fromEntries(await Promise.all(scripts.map(async p=>[p,sha(await readFile(p))]))),inputs,cohortCount:30,days:45,masterSeeds:`${offset+1}–${offset+500}`,protocol:'Economy uses first30 root accounts per style with unchanged A5 public-command policy, style budgets1/2/6routes and15/60/60service minutes. Route seed=root+day*7919+route*71; paid pull seed=root+day*9349+totalPulls*97; first invitation seed=root. These deterministic streams derive from the registered master seed, and are disclosed separately from the500 direct combat-seed cells. Day7 consumes the new earned saves; same root+7*7919 then+1 retry; no currency/level injection. Editions use all500 direct seeds, local simulation only.'};
if(scope==='day7'){assert(inputs);registration.inputHashes={};for(const style of ['casual','regular','heavy'])for(let i=0;i<30;i++){const path=`${inputs}/${style}-${i}.save`;registration.inputHashes[path]=sha(await readFile(path));}}
await mkdir(out,{recursive:true});await writeFile(`${out}/REGISTERED-METHOD.json`,JSON.stringify(registration,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,scope,offset,mode,sourceDigest:registration.sourceDigest}));
