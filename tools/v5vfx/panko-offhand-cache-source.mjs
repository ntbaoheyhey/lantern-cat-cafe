/** Study-only Panko weight cache. Does not mutate application source or other units' stride. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const sourcePath='apps/web/src/game/rig/drawing-layer.ts';
export const hash=value=>createHash('sha256').update(value).digest('hex');
function once(source,from,to){assert.equal(source.split(from).length,2,'Source marker changed: '+from);return source.replace(from,to);}
export function pankoOffhandCacheSource(source){
 let s=once(source,'const stride=Weight.Count+overlaps.length,data=',"const cachedOffHand=m.unit==='panko'?frame.sockets.offHand:undefined;\n  const stride=Weight.Count+overlaps.length+(cachedOffHand?1:0),data=");
 s=once(s,'  const weights={data,stride};this.vertexWeights.set(key,weights);return weights;',`  const weights={data,stride};this.vertexWeights.set(key,weights);return weights;`);
 s=once(s,'    data[offset+Weight.Count+index]=smooth(1-dx*dx-dy*dy)*guard;\n   }',`    data[offset+Weight.Count+index]=smooth(1-dx*dx-dy*dy)*guard;
   }
   if(cachedOffHand){const ax=(x-cachedOffHand[0])/(fw*.42),ay=(y-cachedOffHand[1])/(fh*.80);data[offset+Weight.Count+overlaps.length]=smooth(1-ax*ax-ay*ay)*guard;}`);
 s=once(s,'   if(hand){const ax=(x-hand[0])/(fw*.42),ay=(y-hand[1])/(fh*.80),weight=smooth(1-ax*ax-ay*ay)*guard;',`   if(hand){let weight=weights?.[offset+Weight.Count+overlaps.length];
    if(weight===undefined){const ax=(x-hand[0])/(fw*.42),ay=(y-hand[1])/(fh*.80);weight=smooth(1-ax*ax-ay*ay)*guard;}`);
 assert.notEqual(s,source);return s;
}
