/** Recheck the P2 material arrangements and real playback evidence. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {checkKits,ELEMENTS,PHASES,kitSignature} from './author-element-kits.mjs';
const base='reports/v3-shell/b2/polish/P2';
const read=p=>JSON.parse(readFileSync(p));
const manifest=read('apps/web/public/audio/manifest.json'),authored=read(base+'/authored.json'),playback=read(base+'/playback.json');
const signed=r=>!!r&&createHash('sha256').update(readFileSync(r.path)).digest('hex')===r.sha256;
const rows=[];
const gate=(name,pass,measured,required)=>rows.push(`${pass?'PASS':'FAIL'} P2.${name}: measured=${measured}; required=${required}`);
const issues=checkKits(manifest);
gate('arrangements',issues.length===0,issues.length,'0 missing or duplicated elemental arrangements');
const phases=ELEMENTS.flatMap(element=>PHASES.map(phase=>({element,phase,id:`kit.${element}.${phase}`})));
gate('authored',phases.every(p=>authored.phases.some(a=>a.element===p.element&&a.phase===p.phase&&a.signature===kitSignature(manifest.designs[p.id]))),authored.phases.length,'24 current arrangements match measured source');
let good=0;
for(const phase of phases){
 const row=playback.rows.find(r=>r.id===phase.id),design=manifest.designs[phase.id];
 if(!row||row.takes.length!==6||row.takes.some(t=>t.result!=='played'))continue;
 if(design.layers.every(layer=>{
  const takes=row.takes.map(t=>t.layers.find(l=>l.role===layer.role));
  return takes.every(t=>t&&layer.variants.some(v=>v.variantId===t.variantId))&&new Set(takes.map(t=>t.variantId)).size===6;
 }))good++;
}
gate('playback',good===24,good,'24/24 phases, six distinct admitted sources per layer');
gate('errors',playback.errors.length===0,playback.errors.length,'0 browser errors');
gate('bytes',authored.encodedFilesChanged===0,authored.encodedFilesChanged,'0 encoded audio files changed by P2');
gate('reel',signed(playback.reel),signed(playback.reel)?1:0,'SHA-256-verified isolated kit reel');
writeFileSync(base+'/gates.log',rows.join('\n')+'\n');
console.log(rows.join('\n'));
process.exitCode=rows.every(r=>r.startsWith('PASS'))?0:1;
