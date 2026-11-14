/** Layer admission evidence from a complete, unmodified browser mix capture. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const trial=process.argv[2];
if(!/^[\w-]+$/.test(trial??''))throw Error('Supply a captured mix trial');
const base='reports/v3-shell/b2',metric=JSON.parse(readFileSync(`${base}/mix/${trial}-battle.json`));
if(metric.diagnostic||metric.durationSeconds<180||metric.errors.length)throw Error('Complete clean production-output capture required');
const bytes=readFileSync(metric.runtime.path);
if(createHash('sha256').update(bytes).digest('hex')!==metric.runtime.sha256)throw Error('Changed runtime log');
const runtime=JSON.parse(gunzipSync(bytes)),played=runtime.hits.filter(h=>h.result==='played');
const seen=new Map(),repeats=[],voiceRepeats=[];let layerChoices=0,layeredPlays=0;
for(const h of played){
 if(!h.layers)continue;
 const voice=h.id.startsWith('voice.');
 if(!voice)layeredPlays++;
 for(const layer of h.layers){
  const key=h.id+'/'+layer.role;
  if(seen.get(key)===layer.variantId)(voice?voiceRepeats:repeats).push({key,at:h.at,variant:layer.variantId});
  seen.set(key,layer.variantId);if(!voice)layerChoices++;
 }
}
const result={trial,durationSeconds:metric.durationSeconds,played:played.length,layeredPlays,layerChoices,
 consecutiveVariantRepeats:repeats.length,repeats,voiceRepeats,
 maxSfxConcurrency:Math.max(...played.map(h=>h.sfx??0)),maxVoiceConcurrency:Math.max(...played.map(h=>h.voice??0)),
 errors:runtime.errors,log:metric.runtime,runtimeSources:metric.runtimeSources,
 variantScope:'Every layered SFX/UI cue, matching the original S3 definition. Voice repetitions are reported separately; some skill lines have one authored take.',
 scenario:'180-second real browser battle mix; unchanged real UI/rules actions, no playback injection.'};
writeFileSync(`${base}/AUDIO-BATTLE.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({trial,seconds:result.durationSeconds,plays:result.played,repeats:repeats.length,voiceRepeats:voiceRepeats.length,sfx:result.maxSfxConcurrency,voices:result.maxVoiceConcurrency}));
