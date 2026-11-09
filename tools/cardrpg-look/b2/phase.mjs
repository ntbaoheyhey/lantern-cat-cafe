// Native phase coordinator; every heavy child uses the same bounded shared lock.
import {spawn} from 'node:child_process';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {withTimingLock} from '../lock.mjs';
const phase=process.argv[2],out=`reports/cardrpg-look/b2/${phase}`;
if(!/^v[0-6]$/.test(phase??''))throw Error('Expected v0..v6');
await mkdir(out,{recursive:true});
const run=(args,env={})=>new Promise((res,rej)=>{const p=spawn(process.execPath,args,{stdio:'inherit',env:{...process.env,...env}});p.on('error',rej);p.on('close',c=>c===0?res():rej(Error(`${args} exit ${c}`)))});
await withTimingLock(`B2 ${phase} source gates and six shots`,async()=>{
process.env.B2_LOCK_OWNER=String(process.pid);
await run(['tools/cardrpg-look/b2/gates.mjs',phase]);
await withTimingLock(`B2 ${phase} offline build`,()=>run(['tools/cardrpg-look/build.mjs'],{LOOK_OUTPUT:'docs/cardrpg-look/b2.html',LOOK_RECEIPT:'docs/cardrpg-look/b2-build.json'}));
const snapshot=`/tmp/cardrpg-b2-${phase}.html`;
await copyFile('docs/cardrpg-look/b2.html',snapshot);
await run(['tools/cardrpg-look/b2/digest.mjs',phase]);
await run(['tools/cardrpg-look/b2/shots.mjs'],{B2_ARTIFACT:snapshot,B2_OUT:`${out}/shots`});
await writeFile(`${out}/phase-complete.json`,JSON.stringify({phase,at:new Date().toISOString(),artifact:snapshot},null,2));

delete process.env.B2_LOCK_OWNER;
});
