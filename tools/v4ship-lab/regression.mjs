/** Preserve each gate's exit status and a single compressed log; never hide a failing gate. */
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {spawn} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,process.argv[2]);
if(existsSync(out))throw Error('Preserve previous regression');
mkdirSync(out,{recursive:true});
const rows=[],log=[];
const tasks=[
 ['server','pnpm',['--filter','@taskbar-hero/supabase-tests','test']],
 ['rules','pnpm',['--filter','@taskbar-hero/game-rules','test']],
 ['web','pnpm',['--filter','@taskbar-hero/web','test']],
 ['typecheck','pnpm',['typecheck']],
 ['parity-probe','node',['tools/v4ship-lab/parity-probe.mjs',relative(root,resolve(out,'parity-probe.json'))]],
 ['build','pnpm',['build']],
];
for(const [name,command,args] of tasks){
 if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
 const started=Date.now();console.log(JSON.stringify({name,status:'running',at:new Date().toISOString()}));
 const child=spawn(command,args,{cwd:root,env:{...process.env,NO_COLOR:'1'},stdio:['ignore','pipe','pipe']});
 for(const stream of ['stdout','stderr'])child[stream].on('data',bytes=>log.push(JSON.stringify({name,stream,text:bytes.toString()})));
 const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
 rows.push({name,command:[command,...args],exitCode,seconds:(Date.now()-started)/1000});
 console.log(JSON.stringify(rows.at(-1)));
 const compressed=gzipSync(log.join('\n')+'\n');writeFileSync(resolve(out,'log.jsonl.gz'),compressed);
 writeFileSync(resolve(out,'check.json'),JSON.stringify({at:new Date().toISOString(),rows,commandsPassed:rows.every(r=>r.exitCode===0),complete:rows.length===tasks.length,officialClassParityGate:false,log:{path:relative(root,resolve(out,'log.jsonl.gz')),sha256:createHash('sha256').update(compressed).digest('hex')}},null,2)+'\n');
}
if(rows.some(r=>r.exitCode!==0))process.exitCode=1;
