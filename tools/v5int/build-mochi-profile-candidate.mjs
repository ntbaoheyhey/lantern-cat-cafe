/** Rebuild pinned R7 application inputs with only the existing Mochi study enrollment. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web');
const [priorArg,label]=process.argv.slice(2);
assert(priorArg&&/^mochi-only-profile-r[1-9][0-9]*$/.test(label));
const priorPath=resolve(priorArg),priorBytes=await readFile(priorPath),prior=JSON.parse(priorBytes);
const sha=data=>createHash('sha256').update(data).digest('hex');
const out=resolve(root,'work/v5/CXI/batch-m',label),dist=resolve(out,'dist');
assert(!existsSync(out),'Preserve prior profiles');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),name);};
stop();
const equivalencePaths=['apps/web','packages','assets','tools/v5int/build-asset-exclusions.mjs','package.json','pnpm-lock.yaml','pnpm-workspace.yaml'];
assert.equal(execFileSync('git',['diff',prior.sourceCommit,'--',...equivalencePaths],{cwd:root,encoding:'utf8'}),'','Application inputs must equal pinned committed R7');
assert.equal(execFileSync('git',['ls-files','--others','--exclude-standard','apps/web/src','apps/web/public','packages','assets'],{cwd:root,encoding:'utf8'}),'','Untracked application inputs require review');
const registryPath=resolve(app,'src/game/cardrpg/spine/designer-idle-registry.json'),registryBefore=await readFile(registryPath);
assert.deepEqual(JSON.parse(registryBefore),{});
assert.equal(sha(registryBefore),prior.productionRegistrySha256);
const leasedIndex=await readFile(resolve(app,'dist/index.html'));
assert.equal(sha(leasedIndex),prior.indexSha256);
const runtimeSources=[];
for(const item of prior.runtimeSources){
 const relative=item.path.slice(root.length+1),current=await readFile(item.path),committed=execFileSync('git',['show',prior.sourceCommit+':'+relative],{cwd:root});
 assert.equal(sha(current),item.sha256);assert.equal(sha(committed),item.sha256);runtimeSources.push(item);
}
const selected=prior.files.filter(f=>f.url.startsWith('/units/mochi/'));
assert.equal(selected.length,3);
const payloads=[];
for(const item of selected){const bytes=await readFile(item.path);assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.bytes);payloads.push([item,bytes]);}
const registryOverride={mochi:prior.registryOverride.mochi};
assert(selected.some(f=>f.url===registryOverride.mochi));
const checkoutHead=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
await mkdir(out);
const require=createRequire(resolve(app,'package.json')),{build}=await import(require.resolve('vite'));let injected=0;
await build({root:app,configFile:resolve(app,'vite.config.ts'),envDir:false,
 plugins:[{name:'explicit-mochi-only-profile',enforce:'pre',load(id){if(id.split('?')[0]===registryPath){injected++;return JSON.stringify(registryOverride);}}}],
 build:{outDir:dist,emptyOutDir:false}});
assert(injected>0);stop();
assert.equal(sha(await readFile(registryPath)),sha(registryBefore));
assert.equal(sha(await readFile(resolve(app,'dist/index.html'))),sha(leasedIndex),'Leased R7 preview changed');
assert.equal(execFileSync('git',['diff',prior.sourceCommit,'--',...equivalencePaths],{cwd:root,encoding:'utf8'}),'');
const files=[];
for(const [item,bytes]of payloads){const path=resolve(dist,item.url.slice(1));await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,bytes);files.push({...item,path});}
const report={utc:new Date().toISOString(),sourceCommit:prior.sourceCommit,checkoutHead,
 sourceKind:'Pinned R7 committed application inputs, verified equivalent checkout; explicit ignored Mochi-only registry override',
 equivalencePaths,priorBuild:{path:priorPath,sha256:sha(priorBytes)},toolSha256:sha(await readFile(import.meta.filename)),
 dist,indexSha256:sha(await readFile(resolve(dist,'index.html'))),registryOverride,runtimeSources,files,
 productionRegistrySha256:sha(registryBefore),productionRegistryChanged:false,leasedPreviewIndexSha256:sha(leasedIndex),
 productionInstalled:false,accepted:false,imagesViewed:0,
 limits:['Diagnostic profile only; native Clover enrollment and all label/art/performance gates require fresh verification.','No source-level Mochi top-alignment proposal adopted.','Existing Mochi manifest/video/poster bytes are unchanged; originals and Soot paths untouched.']};
await writeFile(resolve(out,'build.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
await writeFile(resolve(root,'reports/v5/CXI/evidence',`v8-${label}-build.json`),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceCommit:report.sourceCommit,indexSha256:report.indexSha256,registryOverride,dist,files:files.length}));
