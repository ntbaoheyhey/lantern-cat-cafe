import {VOICE_CALLOUTS} from './callouts';
import {resolveCue,resolveDesign,type AudioManifest} from './cues';

/** The existing voice boundary, shared by runtime preload and transport packaging. */
export function voicePreloadPacks(m:AudioManifest,actors:Iterable<string>):string[]{
 const units=new Set(actors);
 const packs=new Set(VOICE_CALLOUTS.filter(row=>units.has(row.unitId)).flatMap(row=>(m.cues[row.cueId]??[]).map(sample=>sample.pack)));
 // A terminal cue can resolve to the shared voice pack. Retain its choices.
 for(const unit of units)for(const phase of ['hit','death']){
  const id=`voice.${unit}.${phase}`,design=resolveDesign(id,m);
  const samples=design?(design.baked?.map(v=>v.sample)??design.layers.flatMap(layer=>layer.variants)):resolveCue(id,m)??[];
  for(const sample of samples)packs.add(sample.pack);
 }
 return [...packs];
}
