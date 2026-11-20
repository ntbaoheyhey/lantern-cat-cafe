/** Original element arrangements from already shipped, licensed source sprites. */
import {readFileSync,writeFileSync,mkdirSync,statSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const ELEMENTS=['fire','ice','nature','arcane','holy','shadow'];
export const PHASES=['charge','release','impact','tail'];
const palette={
 fire:{pitch:[.90,.98],attack:['hit.heavy','transient'],body:['hit.slash','body'],tail:['hit.slash','tail'],detail:['hit.heavy','sweetener'],charge:['kit.magic.charge','tail'],description:'Crackling metal attack, resonant wood body and a rushing cloth flame.'},
 ice:{pitch:[1.08,1.16],attack:['hit.magic','transient'],body:['kit.magic.tail','body'],tail:['hit.magic','tail'],detail:['hit.slash','sweetener'],charge:['hit.heavy','tail'],description:'Sharp glass onset, brittle glass body, ringing crystal decay.'},
 nature:{pitch:[.96,1.04],attack:['ui.page','transient'],body:['hit.blunt','body'],tail:['hit.blunt','tail'],detail:['kit.magic.charge','foley'],charge:['kit.slash.release','tail'],description:'Paper-leaf rustle, wooden trunk contact and soft cloth decay.'},
 arcane:{pitch:[1.01,1.09],attack:['status.default.on','transient'],body:['hit.magic','body'],tail:['kit.magic.charge','tail'],detail:['hit.magic','sweetener'],charge:['kit.magic.charge','tail'],description:'Digital rising charge, phase-jump body and diffuse harmonic tail.'},
 holy:{pitch:[1.0,1.08],attack:['hit.slash','transient'],body:['kit.magic.tail','body'],tail:['hit.heavy','tail'],detail:['ui.reward','transient'],charge:['hit.heavy','tail'],description:'Bright glass attack, bell/plate resonance and small chime accents.'},
 shadow:{pitch:[.70,.78],attack:['hit.blunt','transient'],body:['hit.heavy','body'],tail:['hit.blunt','tail'],detail:['kit.magic.charge','foley'],charge:['hit.blunt','tail'],description:'Low soft impact, deep punch body and damped cloth decay.'},
};
const clone=x=>structuredClone(x);
export function composeKits(manifest){
 const m=clone(manifest),source=clone(manifest.designs);
 const make=(ref,role,offsetMs,gainDb,eq)=>{
  const l=source[ref[0]]?.layers.find(l=>l.role===ref[1]);if(!l)throw Error('Missing licensed material '+ref.join('/'));
  return {role,variants:l.variants.map(s=>({...s,bus:'sfx'})),offsetMs,gainDb,eq:eq??l.eq};
 };
 for(const [element,p] of Object.entries(palette))for(const phase of PHASES){
  const layers=phase==='impact'?[make(p.attack,'transient',0,-7),make(p.body,'body',7,-4,element==='ice'?'high-pass-80':'low-shelf-180'),make(p.tail,'tail',18,-12,'flat'),make(p.detail,'sweetener',23,-16,'high-pass-1800')]:phase==='charge'?[make(p.body,'body',0,-10),make(p.detail,'foley',9,-17,'high-pass-80'),make(p.charge,'tail',22,-18,'flat')]:phase==='release'?[make(p.attack,'transient',0,-10),make(p.detail,'foley',9,-17,'high-pass-80'),make(p.tail,'tail',22,-18,'flat')]:[make(p.body,'body',0,-18),make(p.detail,'foley',9,-20,'high-pass-80'),make(p.tail,'tail',22,-14,'flat')];
  const id=`kit.${element}.${phase}`;m.designs[id]={bus:'sfx',layers,pitchRange:p.pitch,gainRange:[-1.5,1.5],cooldownMs:phase==='impact'?30:45,priority:phase==='impact'?60:45,ducking:false};m.bindings[id]=id;
 }
 const aliases={ember:'fire',hearth:'fire',garden:'nature',tide:'ice',lightning:'arcane',moon:'holy'};
 for(const [alias,element] of Object.entries(aliases))for(const phase of PHASES){const id=`kit.${alias}.${phase}`;m.designs[id]=clone(m.designs[`kit.${element}.${phase}`]);m.bindings[id]=id;}
 m.elementKits={version:1,method:'Original layered arrangements of shipped CC0 recordings; no new encoded samples, no reference audio.',palettes:Object.fromEntries(Object.entries(palette).map(([k,p])=>[k,p.description])),aliases};
 return m;
}
export function kitSignature(design){return createHash('sha256').update(JSON.stringify({pitch:design?.pitchRange,layers:design?.layers.map(l=>({role:l.role,eq:l.eq,gain:l.gainDb,variants:l.variants.map(s=>[s.pack,s.start,s.duration])}))})).digest('hex');}
export function checkKits(m){
 const errors=[];
 for(const phase of PHASES){
  const rows=ELEMENTS.map(e=>m.designs?.[`kit.${e}.${phase}`]);
  if(rows.some(d=>!d||d.layers.length<3)){errors.push(`${phase}: missing three-layer kit`);continue;}
  if(new Set(rows.map(kitSignature)).size!==6)errors.push(`${phase}: elements share an arrangement`);
  for(const [i,d] of rows.entries())for(const l of d.layers){
   if(l.variants.length<6||new Set(l.variants.map(s=>s.variantId)).size<6)errors.push(`${ELEMENTS[i]}/${phase}/${l.role}: missing six sources`);
   if(l.variants.some(s=>!m.packs[s.pack]||s.bus!=='sfx'||!(s.duration>0)))errors.push(`${ELEMENTS[i]}/${phase}/${l.role}: invalid sample`);
  }
 }
 return errors;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const path='apps/web/public/audio/manifest.json',out='reports/v3-shell/b2/polish/P2';mkdirSync(out,{recursive:true});
 const original=JSON.parse(readFileSync(path)),m=composeKits(original),errors=checkKits(m);if(errors.length)throw Error(errors.join('\n'));
 const signed=p=>({path:p,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')});
 const inputs=[signed(path),signed('apps/web/public/audio/LICENSES.json')];
 const before=Object.fromEntries(PHASES.map(p=>[p,new Set(ELEMENTS.map(e=>kitSignature(original.designs[`kit.${e}.${p}`]))).size]));
 const prior=resolve(out,'before-manifest.json');try{readFileSync(prior);}catch{writeFileSync(prior,JSON.stringify(original,null,2)+'\n');}
 writeFileSync(path,JSON.stringify(m,null,2)+'\n');
 const report={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inputs,beforeDistinctArrangements:before,afterDistinctArrangements:Object.fromEntries(PHASES.map(p=>[p,6])),palettes:m.elementKits,encodedBytes:readdirSync('apps/web/public/audio').filter(f=>/\.(webm|mp3)$/.test(f)).reduce((s,f)=>s+statSync('apps/web/public/audio/'+f).size,0),encodedFilesChanged:0,manifest:signed(path),phases:ELEMENTS.flatMap(e=>PHASES.map(p=>({element:e,phase:p,signature:kitSignature(m.designs[`kit.${e}.${p}`]),layers:m.designs[`kit.${e}.${p}`].layers.length}))),errors};
 writeFileSync(out+'/authored.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({before,after:report.afterDistinctArrangements,bytes:report.encodedBytes,errors}));
}
