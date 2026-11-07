import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const ids=[];
for(const file of ['card-roster-effects.ts','card-roster-batch2-effects.ts','card-roster-batch3-effects.ts']){
 const source=await readFile(`apps/web/src/game/squad/turn3d/${file}`,'utf8');
 ids.push(...[...source.matchAll(/'([a-z]+-[1-4])':/g)].map(m=>m[1]));
}
if(ids.length!==36)throw Error('Expected remaining nine cats /36 skills');
const run=(artifact,out)=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['tools/cardrpg-look/effect-series.mjs'],{stdio:'inherit',env:{...process.env,
  BIG_ARTIFACT:artifact,LOOK_EFFECT_OUT:out,LOOK_EFFECT_IDS:ids.join(',')}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`Review ${out}: ${code}`)));
});
await run('/tmp/cardrpg-look-l4-before.html','reports/cardrpg-look/rounds/effects/before-rest');
await run('/tmp/cardrpg-look-l4-round1.html','reports/cardrpg-look/rounds/effects/round-1-rest');
