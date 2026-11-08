import {spawn} from 'node:child_process';
import {withTimingLock} from '../lock.mjs';
const run=(command,args,env={})=>new Promise((res,rej)=>{const p=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});p.on('error',rej);p.on('close',c=>c===0?res():rej(Error(`${command} exit ${c}`)))});
const cats=['mochi','soot','clover','biscuit','sorrel','panko','mallow','cinnamon','brioche','marigold','velvet','inkcap'];
const raw=process.env.B2_EFFECT_RAW||'/tmp/cardrpg-b2-v5-effects';
await withTimingLock('B2 twelve ultimates and protected faces',async()=>{
 await run(process.execPath,['tools/cardrpg-look/capture-effects.mjs'],{BIG_ARTIFACT:process.env.B2_ARTIFACT||'/tmp/cardrpg-b2-v5.html',BIG_EFFECT_OUT:raw,LOOK_EFFECT_IDS:cats.map(c=>`${c}-4`).join(','),LOOK_SKIP_REPORT:'1'});
});
await run('/Users/bao/tools/cardrpg-look/venv/bin/python',['tools/cardrpg-look/b2/face-review.py',raw,process.env.B2_OUT||'reports/cardrpg-look/b2/v5/ultimates']);
