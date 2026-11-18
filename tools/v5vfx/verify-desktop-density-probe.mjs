/** Reproduce the retained unordered-Map attribution without recapturing or changing evidence. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const path=resolve(root,'reports/v5/CXV/V7-F-desktop-density-probe.json'),summary=JSON.parse(await readFile(path));
const rawBytes=await readFile(summary.raw.path),raw=JSON.parse(rawBytes);assert.equal(hash(rawBytes),summary.raw.sha256);assert(!raw.failure);
assert.equal(summary.originalRawPass,false);assert.equal(raw.pass,false);assert.equal(raw.runs.length,6);assert(summary.pass&&summary.reviewedUtc);
const ordered=geometry=>({...geometry,units:[...geometry.units].sort((a,b)=>a.id.localeCompare(b.id))});
let rawOrderDifferences=0;
for(const r of raw.runs){
 const base=raw.runs.find(v=>v.ratio===1&&v.reduced===r.reduced);assert(base);
 assert.deepEqual(ordered(r.geometry),ordered(base.geometry));
 if(JSON.stringify(r.geometry.units.map(v=>v.id))!==JSON.stringify(base.geometry.units.map(v=>v.id)))rawOrderDifferences++;
 const reported=summary.runs.find(v=>v.ratio===r.ratio&&v.reduced===r.reduced);assert(reported?.keyedGeometryExact);assert.deepEqual(reported.density,r.density);assert.deepEqual(reported.identity,r.identity);
}
assert.equal(rawOrderDifferences,4);assert(raw.runs.slice(2).every(r=>!r.geometryExact));
const out=resolve(root,'work/v5/CXV/films/V7-F-desktop-density-probe');
for(const snap of raw.snapshots)assert.equal(hash(await readFile(resolve(out,snap.name))),snap.sha256);
for(const capture of summary.captures){const bytes=await readFile(capture.path);assert.equal(hash(bytes),capture.sha256);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);}
for(const view of summary.reviews)assert.equal(hash(await readFile(view.path)),view.sha256);
assert.deepEqual(summary.captures,raw.captures);assert.deepEqual(summary.reviews,raw.reviews);
console.log(JSON.stringify({pass:true,keyedExact:raw.runs.length,rawOrderDifferences,captures:summary.captures.length,reviews:summary.reviews.length,retainedRawPass:raw.pass}));
