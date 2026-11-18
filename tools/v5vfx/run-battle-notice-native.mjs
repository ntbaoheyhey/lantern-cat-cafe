/** Build the committed notice change unchanged, then repeat native loss/layout/controls checks. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,buildProductionComparison} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {noticeCss} from './battle-notice-layout.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-battle-notice-native-production');assert(!existsSync(out));
const modulePath='apps/web/src/game/cardrpg/depth/Battle.tsx',cssPath='apps/web/src/game/cardrpg/depth/depth.css';
const study=await readFile('/Users/bao/taskbar-hero-mailbox/LEARN/CXV-battle-notice-layout-v7-20261118.md','utf8');
const gate=study.match(/no application adoption before ([^\s]+)\./)[1];assert(Date.now()>=Date.parse(gate),'Complete the minimum study time first');
const experiment=JSON.parse(await readFile(resolve(root,'reports/v5/CXV/V7-F-battle-notice-experiment.json')));
assert(experiment.pass&&experiment.visualPass&&experiment.reviewedUtc);assert.equal(experiment.noticeCssSha256,hash(noticeCss));
const source=await readFile(resolve(root,modulePath),'utf8'),css=await readFile(resolve(root,cssPath),'utf8');
assert(source.includes('<div className="dp-loading dp-scene-error" role="status"><span>{m.sceneError}</span></div>'));
assert(css.includes(noticeCss.trim()));
const validation=JSON.parse(await readFile(resolve(root,'reports/v5/CXV/V7-F-battle-notice-checks.json')));
assert(validation.pass&&validation.tests>0&&validation.typeErrors===0);
for(const [path,bytes] of [[modulePath,source],[cssPath,css]]){assert.equal(hash(execFileSync('git',['show','HEAD:'+path],{cwd:root})),hash(bytes));assert.equal(validation.files[path],hash(bytes));}
await mkdir(out,{recursive:true});const snapshots=[];
for(const name of ['run-battle-notice-native.mjs','build-hud-production.mjs','probe-battle-notice-layout.mjs','measure-battle-notice-layout.mjs','battle-notice-layout.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
const built=await buildProductionComparison(out,{modulePath,currentSource:source,variants:{native:source},metadata:{noticeFiles:validation.files,snapshots}});
assert.equal(built.artifacts[0].transformed,0);assert.equal(built.runtimePatchSha256,hash(''));
const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('CXV_'))delete env[key];
const extra={CXV_NOTICE_NATIVE:'1',CXV_NOTICE_PRODUCTION:out,CXV_NOTICE_OUT:resolve(out,'context')};
for(const script of ['probe-battle-notice-layout.mjs','measure-battle-notice-layout.mjs']){
 const log=await open(resolve(out,script+'.log'),'w');
 try{const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx',script)],{cwd:root,env:{...env,...extra},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});assert.equal(code,0,script+' failed');}finally{await log.close();}
}
const path=resolve(root,'reports/v5/CXV/V7-F-battle-notice-native.json'),bytes=await readFile(path),native=JSON.parse(bytes);assert(native.pass&&native.native);
for(const mode of ['normal','reduced'])for(const name of ['loaded','restored']){
 const before=experiment.captures.find(c=>c.mode===mode&&c.name===name),after=native.captures.find(c=>c.mode===mode&&c.name===name);
 assert.equal(after.rgbSha256,before.rgbSha256,mode+' '+name+' appearance must match the untouched artifact exactly');
}
const proof={utc:new Date().toISOString(),source:built.source,indexSha256:built.artifacts[0].indexSha256,runtimePatchSha256:hash(''),artifactTransforms:0,artifactFiles:built.artifacts[0].files.length,snapshots,
 report:{path,sha256:hash(bytes)},buildManifest:{path:resolve(out,'build.json'),sha256:hash(await readFile(resolve(out,'build.json')))},checks:validation,
 preservedNormalPixels:{modes:2,frames:4,comparisonSource:experiment.source,exactFullRgb:true},pass:true,reviewedUtc:null};
await writeFile(resolve(root,'reports/v5/CXV/V7-F-battle-notice-native-production.json'),JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify({out,pass:true,source:built.source,indexSha256:proof.indexSha256,exactNormalPixels:true}));
