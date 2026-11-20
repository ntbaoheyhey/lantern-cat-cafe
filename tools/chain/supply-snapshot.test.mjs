import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSourceSnapshot} from './supply-snapshot.mjs';
const supply={source:'Conditional source fixture',rarePerActiveWeek:0,epicPerActiveWeek:2};
const hashes={'rules.ts':'a','study.mjs':'b'};
const study={snapshotVersion:1,source:supply.source,supply,sourceHashes:hashes};

test('a matching source snapshot retains measured rates',()=>{
  assert.deepEqual(assertSourceSnapshot(supply,study,{...hashes}),supply);
});
test('changed, added or removed source invalidates the measurement',()=>{
  for(const current of [{...hashes,'rules.ts':'c'},{...hashes,'new.ts':'d'},{'rules.ts':'a'}])
    assert.throws(()=>assertSourceSnapshot(supply,study,current),/Source supply is stale/);
});
test('changed rates, provenance or unsupported snapshot cannot silently feed the default model',()=>{
  assert.throws(()=>assertSourceSnapshot({...supply,epicPerActiveWeek:4},study,hashes),/Supply rates differ/);
  assert.throws(()=>assertSourceSnapshot(supply,{...study,source:'unrelated'},hashes),/provenance differs/);
  assert.throws(()=>assertSourceSnapshot(supply,{...study,snapshotVersion:undefined},hashes),/Unsupported/);
});
