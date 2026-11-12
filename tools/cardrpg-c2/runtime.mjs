import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export const root=resolve(import.meta.dirname,'../..');
export const require=createRequire(resolve(root,'apps/web/package.json'));
export async function loadRuntime(directory){
 await mkdir(directory,{recursive:true});
 const entry=resolve(directory,'entry.ts');
 await writeFile(entry,`export * as R from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/index.ts'))};\nexport {DepthModel} from ${JSON.stringify(resolve(root,'apps/web/src/game/cardrpg/depth/model.ts'))};`);
 const {build}=await import(require.resolve('vite'));
 await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:directory,minify:false,lib:{entry,formats:['es'],fileName:()=> 'runtime.mjs'}}});
 return import(pathToFileURL(resolve(directory,'runtime.mjs')).href+'?at='+Date.now());
}
export function freshAccount(R,seed,now){
 return R.setFormationC2(R.setGameplayA6(R.setSkillsV5(R.setGameplayV4(R.createDepthAccount(seed,now),true),true),true));
}
export function fraction(seed,key){let x=seed>>>0;for(const c of key)x=Math.imul(x^c.charCodeAt(0),16777619)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}
export function decisionDelay(seed,index,action){return Math.round(850+fraction(seed,`${index}:${action.type}`)*1450);}
/** HP targets describe played ordinary encounters; earned skips and elites are
 * reported separately so neither can silently change the normal-win cohort. */
export const normalWin = e => !e.tutorial && !e.boss && e.kind !== 'elite' && !e.skipped && e.result === 'party';
export function summarize(encounters,seconds){
 const quantile=(xs,p)=>{xs=[...xs].sort((a,b)=>a-b);return xs.length?xs[Math.min(xs.length-1,Math.floor(xs.length*p))]:null;};
 const fights=encounters.filter(e=>!e.tutorial),losses=fights.filter(e=>e.result==='enemy'),bosses=fights.filter(e=>e.boss&&!e.skipped);
 return {activeSeconds:seconds,encounters:fights.length,wins:fights.filter(e=>e.result==='party').length,losses:losses.length,firstLossSeconds:losses[0]?.endedAt??null,normalWinHpMedian:quantile(fights.filter(normalWin).map(e=>e.hpRemaining),.5),boss:{count:bosses.length,medianSeconds:quantile(bosses.map(e=>e.playbackSeconds),.5),p90Seconds:quantile(bosses.map(e=>e.playbackSeconds),.9)}};
}
