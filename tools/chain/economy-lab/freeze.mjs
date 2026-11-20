import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {root,sha} from './runtime.mjs';

/** A long run must not import edits made after it started. */
export function freezeModel(label,runtimePath,{native=false,evidenceDirectory=resolve(root,'reports/v3-shell/b2/econ')}={}){
 if(!/^[A-Za-z0-9_-]+$/.test(label))throw Error('Invalid snapshot label');
 const paths=['tools/chain/economy-lab/runtime.mjs','tools/chain/economy-lab/token.mjs','tools/chain/economy-lab/studio.mjs','tools/chain/economy-lab/search-core.mjs','scripts/v3b2/thresholds.mjs',...(native?['tools/chain/economy-lab/cohort.mjs','tools/chain/economy-lab/cohort-worker.mjs']:['tools/chain/economy-lab/search-worker.mjs'])];
 const directory=resolve(root,'work/economy-lab/frozen',label),sources=paths.map(path=>({path,sha256:sha(resolve(root,path)),text:readFileSync(resolve(root,path),'utf8')}));
 for(const file of sources){const to=resolve(directory,file.path);mkdirSync(resolve(to,'..'),{recursive:true});writeFileSync(to,file.text);}
 const out=resolve(evidenceDirectory,'snapshots',label+'.json.gz');mkdirSync(resolve(out,'..'),{recursive:true});
 writeFileSync(out,gzipSync(JSON.stringify({runtime:readFileSync(runtimePath,'utf8'),runtimeSha256:sha(runtimePath),sources})));
 return {worker:pathToFileURL(resolve(directory,'tools/chain/economy-lab',native?'cohort-worker.mjs':'search-worker.mjs')),evidence:{path:relative(root,out),sha256:sha(out)}};
}

/** Resume with the exact recorded worker code, not newly compiled live edits. */
export function restoreModel(label,evidence,{native=false}={}){
 if(!/^[A-Za-z0-9_-]+$/.test(label)||sha(resolve(root,evidence.path))!==evidence.sha256)throw Error('Frozen model hash mismatch');
 const snapshot=JSON.parse(gunzipSync(readFileSync(resolve(root,evidence.path))));
 const directory=resolve(root,'work/economy-lab/frozen',label);
 for(const file of snapshot.sources){const to=resolve(directory,file.path);if(!to.startsWith(directory+'/'))throw Error('Invalid snapshot path');mkdirSync(resolve(to,'..'),{recursive:true});writeFileSync(to,file.text);if(sha(to)!==file.sha256)throw Error('Frozen source hash mismatch');}
 const runtimePath=resolve(directory,'runtime.mjs');writeFileSync(runtimePath,snapshot.runtime);
 if(snapshot.runtimeSha256&&sha(runtimePath)!==snapshot.runtimeSha256)throw Error('Frozen runtime hash mismatch');
 return {runtimePath,evidence,worker:pathToFileURL(resolve(directory,'tools/chain/economy-lab',native?'cohort-worker.mjs':'search-worker.mjs'))};
}
