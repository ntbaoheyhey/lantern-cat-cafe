/** Identify the exact code and encoded audio used by an acceptance capture. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
export function runtimeSignature(root){
 const paths=['apps/web/src/audio/engine.ts','apps/web/src/audio/cues.ts','apps/web/src/audio/callouts.ts','apps/web/src/audio/voice-callouts.json','apps/web/src/audio/transactions.ts','apps/web/src/audio/feedback.ts','apps/web/src/game/cardrpg/chain/runtime.ts','apps/web/public/audio/manifest.json','apps/web/src/game/cardrpg/depth/model.ts'];
 for(const name of ['battle-audio.ts','voice-windows.ts','audio-timeline.ts','voice-timing.json','sequence.ts','final-hit.ts'])paths.push('apps/web/src/game/cardrpg/battle-v3/'+name);
 const manifest=JSON.parse(readFileSync(resolve(root,'apps/web/public/audio/manifest.json')));
 for(const pack of Object.values(manifest.packs))for(const format of ['webm','mp3']){
  if(!pack[format]?.startsWith('/audio/'))throw Error('Unexpected audio asset path');
  paths.push('apps/web/public'+pack[format]);
 }
 return [...new Set(paths)].sort().map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}));
}
export function assertUnchanged(root,signature){
 if(JSON.stringify(runtimeSignature(root))!==JSON.stringify(signature))throw Error('Runtime or audio changed during the capture; discard this run.');
}
