// Reuse the existing pilot's direct canvas MediaRecorder method; no recorder feature work.
import {chromium} from '../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
const id=process.argv[2]??'D1',revision=Number(process.argv[3]??0),root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'tools/v3craft-lab/q3/raw',`${id}-r${revision}`);mkdirSync(out,{recursive:true});
const file=out+'/film.webm';writeFileSync(file,Buffer.alloc(0));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.exposeFunction('__saveDrill',bytes=>appendFileSync(file,Buffer.from(bytes)));
 await page.goto(`http://127.0.0.1:5990/@fs${root}/tools/v3craft-drills/index.html?drill=${id}&revision=${revision}`);
 await page.waitForFunction(()=>window.__drill?.ready,null,{timeout:30000});
 const result=await page.evaluate(async()=>{
  const p=window.__drill;p.stop();p.draw(0);const stream=p.canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:3e6});const writes=[];
  recorder.ondataavailable=e=>{if(e.data.size)writes.push(e.data.arrayBuffer().then(b=>window.__saveDrill([...new Uint8Array(b)])));};
  const ended=new Promise(resolve=>recorder.onstop=resolve);recorder.start();p.play();await new Promise(r=>setTimeout(r,2000));p.stop();recorder.stop();await ended;await Promise.all(writes);stream.getTracks().forEach(t=>t.stop());return {trace:p.trace,source:p.actor.source,final:p.draw(2000)};
 });
 writeFileSync(out+'/trace.json',JSON.stringify({at:new Date().toISOString(),id,revision,errors,...result}));
 console.log(JSON.stringify({id,revision,errors,samples:result.trace.length,source:result.source,file}));
 if(errors.length)process.exitCode=1;
}finally{await browser.close();}
