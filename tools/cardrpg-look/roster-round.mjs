// One original sculpture/capture at a time; no model calls or helper agents.
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {withTimingLock} from './lock.mjs';
const [roundText='1',ownersText='panko,mallow,cinnamon']=process.argv.slice(2);
const round=Number(roundText),owners=ownersText.split(',');
if(!Number.isInteger(round)||round<1)throw Error('Positive round required');
const base='reports/cardrpg-look/rounds/roster';
const batch=process.env.LOOK_ROSTER_BATCH||'';
if(batch&&!/^[a-z0-9-]+$/.test(batch))throw Error('Invalid batch directory');
const output=`${base}/exports/${batch?`${batch}/`:''}round-${round}`;
const blender='/Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender';
const sources=['tools/cardrpg-look/blender/roster-author.py','tools/cardrpg-look/blender/roster_sculpt.py','tools/cardrpg-look/blender/roster-render.py'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes=Object.fromEntries(await Promise.all(sources.map(async p=>[p,hash(await readFile(p))])));
const verify=async()=>{for(const p of sources)if(hash(await readFile(p))!==hashes[p])throw Error(`Author source changed during round: ${p}`)};
const run=(script,args)=>new Promise((resolve,reject)=>{
 const child=spawn(blender,['--background','--threads','4','--python-exit-code','1','--python',script,'--',...args],{stdio:'inherit',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 const timer=setTimeout(()=>child.kill('SIGTERM'),19*60*1000);
 child.once('error',error=>{clearTimeout(timer);reject(error)});
 child.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error(`${script}: ${code}`))});
});
await mkdir(output,{recursive:true});
for(const owner of owners){
 if(!/^[a-z-]+$/.test(owner))throw Error(`Invalid owner: ${owner}`);
 const target=`${output}/models/${owner}.glb`;
 if(await access(target).then(()=>true,()=>false))throw Error(`Preserve existing candidate; choose a new round: ${target}`);
}
await mkdir(`${output}/sources`,{recursive:true});
for(const source of sources)await writeFile(`${output}/sources/${source.split('/').at(-1)}`,await readFile(source));
const receipt={round,owners,sourceHashes:hashes,baked:process.env.LOOK_ROSTER_GEOMETRY_ONLY!=='1',rows:[],status:'visual review required'};
for(const owner of owners){
 await verify();
 if(round===1)await withTimingLock(`LOOK L5 before ${owner} three angles`,()=>run(sources[2],['--source',`assets/cardrpg2/models/${owner}.glb`,'--out',`${base}/${owner}/before`]));
 await withTimingLock(`LOOK L5 R${round} sculpture ${owner}`,()=>run(sources[0],['--cat',owner,'--round',String(round),'--output-root',output,...(receipt.baked?['--bake']:[])]));
 await verify();
 await withTimingLock(`LOOK L5 R${round} ${owner} three angles`,()=>run(sources[2],['--source',`${output}/models/${owner}.glb`,'--out',`${base}/${owner}/round-${round}/views`]));
 receipt.rows.push({owner,model:`${output}/models/${owner}.glb`,sha256:hash(await readFile(`${output}/models/${owner}.glb`))});
 await writeFile(`${output}/series.json`,JSON.stringify(receipt,null,2)+'\n');
}
await verify();
console.log(JSON.stringify(receipt));
