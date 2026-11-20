import {spawn} from 'node:child_process';
import {access,mkdir,open} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const prep='/tmp/cardrpg-a5-c1-prep',out=prep+'/browser';
await mkdir(out,{recursive:true});
for(;;){
 try{await access(prep+'/artifact/build.json');break;}
 catch{try{process.kill(49190,0);}catch{throw Error('Original isolated C1 build stopped before producing build.json; inspect its original log.');}await delay(5000);}
}
await delay(120000);
for(const width of [1280,1440,1024]){
 const log=await open(out+`/attempt-1-${width}.log`,'wx');let code;
 try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 isolated C1 browser ${width}`,process.execPath,prep+'/a5-c1-browser.mjs',String(width)],{stdio:['ignore',log.fd,log.fd],env:{...process.env,A5_C1_ARTIFACT:prep+'/artifact/index.html',A5_C1_OUTPUT:out}});p.on('error',reject);p.on('close',done);});}
 finally{await log.close();}
 console.log(JSON.stringify({width,code}));if(code!==0){process.exitCode=code;break;}
 await delay(120000);
}
