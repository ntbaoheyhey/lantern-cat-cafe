/** Durable full regression receipt. Never suppress failing exit codes. */
import {spawn,execFileSync} from 'node:child_process';
import {createWriteStream,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),item=process.argv[2];
if(!/^[A-Z0-9-]+$/.test(item??''))throw Error('Supply a unique item label');
const out=resolve(root,'reports/v3-feel/tests');mkdirSync(out,{recursive:true});
const results=[];
const commands=[['typecheck',['pnpm','-r','typecheck']],['unit',['pnpm','test']],['parity',['pnpm','--filter','@taskbar-hero/web','exec','vitest','run','src/game/cardrpg/battle-v3/controls.test.ts']],['browser',['python3','scripts/v3feel/run-browser-suite.py',item.toLowerCase()]],['aLane',['node','scripts/v3a2/check-gates.mjs']],['bLane',['node','scripts/v3b2/check-gates.mjs']]];
for(const [id,command] of commands){
 const path=resolve(out,`${item}-${id}.log`),log=createWriteStream(path),started=new Date().toISOString();
 const child=spawn(command[0],command.slice(1),{cwd:root,stdio:['ignore','pipe','pipe']});child.stdout.pipe(log);child.stderr.pipe(log);
 console.log(JSON.stringify({id,pid:child.pid,command,started}));
 const exitCode=await new Promise((yes,no)=>{child.on('error',no);child.on('close',yes);});await new Promise(yes=>log.end(yes));
 results.push({id,command,started,ended:new Date().toISOString(),exitCode,log:{path:relative(root,path),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}});
 writeFileSync(resolve(out,`${item}-regression.json`),JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),results},null,2)+'\n');console.log(`${id}: ${exitCode===0?'PASS':'FAIL'} (${exitCode})`);
}
process.exitCode=results.every(r=>r.exitCode===0)?0:1;
