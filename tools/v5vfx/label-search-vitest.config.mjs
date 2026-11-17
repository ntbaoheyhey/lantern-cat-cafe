/** Run the existing public contract tests against an in-memory candidate. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {labelSearchSources,root,sourcePath} from './label-search-prototype.mjs';
const source=labelSearchSources();
export default {
 root,envDir:false,
 plugins:[{name:'cxv-label-search-test-only',enforce:'pre',transform(code,id){
  if(id.split('?')[0]!==resolve(root,sourcePath))return;
  assert.equal(code,source.original,'Shared source changed; recheck the candidate');
  console.info('CXV candidate transform '+source.prunedSha256);return{code:source.pruned,map:null};
 }}],
 test:{environment:'node',include:['apps/web/src/game/squad/turn3d/label-layout.test.ts','apps/web/src/game/squad/turn3d/look-label-layout.test.ts','tools/v5vfx/label-search-contract.test.ts']},
};
