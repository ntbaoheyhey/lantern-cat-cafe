/** Four natural-play observations; no speedup claim from this visual-asset check. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-D-clover-leaf/natural-play');
assert(!existsSync(out));await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(x).digest('hex');
const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const report={utc:new Date().toISOString(),source,order:['baseline','leaf','leaf','baseline'],snapshots:[],trials:[],pass:false};
for(const name of ['run-clover-leaf-play.mjs','benchmark-boss-play.mjs','clover-leaf-prototype.mjs','browser-fixture.mjs','runtime-evidence.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.snapshots.push({name,sha256:hash(bytes)});}
try{
 for(const [index,mode]of report.order.entries()){
  for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);
  assert.equal(execFileSync('git',['diff',source,'--','apps/web/src','apps/web/public'],{cwd:root,encoding:'utf8'}),'','Do not change runtime during trials');
  const dir=resolve(out,`${index}-${mode}`),log=await open(resolve(out,`${index}-${mode}.log`),'w');let code;
  try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/v5vfx/benchmark-boss-play.mjs'],{cwd:root,env:{...process.env,CXV_CAPTURE_OUT:dir,CXV_CLOVER_LEAF:mode},stdio:['ignore',log.fd,log.fd]});p.on('error',reject);p.on('exit',done);});}finally{await log.close();}
  assert.equal(code,0);const path=resolve(dir,'report.json'),bytes=await readFile(path),trial=JSON.parse(bytes);assert(trial.pass&&trial.cloverLeafMode===mode);
  assert(trial.runs.every(r=>r.blockedRequests.every(b=>b.url==='https://fonts.googleapis.com/css2'&&b.type==='stylesheet')));
  report.trials.push({index,mode,path,sha256:hash(bytes)});await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2)+'\n');console.log(new Date().toISOString()+` Clover ${index} ${mode} passed`);
 }
 report.pass=true;
}catch(error){report.error=String(error);process.exitCode=1;}finally{report.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2)+'\n');}
