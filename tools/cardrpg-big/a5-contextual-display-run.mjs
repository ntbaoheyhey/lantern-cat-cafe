// REFERENCE: display-context40. One native resumable coordinator, bounded shared leases.
import {readFile,open,readdir,mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/b1/display-context-40';
const reg=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json'));
await mkdir(out+'/logs',{recursive:true});
assert(!(await readFile(out+'/complete.json').then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})),'Already complete');
let code,slice=1+Math.max(0,...(await readdir(out+'/logs')).map(p=>Number(p.match(/^slice-(\d+)\.log$/)?.[1]??0)));
do{
 const file=out+'/logs/slice-'+slice+++'.log',fd=await open(file,'wx');
 try{code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 contextual display40',process.execPath,'tools/cardrpg-big/a5-contextual-display.mjs'],{env:{...process.env,BIG_RULES_ROOT:reg.sourceRoot},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',resolve);});}finally{await fd.close();}
 console.log(JSON.stringify({file,code}));if(code!==0&&code!==75)process.exit(code??1);await delay(7000);
}while(code===75);
await writeFile(out+'/complete.json',JSON.stringify({complete:true,at:new Date().toISOString()})+'\n');
