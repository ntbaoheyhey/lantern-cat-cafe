import assert from 'node:assert/strict';
import test from 'node:test';
import {buildIdentity} from './build-identity.mjs';

const common={captureCheckoutCommit:'b'.repeat(40),indexSha256:'c'.repeat(64)};
const descriptor={sourceCommit:'a'.repeat(40),indexSha256:common.indexSha256,
 registryOverride:{mochi:'/units/mochi/test.json'},sourceKind:'ignored override'};
const run=(value)=>buildIdentity({...common,descriptorBytes:Buffer.from(JSON.stringify(value)),descriptorPath:'/build.json'});
test('older served source stays distinct from a newer capture checkout',()=>{
 const result=run(descriptor);
 assert.equal(result.sourceCommit,descriptor.sourceCommit);
 assert.equal(result.captureCheckoutCommit,common.captureCheckoutCommit);
 assert.deepEqual(result.buildIdentity.registryOverride,descriptor.registryOverride);
 assert.equal(result.buildIdentity.verified,true);
 assert.match(result.buildIdentity.descriptorSha256,/^[a-f0-9]{64}$/);
});
test('missing descriptor leaves served source explicitly unknown',()=>{
 const result=buildIdentity(common);
 assert.equal(result.sourceCommit,null);
 assert.equal(result.captureCheckoutCommit,common.captureCheckoutCommit);
 assert.equal(result.buildIdentity.verified,false);
});
test('stale build descriptor is rejected before browser capture',()=>{
 assert.throws(()=>run({...descriptor,indexSha256:'d'.repeat(64)}),/does not match/);
});
test('abbreviated or malformed source commits are rejected',()=>{
 assert.throws(()=>run({...descriptor,sourceCommit:'abc123'}),/full source commit/);
});
