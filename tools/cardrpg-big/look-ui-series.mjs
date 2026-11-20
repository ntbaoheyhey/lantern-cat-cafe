// REFERENCE: look-ui-check.mjs. Sequential short lock windows, no model worker.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
for (const size of ['1024,600','1280,720','1440,900']) {
 const width=size.split(',')[0];
 const exit=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A LOOK L0 UI ${width}`,process.execPath,'tools/cardrpg-big/look-ui-check.mjs'],{stdio:'inherit',env:{...process.env,LOOK_META_SIZE:size,LOOK_META_OUT:`reports/cardrpg-big/look-ui/l0/${width}`}});
  child.on('error',reject);child.on('close',done);
 });
 if(exit)process.exit(exit);
 await delay(6500);
}
