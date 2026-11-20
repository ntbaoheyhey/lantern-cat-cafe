import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

/** Optional shared descriptor for browser gates whose existing CLI takes positional arguments. */
export function readBuildIdentity(root,indexSha256) {
 const descriptorPath=process.env.CXI_BUILD_DESCRIPTOR?resolve(root,process.env.CXI_BUILD_DESCRIPTOR):undefined;
 return buildIdentity({indexSha256,descriptorPath,descriptorBytes:descriptorPath?readFileSync(descriptorPath):undefined,
  captureCheckoutCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()});
}

/** A checkout HEAD is not proof of the source used by an older served build. */
export function buildIdentity({captureCheckoutCommit,indexSha256,descriptorBytes,descriptorPath}) {
 if (descriptorBytes === undefined) return {
  sourceCommit:null,captureCheckoutCommit,
  buildIdentity:{verified:false,reason:'No build descriptor supplied; served source is unknown.'},
 };
 const descriptor=JSON.parse(descriptorBytes.toString());
 assert(/^[a-f0-9]{40}$/.test(descriptor.sourceCommit),'Build descriptor requires a full source commit');
 assert.equal(descriptor.indexSha256,indexSha256,'Build descriptor does not match served index');
 return {sourceCommit:descriptor.sourceCommit,captureCheckoutCommit,
  buildIdentity:{verified:true,descriptorPath,
   descriptorSha256:createHash('sha256').update(descriptorBytes).digest('hex'),
   registryOverride:descriptor.registryOverride??null,sourceKind:descriptor.sourceKind??null}};
}
