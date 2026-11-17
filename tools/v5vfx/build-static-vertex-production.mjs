import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {buildProductionComparison,root} from './build-hud-production.mjs';
export {root,appRoot,require} from './build-hud-production.mjs';
export async function buildStaticVertexArtifacts(out){
 const modulePath='apps/web/src/game/rig/drawing-layer.ts',saved=resolve(root,'work/v5/CXV/films/V7-F-static-native');
 const original=await readFile(resolve(saved,'original-drawing-layer.ts'),'utf8'),current=await readFile(resolve(root,modulePath),'utf8');
 const provenance=JSON.parse(await readFile(resolve(saved,'baseline-provenance.json')));
 const hash=s=>createHash('sha256').update(s).digest('hex');
 assert.equal(hash(original),provenance.sourceSha256);
 assert.equal(current.slice(current.indexOf(' private weightsFor(')),original.slice(original.indexOf(' private weightsFor(')),'Point and weight code must remain unchanged');
 return buildProductionComparison(out,{modulePath,currentSource:current,variants:{baseline:original,native:current},metadata:{experiment:'static-vertex',baselineSource:provenance.source,baselineModuleSha256:hash(original),candidateModuleSha256:hash(current)}});
}
