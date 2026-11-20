import type * as T from 'three';

/**
 * three.js deletes a shader program as soon as no live material uses it, and
 * links it again the next time an effect with the same shader appears. Battle
 * effects are short-lived, so the same programs were relinked every few
 * seconds (measured: one hit/KO program relinked 7 times in a 130 s fight).
 * Each relink stalls the whole frame, which reads as the cats freezing.
 * Holding one extra reference keeps each program cached for the renderer's
 * lifetime; there are only a few dozen of them.
 */
type CachedProgram={usedTimes:number;__pinned?:boolean};
export function pinCompiledPrograms(renderer:Pick<T.WebGLRenderer,'info'>):number{
 const programs=renderer.info.programs as unknown as CachedProgram[]|null;
 if(!programs)return 0;
 let pinned=0;
 for(const program of programs){if(program.__pinned)continue;program.__pinned=true;program.usedTimes++;pinned++;}
 return pinned;
}
