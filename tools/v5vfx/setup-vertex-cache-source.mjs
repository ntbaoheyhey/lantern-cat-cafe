/** Study-only canonical setup buffer; preserve every logical and expression update. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const modulePath='apps/web/src/game/rig/drawing-layer.ts';
export const hash=value=>createHash('sha256').update(value).digest('hex');
function once(source,pattern,replacement){
 assert.equal([...source.matchAll(new RegExp(pattern.source,'g'))].length,1,'Changed source marker: '+pattern);
 return source.replace(pattern,replacement);
}
export function setupCacheSource(source){
 const typed=source.includes('private stationaryRowsValid');
 let s=once(source,/(?<!\.)stationaryRowsValid\s*=\s*false;/,'$&\n '+(typed?'private setupVertices?:{attribute:T.BufferAttribute|T.InterleavedBufferAttribute;array:ArrayLike<number>;data:Float32Array};':'setupVertices;'));
 s=once(s,/const weights\s*=\s*this\.weightsFor\(this\.key\);/,
  `// Canonical reset still updates clip, map, secondary motion, face and eyes above.
  const setup=name==='idle'&&Object.is(seconds,0)&&reduced===false&&damageAge===undefined&&Object.is(clock,0)&&Object.is(target,0)&&critAge===-1&&this.point===DrawingLayer.prototype.point;
  const cached=this.setupVertices;
  if(setup&&cached&&cached.attribute===positions&&cached.array===positions.array&&cached.data.length===positions.array.length){
   positions.array.set(cached.data);this.stationaryRowsValid=true;positions.needsUpdate=true;return;
  }
  $&`);
 s=once(s,/this\.stationaryRowsValid\s*=\s*finite;/,
  `// Metadata/source vertices are immutable; cache only the finite constructor reset.
  if(setup&&finite&&!this.setupVertices&&positions.array instanceof Float32Array&&positions.array.every(Number.isFinite))this.setupVertices={attribute:positions,array:positions.array,data:Float32Array.from(positions.array)};
  $&`);
 s=once(s,/this\.vertexWeights\.clear\(\);/,'$&this.setupVertices=undefined;');
 return s;
}
export async function installSetupCacheOverride(page,{mode='baseline'}={}){
 assert(['baseline','cached'].includes(mode));const evidence={mode,modules:[]};
 await page.route('**/drawing-layer.ts*',async route=>{
  const response=await route.fetch(),original=await response.text(),body=mode==='cached'?setupCacheSource(original):original;
  evidence.modules.push({url:route.request().url(),sourceSha256:hash(original),overrideSha256:hash(body)});
  await route.fulfill({response,body,contentType:'text/javascript'});
 });return evidence;
}
