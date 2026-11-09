// Draft only; promote after L3 acceptance. Each window renders six actual frames.
import { spawn } from 'node:child_process';
import { withTimingLock } from './lock.mjs';
const families=process.argv.slice(2);
if(!families.length)throw Error('Provide the flipbook families for this reviewed round');
const run=(command,args,env={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});
 const timer=setTimeout(()=>child.kill('SIGTERM'),19*60*1000);
 child.once('error',error=>{clearTimeout(timer);reject(error)});
 child.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error(`${command}: ${code}`))});
});
for(const family of families){
 for(let first=0;first<36;first+=6){
  await withTimingLock(`LOOK L4 ${family} Blender frames${first}-${first+5}`,()=>run(
   '/Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender',
   ['--background','--threads','4','--python','tools/cardrpg-look/blender/flipbooks.py','--','--family',family,'--first',String(first),'--count','6','--round',process.env.LOOK_ROUND||'1'],
   {LOOK_ROOT:process.cwd()}));
 }
}
// Packing and contact sheets follow only once all six families have36frames.
