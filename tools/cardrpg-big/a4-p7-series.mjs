// REFERENCE: GAMEPLAY-V4 P7. Run only after P6 publication and P7 claim/source commit.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
// Short browser windows yield at least 6.5s; CPU-heavy source gates retain 120s.
const handoffMs=Number(process.env.BIG_P7_HANDOFF_MS||30000);
assert(Number.isFinite(handoffMs)&&handoffMs>=6500);
const out='reports/cardrpg-big/a4/p7',node=process.execPath,py='/tmp/cardrpg-a4-tools/bin/python';
await mkdir(out,{recursive:true});
const p6=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/acceptance.json','utf8'));
const sha=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
for(const [path,expected]of Object.entries(p6.source))assert.equal(await sha(path),expected,`P6 rules changed: ${path}`);
const expected=p6.artifactSha256;
assert.equal(await sha('docs/cardrpg3/index.html'),expected);
const lock=(label,args)=>[node,['tools/cardrpg-big/with-timing-lock.mjs',`A4 P7 ${label}`,...args],{},true];
const command=(script)=>[node,[`tools/cardrpg-big/${script}`],{},false];
const python=(script)=>[py,[`tools/cardrpg-big/${script}`],{},false];
const steps=[
 ['source-gates',node,['tools/cardrpg-big/validate.mjs','a4-p7'],{BIG_HANDOFF_MS:'120000'},false],
 ['offline-build',...lock('offline build',[node,'tools/cardrpg-big/build.mjs'])],
 ['size-exception',...python('a4-p7-size-exception.py')],
 ['full-pack',node,['tools/cardrpg-big/a4-p7-functional.mjs'],{BIG_ARTIFACT:`${process.cwd()}/docs/cardrpg3/index.html`,BIG_FUNCTIONAL_SHA:expected,BIG_LAB_SIZE_EXCEPTION:out+'/size-exception.json',BIG_FUNCTIONAL_OUT:out+'/full',BIG_FUNCTIONAL_GATES:'reports/cardrpg-big/validation/a4-p7.json'},false],
 ['new-screens',...command('a4-p7-new-screens.mjs')],
 ['journey',...lock('earned new-save journey',[node,'tools/cardrpg-big/a4-p7-playthrough.mjs'])],
 ['contact-sheet',...python('a4-p7-contact.py')],
 ['guide-data',...command('a4-p7-guide-data.mjs')],
 ['guide-build',...python('a4-p7-build-guide.py')],
 ['report-for-local-links',...python('a4-p7-report.py')],
 ['guide-check',...lock('guide',[node,'tools/cardrpg-big/a4-p7-guide-check.mjs'])],
 ['performance',...command('a4-p7-performance.mjs')],
 ['performance-summary',...python('a4-p7-performance-report.py')],
 ['evidence-audit',...python('a4-p7-receipts.py')],
 ['report',...python('a4-p7-report.py')],
 ['scope',...command('a4-scope.mjs')],
];
const rows=JSON.parse(await readFile(`${out}/series.json`,'utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
for(const [name,command,args,env,handoff]of steps){
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 assert.equal(await sha('docs/cardrpg3/index.html'),expected);
 const attempts=rows.filter(r=>r.name===name).length;assert(attempts<3,`Two correction rounds exhausted: ${name}`);
 const log=`${out}/${name}-attempt-${attempts+1}.log`,fd=await open(log,'wx'),start=new Date().toISOString();
 if(attempts>0&&['journey','guide-check'].includes(name)){
  const directory=out+'/'+(name==='journey'?'journey':'guide'),retained=`${out}/retained/${name}-attempt-${attempts}`;await mkdir(`${out}/retained`,{recursive:true});
  try{await rename(directory,retained);await writeFile(`${retained}/RELOCATION.md`,`Original failed attempt preserved byte-for-byte. Paths in receipts used ${directory}; files now reside here.\n`);}catch(e){if(e.code!=='ENOENT')throw e;}
 }
 const actualArgs=name==='source-gates'?['tools/cardrpg-big/validate.mjs',`a4-p7-attempt-${attempts+1}`]:args;
 const code=await new Promise((done,reject)=>{const c=spawn(command,actualArgs,{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});c.on('error',reject);c.on('close',done);});
 await fd.close();assert.equal(await sha('docs/cardrpg3/index.html'),expected,'No runtime/HTML changes are allowed between P6 measurements and the P7 pack');
 rows.push({name,code,start,end:new Date().toISOString(),log});await writeFile(`${out}/series.json`,JSON.stringify(rows,null,2));console.log(rows.at(-1));
 if(code!==0){process.exitCode=code;break;}
 if(name==='source-gates'){const receipt=await readFile(`reports/cardrpg-big/validation/a4-p7-attempt-${attempts+1}.json`);const gates=JSON.parse(receipt);assert.equal(gates.length,5);assert(gates.every(g=>g.exit===0));await writeFile('reports/cardrpg-big/validation/a4-p7.json',receipt);}
 if(handoff)await delay(handoffMs);
}
