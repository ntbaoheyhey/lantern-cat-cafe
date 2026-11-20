import {spawn} from 'node:child_process';
import {access,mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const prep='/tmp/cardrpg-a5-c1-revision',out=prep+'/browser';
await mkdir(out,{recursive:true});
for(;;){try{await access(prep+'/artifact/build.json');break;}catch(e){if(e.code!=='ENOENT')throw e;try{process.kill(63633,0);}catch{throw Error('Original reviewed overlay build ended without build.json. Inspect retained build log.');}await delay(5000);}}
let source=await readFile('tools/cardrpg-big/a5-c1-browser.mjs','utf8');
const needle="const shown=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';";
if(!source.includes(needle))throw Error('Review the browser measurement helper before updating');
source=source.replace(needle,`const shown=el=>{
 if(!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')return false;
 for(let parent=el;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS'&&!parent.open){const summary=[...parent.children].find(child=>child.tagName==='SUMMARY');if(!summary?.contains(el))return false;}
 return true;
};`);
await writeFile(prep+'/browser.mjs',source);
const tasks=[['copy',[prep+'/copy-audit.mjs']],...[1280,1440,1024].map(width=>[String(width),[prep+'/browser.mjs',String(width)]])];
for(const [name,args] of tasks){
 await delay(120000);
 const log=await open(out+`/attempt-1-${name}.log`,'wx');let code;
 try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 C1 revised ${name}`,process.execPath,...args],{env:{...process.env,A5_C1_ARTIFACT:prep+'/artifact/index.html',A5_C1_OUTPUT:out},stdio:['ignore',log.fd,log.fd]});child.on('error',reject);child.on('close',done);});}finally{await log.close();}
 console.log(JSON.stringify({name,code}));if(code!==0){process.exitCode=code;break;}
}
