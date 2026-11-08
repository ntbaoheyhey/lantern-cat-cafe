// One bounded native lease for delivery UI, default route and lean comparison.
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {withTimingLock} from '../lock.mjs';
const run=(args,env={})=>new Promise((res,rej)=>{const p=spawn(process.execPath,args,{stdio:'inherit',env:{...process.env,...env}});p.on('error',rej);p.on('close',c=>c===0?res():rej(Error(`${args} exit${c}`)))});
const python=(args)=>new Promise((res,rej)=>{const p=spawn('/Users/bao/tools/cardrpg-look/venv/bin/python',args,{stdio:'inherit'});p.on('error',rej);p.on('close',c=>c===0?res():rej(Error(`python exit${c}`)))});
await withTimingLock('B2 delivery layouts, startup and lean pack',async()=>{
 process.env.B2_LOCK_OWNER=String(process.pid);
 await run(['tools/cardrpg-look/b2/ui-check.mjs']);
 const off={BIG_FLAG_OFF_DIST:'/tmp/cardrpg-b2-flag-off',BIG_FLAG_OFF_OUT:'reports/cardrpg-look/b2/v6/startup'};
 await run(['tools/cardrpg-look/flag-off-check.mjs','--prepare'],off);await run(['tools/cardrpg-look/flag-off-check.mjs'],off);
 await python(['reports/cardrpg-look/closure/startup-audit.py','reports/cardrpg-look/b2/v6/startup','/tmp/cardrpg-b2-flag-off']);
 await run(['tools/cardrpg-look/b2/shots.mjs'],{B2_ARTIFACT:'docs/cardrpg-look/b2.html',B2_OUT:'reports/cardrpg-look/b2/v6/1440',B2_SIZES:'[[1440,900,2]]'});
 await run(['tools/cardrpg-look/build.mjs'],{LOOK_OUTPUT:'/tmp/cardrpg-b2-lean.html',LOOK_RECEIPT:'reports/cardrpg-look/b2/v6/lean-build.json',LOOK_LEAN:'1'});
 await run(['tools/cardrpg-look/b2/shots.mjs'],{B2_ARTIFACT:'/tmp/cardrpg-b2-lean.html',B2_OUT:'/tmp/cardrpg-b2-lean-shots',B2_SIZES:'[[1280,720,1]]'});
 await python(['tools/cardrpg-look/b2/ssim.py','reports/cardrpg-look/b2/v6/shots','/tmp/cardrpg-b2-lean-shots','reports/cardrpg-look/b2/v6/lean-ssim.json']);
 delete process.env.B2_LOCK_OWNER;
});
await run(['tools/cardrpg-look/b2/videos.mjs']);
await run(['tools/cardrpg-look/b2/lifecycle.mjs']);
await writeFile('reports/cardrpg-look/b2/v6/delivery-check-complete.json',JSON.stringify({at:new Date().toISOString()},null,2));
