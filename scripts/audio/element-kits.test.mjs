import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkKits,composeKits,ELEMENTS,PHASES,kitSignature} from './author-element-kits.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../apps/web/public/audio/manifest.json',import.meta.url)));
test('six material palettes provide all four phases without new audio files',()=>{
 const result=composeKits(manifest);assert.deepEqual(checkKits(result),[]);assert.deepEqual(result.packs,manifest.packs);
 for(const phase of PHASES){assert.equal(new Set(ELEMENTS.map(e=>kitSignature(result.designs[`kit.${e}.${phase}`]))).size,6);}
 for(const [alias,element] of Object.entries(result.elementKits.aliases))for(const phase of PHASES)assert.deepEqual(result.designs[`kit.${alias}.${phase}`],result.designs[`kit.${element}.${phase}`]);
});
test('rejects renamed copies and incomplete source pools',()=>{
 const same=composeKits(manifest);for(const e of ELEMENTS)same.designs[`kit.${e}.impact`]=same.designs['kit.fire.impact'];assert.ok(checkKits(same).some(e=>e.includes('share an arrangement')));
 const missing=composeKits(manifest);missing.designs['kit.fire.charge'].layers[0].variants.pop();assert.ok(checkKits(missing).some(e=>e.includes('six sources')));
});
