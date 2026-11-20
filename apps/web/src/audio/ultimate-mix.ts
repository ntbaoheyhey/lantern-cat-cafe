/** V9 mix rules for the battle (C5): ultimate duck, hit pitch spread, voice cap, AGS layers. */
export const ULT_DUCK={db:-6,attack:.05,hold:1.5,release:.4};
export const HIT_PITCH_SPREAD=.05;
export const MAX_SAME_SOUND=3;
export const V9_ULT_CATS=['mochi','clover','soot'] as const;
export type V9UltLayer='riser'|'transient'|'body'|'tail';
export const V9_ULT_LAYERS:readonly V9UltLayer[]=['riser','transient','body','tail'];
/** Which AGS layers each director beat triggers. */
export function layersForBeat(beat:string):V9UltLayer[]{
 return beat==='cutin'?['riser']:beat==='impact'?['transient','body']:beat==='linger'?['tail']:[];
}
export function v9LayerPaths(cat:string,layer:V9UltLayer){return [`v9/sfx-ult-${cat}-${layer}.opus`,`v9/sfx-ult-${cat}-${layer}.m4a`];}
/** Normal hits vary by +/-5% so repeats do not machine-gun. */
export function hitPitch(random:()=>number){return 1+(random()*2-1)*HIT_PITCH_SPREAD;}
/** Older playing groups of the same sound to stop so at most MAX_SAME_SOUND remain after a new one starts. */
export function groupsToEvict(sameIdGroups:readonly number[]){
 const unique=[...new Set(sameIdGroups)].sort((a,b)=>a-b);
 return unique.slice(0,Math.max(0,unique.length-(MAX_SAME_SOUND-1)));
}
/** Legacy single-file ult cues are skipped once the V9 layers for that cat are loaded. */
export function legacyUltCat(id:string){const m=/^ult\.(mochi|clover|soot)\./.exec(id);return m?m[1]:undefined;}
