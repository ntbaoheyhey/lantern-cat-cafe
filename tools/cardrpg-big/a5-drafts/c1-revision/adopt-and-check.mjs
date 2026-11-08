import {access,readFile,writeFile,copyFile,mkdir,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const prep='/tmp/cardrpg-a5-c1-revision',out='reports/cardrpg-big/a5/c1/reviewed',hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'codex/cardrpg-a5-c1-2026-11-08');
const checks=JSON.parse(await readFile('reports/cardrpg-big/a5/c1/gates/checks.json','utf8'));assert.equal(checks.filter(r=>r.code===0).length,6);
for(;;){try{await access(prep+'/artifact/build.json');break;}catch(e){if(e.code!=='ENOENT')throw e;try{process.kill(63633,0);}catch{throw Error('Original reviewed overlay build ended without build.json. Inspect original log.');}await delay(5000);}}
const inputs=JSON.parse(await readFile(prep+'/inputs.json','utf8')),overlay=JSON.parse(await readFile(prep+'/overlay-receipt.json','utf8')),files=Object.keys(inputs);
assert.equal(execFileSync('git',['diff','--cached','--name-only'],{encoding:'utf8'}).trim(),'','Preserve unrelated staging');
for(const [file,before]of Object.entries(inputs)){assert.equal(hash(await readFile(file)),before,file);assert.equal(hash(await readFile(prep+'/source/'+file)),overlay.overlay[process.cwd()+'/'+file].sha256,file+' staged');}
for(const file of files)await copyFile(prep+'/source/'+file,file);
await mkdir(out,{recursive:true});
const original=JSON.parse(await readFile('reports/cardrpg-big/a5/c1/source-tested.json','utf8'));
await writeFile(out+'/adoption.json',JSON.stringify({adoptedAt:new Date().toISOString(),original,inputs,overlay,after:Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile(file))])))},null,2));
execFileSync('git',['add','--',...files]);execFileSync('git',['commit','-m','fix(a5-c1): keep filtered equipment actions aligned and simplify preparation'],{stdio:'inherit'});
const log=await open('reports/cardrpg-big/a5/c1/reviewed-gates-coordinator.log','wx');
try{process.exitCode=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/a5-validate.mjs','c1-reviewed'],{stdio:['ignore',log.fd,log.fd]});child.on('error',reject);child.on('close',done);});}finally{await log.close();}
