node --input-type=module <<'JS' > /Users/bao/taskbar-hero/.codex-orchestrator/verification/T007/logs/artifact-before.log 2>&1
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const root='/tmp/tbh-t014-current-main', web=join(root,'apps/web'), out='/Users/bao/taskbar-hero/.codex-orchestrator/verification/T007/artifact-before.json';
const site='https://taskbarhero-eight.vercel.app', expected='9c457a3e56b7c5813fa40e6aa20b0c14242ef26a';
const sha=x=>createHash('sha256').update(x).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const entries=html=>[...new Set([...html.matchAll(/<(?:script|link)\b[^>]*>/gi)].map(m=>m[0].match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i)?.[1]).filter(Boolean).map(p=>new URL(p,site)).filter(u=>u.origin===site&&/\.(?:js|css)$/.test(u.pathname)).map(u=>u.pathname))].sort();
async function get(path){const r=await fetch(new URL(path,site),{cache:'no-store',signal:AbortSignal.timeout(20000)});assert.equal(new URL(r.url).origin,site);return {status:r.status,bytes:Buffer.from(await r.arrayBuffer()),etag:r.headers.get('etag')};}
const startedAt=new Date().toISOString();
assert.equal(git('rev-parse','HEAD'),expected);assert.equal(git('status','--porcelain'),'');
for(const name of ['.env','.env.local','.env.production','.env.production.local']) {let found=false;try{await access(join(web,name));found=true;}catch{}assert.equal(found,false,'Unexpected local environment file');}
const start=await get('/');assert.equal(start.status,200);const startEntries=entries(start.bytes.toString());
let anon;let projectObserved=false;const project='https://qoalewtxflagoprrxrgh.supabase.co';
for(const path of startEntries.filter(p=>p.endsWith('.js'))){const r=await get(path);assert.equal(r.status,200);const s=r.bytes.toString();projectObserved ||= s.includes(project);
for(const m of s.matchAll(/eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g)){try{const p=JSON.parse(Buffer.from(m[0].split('.')[1],'base64url'));if(p.role==='anon'&&p.ref==='qoalewtxflagoprrxrgh')anon=m[0];}catch{}}}
assert.ok(projectObserved&&anon,'Expected public config not observed');
for(const key of Object.keys(process.env))if(key.startsWith('VITE_'))delete process.env[key];
Object.assign(process.env,{NODE_ENV:'production',VITE_GAME_V2:'1',VITE_ALLOW_MOCK_AUTH:'0',VITE_SUPABASE_URL:project,VITE_SUPABASE_ANON_KEY:anon});
const {build}=await import(pathToFileURL(join(web,'node_modules/vite/dist/node/index.js')).href);
const result=await build({root:web,configFile:join(web,'vite.config.ts'),mode:'production',build:{write:false}});
const files=new Map();
for(const bundle of Array.isArray(result)?result:[result])for(const asset of bundle.output){files.set('/'+asset.fileName,Buffer.from(asset.type==='chunk'?asset.code:asset.source));}
async function publicFiles(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name),name=prefix+'/'+e.name;if(e.isDirectory())await publicFiles(path,name);else if(e.isFile()){assert.ok(!files.has(name),'Public/emitted collision');files.set(name,await readFile(path));}}}
await publicFiles(join(web,'public'));
const localEntries=entries(files.get('/index.html').toString()),assets=[];
for(const [path,local] of [...files].sort(([a],[b])=>a.localeCompare(b))){const live=await get(path);assets.push({path,status:live.status,localBytes:local.length,liveBytes:live.bytes.length,localSha256:sha(local),liveSha256:sha(live.bytes)});}
const end=await get('/'),endEntries=entries(end.bytes.toString());
const stable=sha(start.bytes)===sha(end.bytes)&&JSON.stringify(startEntries)===JSON.stringify(endEntries);
const match=stable&&end.status===200&&JSON.stringify(localEntries)===JSON.stringify(startEntries)&&assets.every(a=>a.status===200&&a.localBytes===a.liveBytes&&a.localSha256===a.liveSha256)&&sha(files.get('/index.html'))===sha(start.bytes);
assert.equal(git('status','--porcelain'),'');
const report={status:match?'ARTIFACT_MATCH':'FAIL',expectedHead:expected,testedTree:git('rev-parse','HEAD^{tree}'),site,startedAt,endedAt:new Date().toISOString(),method:'Fresh Vite production build write:false; every emitted file and every public file compared byte-for-byte in memory, including index.html; no built production bytes persisted.',publicConfigObserved:true,keysPrintedOrStored:false,localMode:'1; existing live v2 mode; provider settings unchanged',localEntries,liveEntries:startEntries,endEntries,entryManifestStable:stable,htmlStartSha256:sha(start.bytes),htmlEndSha256:sha(end.bytes),assets,providerMetadata:'See deployment-status.json; artifact equivalence does not identify a unique source commit if multiple commits build identical frontend bytes.'};
await writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,head:expected,assets:assets.length,matches:assets.filter(a=>a.status===200&&a.localSha256===a.liveSha256).length,entryManifestStable:stable}));
process.exitCode=match?0:1;
JS
task_rc=$?; echo "$task_rc" > /Users/bao/taskbar-hero/.codex-orchestrator/verification/T007/logs/artifact-before.exit; echo exit=$task_rc
