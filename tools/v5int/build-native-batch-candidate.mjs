/** Build committed Batch M source with its real registry into an isolated directory. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web');
const label=process.argv[2];
assert(label&&/^native-atlas-r[1-9][0-9]*$/.test(label),'Supply a distinct native-atlas-rN label');
const out=resolve(root,'work/v5/CXI/batch-m',label),dist=resolve(out,'dist');
assert(!existsSync(out),'Preserve previous candidates');
for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync(`/Users/bao/taskbar-hero-mailbox/${name}`),`STOP: ${name}`);
assert.equal(execFileSync('git',['diff','HEAD','--','apps/web','packages','assets'],{cwd:root,encoding:'utf8'}),'','Commit application source before building');
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sha=data=>createHash('sha256').update(data).digest('hex');
const registryPath=resolve(app,'src/game/cardrpg/spine/designer-idle-registry.json');
const registryBefore=await readFile(registryPath);
assert.deepEqual(JSON.parse(registryBefore),{},'This candidate accepts native cats only');
const servedIndex=await readFile(resolve(app,'dist/index.html'));
const require=createRequire(resolve(app,'package.json'));
const {build}=await import(require.resolve('vite'));
execFileSync(process.execPath,[resolve(root,'tools/v5int/audio-delivery.mjs'),'--check'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[resolve(root,'tools/v5int/native-rig-data-delivery.mjs'),'--check'],{cwd:root,stdio:'inherit'});
await mkdir(out);
await build({root:app,configFile:resolve(app,'vite.config.ts'),envFile:false,build:{outDir:dist,emptyOutDir:false}});
execFileSync(process.execPath,[resolve(root,'tools/chain/economy-v3-metadata.mjs'),`--out=${resolve(dist,'relics')}`],{cwd:root,stdio:'inherit'});
assert.equal(sha(await readFile(registryPath)),sha(registryBefore));
assert.equal(sha(await readFile(resolve(app,'dist/index.html'))),sha(servedIndex),'The leased preview must remain unchanged');
assert.equal(execFileSync('git',['diff','HEAD','--','apps/web','packages','assets'],{cwd:root,encoding:'utf8'}),'');
const report={utc:new Date().toISOString(),sourceCommit,sourceKind:'Committed application source with unchanged empty production designer registry; nine native cats included',
 toolSha256:sha(await readFile(import.meta.filename)),dist,indexSha256:sha(await readFile(resolve(dist,'index.html'))),registryOverride:null,
 productionRegistrySha256:sha(registryBefore),productionRegistryChanged:false,leasedPreviewIndexSha256:sha(servedIndex),productionInstalled:false,accepted:false};
await writeFile(resolve(out,'build.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(resolve(root,`reports/v5/CXI/evidence/v8-${label}-build.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
