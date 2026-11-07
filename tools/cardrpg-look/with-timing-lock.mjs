import { spawn } from 'node:child_process';
import { withTimingLock } from './lock.mjs';
const [command,...args]=process.argv.slice(2);
if(!command)throw Error('Usage: with-timing-lock.mjs command ...args');
await withTimingLock(`LOOK ${command}`,async()=>{
 process.exitCode=await new Promise((resolve,reject)=>{
  const child=spawn(command,args,{stdio:'inherit'});
  child.once('error',reject);child.once('close',code=>resolve(code??1));
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
 });
});
