// REFERENCE: GAMEPLAY-V4 P6. One process; fixed sample order and source hashes.
import {spawn} from 'node:child_process';
import {open,mkdir,readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const node=process.execPath,root='reports/cardrpg-big/a4/p6';
await mkdir(root,{recursive:true});
const steps=[
 ['train',['tools/cardrpg-big/a4-window.mjs','p6-train','tools/cardrpg-big/a4-p6-balance.mjs'],{BIG_BALANCE_SAMPLE:'train'}],
 ['heldout',['tools/cardrpg-big/a4-window.mjs','p6-heldout','tools/cardrpg-big/a4-p6-balance.mjs'],{BIG_BALANCE_SAMPLE:'heldout'}],
 ['economy',['tools/cardrpg-big/a4-window.mjs','p6-economy','tools/cardrpg-big/a4-p5-sim.mjs'],{BIG_META_OUT:root+'/economy',BIG_META_ACCOUNTS:'30',BIG_META_DAYS:'45'}],
 ['gacha',['tools/cardrpg-big/a4-window.mjs','p6-gacha','tools/cardrpg-big/a4-p6-gacha.mjs'],{}],
 ['editions',['tools/cardrpg-big/a4-window.mjs','p6-editions','tools/cardrpg-big/a4-p6-editions.mjs'],{}],
 ['off',['tools/cardrpg-big/a4-window.mjs','p6-off','tools/cardrpg-big/a4-baseline.mjs','--check'],{BIG_OFF_OUT:root+'/off'}],
];
const rows=JSON.parse(await readFile(root+'/series.json','utf8').catch(()=>'[]'));
for(const[name,args,env]of steps){
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 const log=root+'/'+name+'-'+rows.filter(r=>r.name===name).length+'.log',fd=await open(log,'w'),start=new Date().toISOString();
 const code=await new Promise((done,reject)=>{const c=spawn(node,args,{env:{...process.env,...env,BIG_HANDOFF_MS:'120000'},stdio:['ignore',fd.fd,fd.fd]});c.on('error',reject);c.on('close',done);});
 await fd.close();rows.push({name,start,end:new Date().toISOString(),code,log});await writeFile(root+'/series.json',JSON.stringify(rows,null,2));console.log(rows.at(-1));
 if(code!==0){process.exitCode=code;break;}
 await delay(120000);
}
