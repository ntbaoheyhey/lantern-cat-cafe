// Bounded subset only; raw traces remain in own /tmp, durable summaries below.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {withTimingLock} from '../lock.mjs';
const phase=process.argv[2]||'v0',out=`reports/cardrpg-look/b2/${phase}/perf`,raw=`/tmp/cardrpg-b2-${phase}-perf`,artifact=resolve(process.env.B2_ARTIFACT||'docs/cardrpg-look/index.html');
await mkdir(out,{recursive:true});await mkdir(raw,{recursive:true});
const cats=['mochi','soot','clover','biscuit','sorrel','panko','mallow','cinnamon','brioche','marigold','velvet','inkcap'];
const configs=phase==='v0'?[[1280,720,1,1,'high'],[1440,900,1,4,'medium']]:[[1280,720,1,1,'high'],[1440,900,1,1,'high'],[1440,900,1,4,'medium']];
const run=(script,env)=>new Promise((res,rej)=>{const p=spawn(process.execPath,[script],{stdio:'inherit',env:{...process.env,...env,BIG_ARTIFACT:artifact}});p.on('error',rej);p.on('close',c=>c===0?res():rej(Error(`${script} exit${c}`)))});
const receipt={phase,artifact,raw,rows:[],cold:[]};
for(const [ci,c]of configs.entries()){
 const ids=phase==='v0'&&ci===1?['panko-1','cinnamon-4','brioche-4','velvet-4']:cats.flatMap(cat=>[`${cat}-1`,`${cat}-4`]);
 for(let i=0,batch=phase==='v0'?3:24;i<ids.length;i+=batch){const key=`cast-${ci}-${i}`,dir=`${raw}/${key}`;
  await withTimingLock(`B2 ${phase} ${key}`,()=>run('tools/cardrpg-look/b2/probe-casts.mjs',{BIG_SKILL_OUT:dir,BIG_SKILL_IDS:ids.slice(i,i+batch).join(','),BIG_SKILL_CONFIGS:JSON.stringify([c]),BIG_SKILL_PROFILE:phase==='v0'?'1':''}));
  const summary=JSON.parse(await readFile(`${dir}/summary.json`));receipt.rows.push(...summary.rows);receipt.sha256=summary.sha256;await writeFile(`${out}/summary.json`,JSON.stringify(receipt,null,2));
 }
}
for(const cpu of [1,4]){
 const dir=`${raw}/cold-${cpu}`,count=phase==='v0'?1:3;
 await withTimingLock(`B2 ${phase} cold CPU${cpu}`,()=>run('tools/cardrpg-look/b2/probe-cold.mjs',{BIG_OUT:dir,BIG_SCENARIOS:JSON.stringify(Array.from({length:count},()=>[1440,900,1,cpu])),BIG_CAPTURE:'0'}));
 const summary=JSON.parse(await readFile(`${dir}/summary.json`));receipt.cold.push(...summary.rows);await writeFile(`${out}/summary.json`,JSON.stringify(receipt,null,2));
}
