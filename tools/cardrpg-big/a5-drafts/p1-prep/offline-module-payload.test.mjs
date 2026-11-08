import {test} from 'node:test';
import assert from 'node:assert/strict';
import {offlineModulePayload} from './offline-module-payload.mjs';
const chunk=(fileName,code,imports=[],dynamicImports=[],isEntry=false)=>({type:'chunk',fileName,code,imports,dynamicImports,isEntry});

test('offline module map preserves lazy imports and cyclic generated dependencies',()=>{
  const files=[chunk('entry.js','import {x} from "./shared.js";export const play=()=>import("./scene.js");',['shared.js'],['scene.js'],true),
    chunk('shared.js',"export const x=1;export const cycle=()=>import('./entry.js');",[],['entry.js']),chunk('scene.js','import {x} from "./shared.js";export default x;',['shared.js'])];
  const before=JSON.stringify(files),payload=offlineModulePayload(files,'.cafe{display:grid}');
  assert.equal(payload.entry,'@lantern/entry.js');assert.equal(payload.modules.length,3);
  assert(payload.modules[0].code.includes('()=>import("@lantern/scene.js")'));
  assert(payload.modules[1].code.includes("import('@lantern/entry.js')"));
  assert.equal(payload.css,'.cafe{display:grid}');assert.equal(JSON.stringify(files),before);
});

test('external or unrecognized imports cannot leak into the offline artifact',()=>{
  assert.throws(()=>offlineModulePayload([chunk('a.js','import x from "remote";',['remote'],[],true)],''));
  assert.throws(()=>offlineModulePayload([chunk('a.js','const x=1;',['b.js'],[],true),chunk('b.js','export const b=1;')],''));
  assert.throws(()=>offlineModulePayload([chunk('a.js','')],''));
});

test('self-edge metadata may survive an inlined import without creating a fetch',()=>{
  const code='const local={value:1};export const get=()=>Promise.resolve().then(()=>local);';
  const payload=offlineModulePayload([chunk('entry.js',code,[],['entry.js'],true)],'');
  assert.equal(payload.modules[0].code,code);
  const actual=offlineModulePayload([chunk('entry.js','export const get=()=>import("./entry.js");',[],['entry.js'],true)],'');
  assert(actual.modules[0].code.includes('import("@lantern/entry.js")'));
});
