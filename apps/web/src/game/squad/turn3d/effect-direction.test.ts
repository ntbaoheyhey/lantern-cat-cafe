import {it,expect} from 'vitest';
import {EFFECT_DIRECTION} from './effect-direction';
import {EFFECT_REGISTRY} from './effects';
it('every playable, gear and status recipe has its own authored silhouette',()=>{
 expect(Object.keys(EFFECT_DIRECTION).sort()).toEqual(Object.keys(EFFECT_REGISTRY).sort());
 expect(new Set(Object.values(EFFECT_DIRECTION).map(d=>d.glyph)).size).toBe(Object.keys(EFFECT_REGISTRY).length);
});
