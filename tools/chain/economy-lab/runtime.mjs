import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
export const root=resolve(import.meta.dirname,'../../..');
export const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
export async function loadLabRuntime(directory=resolve(root,'work/economy-lab/runtime')){
 mkdirSync(directory,{recursive:true});
 const entry=resolve(directory,'entry.ts');
 writeFileSync(entry,`export * as R from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/index.ts'))};\nexport {playRun} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/run-bot.ts'))};\nexport {firstInvitation} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/onboarding.ts'))};\nexport {economySinkQuote,ECONOMY_SINK_IDS} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/economy-sinks-v3.ts'))};\nexport {gearQualityBp} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/fusion-v3.ts'))};\nexport {ECONOMY_LAB} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/economy-lab.ts'))};\nexport {tiedRankAmounts} from ${JSON.stringify(resolve(root,'packages/chain/src/rank.ts'))};\n`);
 const require=createRequire(resolve(root,'apps/web/package.json')),{build}=await import(require.resolve('vite'));
 await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:directory,minify:false,lib:{entry,formats:['es'],fileName:()=> 'runtime.mjs'}}});
 const path=resolve(directory,'runtime.mjs');return {...await import(pathToFileURL(path).href+'?v='+sha(path)),runtimePath:path};
}
export function rng(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function lognormal(random,mean,sigma){const z=Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random());return mean*Math.exp(sigma*z-sigma*sigma/2);}
export function quantile(values,p){const xs=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!xs.length)return null;const k=(xs.length-1)*p,i=Math.floor(k);return xs[i]+(xs[Math.min(i+1,xs.length-1)]-xs[i])*(k-i);}
