import {spawn} from 'node:child_process';
import {withTimingLock} from '../../lock.mjs';
const [label,command,...args]=process.argv.slice(2);
if(!command)throw Error('label command args required');
await withTimingLock('V5FULL '+label,async()=>{
 const p=spawn(command,args,{stdio:'inherit',detached:true});
 let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;process.kill(-p.pid,'SIGTERM')},19*60*1000);
 const code=await new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',resolve)});
 clearTimeout(timer);process.exitCode=timedOut?124:code??1;
});
