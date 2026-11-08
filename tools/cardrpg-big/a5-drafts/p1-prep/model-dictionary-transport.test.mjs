import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {modelRanges,packModelDictionary,restoreModelDictionary} from './model-dictionary-transport.mjs';

test('shared source model views round-trip without changing any source byte',async()=>{
  const assets=await Promise.all(['yarn-giant','pantry-crown'].map(async id=>({key:id,mime:'model/gltf-binary',bytes:await readFile(`assets/cardrpg2/models/${id}.glb`)})));
  const originals=assets.map(a=>Buffer.from(a.bytes));
  const packed=packModelDictionary(assets),entries=packed.entries.map(e=>[e.offset,e.length]);
  assert(packed.entries.some(e=>e.uses>1));assert(packed.assets.every(a=>a.patches.length>0));
  for(const [i,a]of packed.assets.entries()){
    const result=restoreModelDictionary(new Uint8Array(a.bytes),a.patches,packed.dictionary,entries);
    assert.deepEqual(Buffer.from(result),originals[i]);assert.deepEqual(assets[i].bytes,originals[i]);
    let end=0;for(const r of modelRanges(originals[i])){assert(r.offset>=end);end=r.offset+r.length;}
  }
});

test('restoration rejects overlapping, out-of-range and unknown dictionary references',()=>{
  const restore=(patches,entries=[[0,4]])=>restoreModelDictionary(new Uint8Array(10),patches,new Uint8Array([1,2,3,4]),entries);
  assert.throws(()=>restore([[0,1]]));assert.throws(()=>restore([[8,0]]));
  assert.throws(()=>restore([[-1,0]]));assert.throws(()=>restore([[0,0],[2,0]]));
  assert.throws(()=>restore([[0,0]],[[2,4]]));
  assert.deepEqual([...restore([[1,0]])],[0,1,2,3,4,0,0,0,0,0]);
});
