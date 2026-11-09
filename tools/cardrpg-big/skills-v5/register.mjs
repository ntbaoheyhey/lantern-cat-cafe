// Register source, cases, seed block and weights before a numeric sample.
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [out,scope,countText='50',mode='on',offsetText='0',chosenText]=process.argv.slice(2),count=Number(countText),offset=Number(offsetText);
assert(out&&['metrics','equipped','teams','sets','tiers','pieces','elites','all'].includes(scope));assert(['on','off'].includes(mode));
assert(Number.isInteger(count)&&count>=20&&count<=500);assert([0,20000,30000,40000].includes(offset));
if(offset){assert.equal(count,500);assert((await readFile('reports/cardrpg-big/skills-v5/REGISTERED-METHOD.md','utf8')).includes(`${offset+1}–${offset+500}`));}
const files=[...new Set(execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],{encoding:'utf8'}).trim().split('\n'))].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort();
const sha=b=>createHash('sha256').update(b).digest('hex'),source=Object.fromEntries(await Promise.all(files.map(async p=>[p,sha(await readFile(`${process.env.BIG_RULES_ROOT||process.cwd()}/${p}`))])));
const scripts=['tools/cardrpg-big/skills-v5/'+(scope==='metrics'?'metrics':scope==='pieces'?'bare-matrix':'matrix')+'.mjs','tools/cardrpg-big/skills-v5/load.mjs'];
if(scope==='metrics')scripts.push('tools/cardrpg-big/skills-v5/design-metrics-v3.mjs');
const registration={registeredAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sample:offset?'acceptance':count===500?'train':'pilot',count,offset,skillsV5:mode==='on',scope,designMetrics:scope==='metrics'&&process.env.V5_DESIGN_METRICS==='1',source,sourceDigest:sha(JSON.stringify(source)),tools:Object.fromEntries(await Promise.all(scripts.map(async p=>[p,sha(await readFile(p))]))),chosenCrew:chosenText?.split(','),weighting:'Equal seeds per cell. Every registered case is retained, including losses and negative paired differences. Existing A5 fixtures and gates stay unchanged; extra elite and V5 crews reported separately.',rules:'Actual production modules, automatic policy, no stat or reward overrides beyond the documented matched-power fixture.'};
await mkdir(out,{recursive:true});await writeFile(out+'/REGISTERED-METHOD.json',JSON.stringify(registration,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,scope,count,offset,mode,sourceDigest:registration.sourceDigest}));
