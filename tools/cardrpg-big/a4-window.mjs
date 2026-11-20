// REFERENCE: PROMPT-A4-v2. One native child, bounded resumable CPU slices.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdir, open, writeFile } from 'node:fs/promises';
const [phase, script, ...args] = process.argv.slice(2);
if (!phase || !script) throw Error('Provide phase, script and arguments');
const out=`reports/cardrpg-big/a4/${phase}`;
await mkdir(out,{recursive:true});
const rows=[];
let code;
do {
 const slice=rows.length+1, file=await open(`${out}/slice-${slice}.log`,'a'), start=new Date().toISOString();
 code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A4 ${phase} slice ${slice}`,'nice','-n','10',process.execPath,script,...args],{stdio:['ignore',file.fd,file.fd]});
  child.on('error',reject);child.on('close',done);
 });
 await file.close(); rows.push({slice,start,end:new Date().toISOString(),code});
 await writeFile(`${out}/series.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));
 if(code===75)await delay(Number(process.env.BIG_HANDOFF_MS||120000));
}while(code===75);
process.exitCode=code??1;
