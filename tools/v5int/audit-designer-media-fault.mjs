/** Independent raw-artifact and exact-source rules audit of native media failures. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [base, output] = process.argv.slice(2).map(p => resolve(p));
assert(base && output && !existsSync(output));
const root = '/Users/bao/taskbar-hero-chain', hashes = {};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function read(path, expected) {
  const bytes = await readFile(path), hash = sha(bytes);assert(!expected || hash === expected,path);hashes[path] = hash;return bytes;
}
const json = async (path, expected) => JSON.parse(await read(path,expected));
const raw = await json(resolve(base,'report.json')), artifacts = await json(resolve(base,'artifact-verification.json'));
assert(raw.pass && raw.runs.length === 10 && !raw.failure && raw.imagesViewed === 0 && raw.productionAcceptance === false);
assert.equal((await json(resolve(base,'exit.json'))).exit,0);
assert.deepEqual(raw.viewport,[1280,720]);
const pre = await json(raw.preregistration.path,raw.preregistration.sha256), build = await json(raw.build.path,raw.build.sha256);
for (const key of ['sourceCommit','indexSha256','url']) assert(raw[key] === pre[key] && raw[key] === artifacts[key]);
assert.equal(build.sourceCommit,raw.sourceCommit);assert.equal(build.indexSha256,raw.indexSha256);
await read(resolve(build.dist,'index.html'),raw.indexSha256);
for (const item of artifacts.sourceFiles) assert.equal(sha(execFileSync('git',['show',raw.sourceCommit+':'+item.path],{cwd:root})),item.sha256);
for (const item of artifacts.artifacts) assert.equal((await read(resolve(build.dist,item.path),item.sha256)).length,item.bytes);
for (const item of artifacts.mediaFiles) assert.equal((await read(resolve(build.dist,item.url.slice(1)),item.sha256)).length,item.bytes);
const provenance = await json(resolve(base,'harness-provenance.json'));
for (const item of provenance) await read(item.copy,item.sha256);
await read(resolve(base,'probe-designer-media-fault.mjs'),raw.harnessSha256);
await read(resolve(base,'designer-media-fault-fixture.mjs'),raw.fixtureSha256);
const archive = execFileSync('git',['archive',raw.sourceCommit,'packages/game-rules','tsconfig.base.json'],{cwd:root,maxBuffer:32*1024*1024});
const snapshot = await mkdtemp('/tmp/cxi-fault-rules-');let modules;
const rows = [], actions = [], nativeErrors = [], pairs = [];
try {
  execFileSync('tar',['-xf','-','-C',snapshot],{input:archive});process.env.BIG_RULES_ROOT = snapshot;
  const {loadRules} = await import('../cardrpg-big/a4-load.mjs');modules = await loadRules();
  const R = await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
  for (const [i,run] of raw.runs.entries()) {
    const condition = pre.cases[i];for(const key of ['mode','fault','cat']) assert.equal(run[key],condition[key]);
    assert(run.pass && run.after.sceneReady);assert.deepEqual(run.errors,[]);assert.deepEqual(run.responses,[]);assert.deepEqual(run.blockedRequests,[]);
    assert.deepEqual(run.before.battle,run.action.initial);assert.deepEqual(run.after.battle,run.action.initial);
    assert.equal(run.after.distinctVideos,run.fault === 'startup' ? 1 : 2);
    for(const actor of run.after.actors) {
      assert(actor.rootVisible && actor.label.visible && actor.anchor.visible);
      assert([actor.label.rect.x,actor.label.rect.y,actor.label.rect.width,actor.label.rect.height,actor.anchor.x,actor.anchor.y,actor.anchor.labelX,actor.anchor.labelY,actor.anchor.footY,...Object.values(actor.anchor.body),...Object.values(actor.anchor.face)].every(Number.isFinite));
    }
    for(const id of ['mochi','clover']) {
      const actor = run.after.actors.find(a => a.id === id);assert(actor);
      if(id !== run.cat) assert(actor.source === 'media' && actor.state.ready && !actor.state.failure && actor.planeVisible);
      else if(run.fault === 'startup') assert(actor.source === 'placeholder' && actor.state === null);
      else assert(actor.source === 'media' && actor.sameActor && actor.sameMedia && actor.sameVideo && actor.posterActive && !actor.videoActive && actor.planeVisible && actor.state.failure && actor.state.paused && !actor.state.disposed && actor.state.sourceFrame === 0);
    }
    if(run.fault === 'none') {assert.deepEqual(run.after.nativeErrors,[]);assert.deepEqual(run.faultRequests,[]);}
    else {
      const expectedPath = artifacts.mediaFiles.find(x => x.url.startsWith('/units/'+run.cat+'/') && x.url.endsWith('.mp4')).url;
      assert(run.faultRequests.length > 0);
      for(const request of run.faultRequests) {assert.equal(new URL(request.url).pathname,expectedPath);assert.equal(request.bytes,52);assert.equal(request.sha256,'4c673b6b4a94b1cfb99f4e6c0ba74dea60dd6aa2f684dfe50464b8079224e29a');}
      const errors = run.after.nativeErrors.filter(e => e.nativeMediaError && [3,4].includes(e.code) && new URL(e.src).pathname === expectedPath);
      assert(errors.length > 0);nativeErrors.push(...errors.map(e => ({mode:run.mode,fault:run.fault,cat:run.cat,...e})));
    }
    const battle = structuredClone(run.action.initial);assert(R.legalChoices(battle).some(c => JSON.stringify(c) === JSON.stringify(run.action.choice)));
    assert(R.act(battle,run.action.choice));assert.deepEqual(battle,run.action.expected);assert.deepEqual(battle,run.action.actual);
    actions.push({mode:run.mode,fault:run.fault,cat:run.cat,resultSha256:sha(JSON.stringify(battle)),exact:true});
    rows.push({mode:run.mode,fault:run.fault,cat:run.cat,pass:true,mediaErrors:run.after.nativeErrors.length,faultRequests:run.faultRequests.length});
  }
  for(let i=0;i<5;i++) {const a=actions[i],b=actions[i+5];assert.equal(a.fault,b.fault);assert.equal(a.cat,b.cat);assert.equal(a.resultSha256,b.resultSha256);pairs.push({fault:a.fault,cat:a.cat,normalReducedExact:true});}
} finally {if(modules) await modules.vite.close();await rm(snapshot,{recursive:true,force:true});}
const report = {utc:new Date().toISOString(),sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,captureUTC:raw.utc,finishedUTC:raw.finishedUTC,
  sourceAndArtifactItems:artifacts.sourceFiles.length+artifacts.artifacts.length+artifacts.mediaFiles.length,runs:rows,actions,pairs,nativeErrors,hashes,
  toolSha256:sha(await readFile(import.meta.filename)),imagesViewed:0,productionAcceptance:false,
  disposition:'Scoped native fault fixture acceptance: 10 cases,8 genuine MediaErrors,10 exact legal actions. No art/fullpaint/performance acceptance.',
  limits:['R1 observer failure preserved separately.','Seeded paused diagnostic battle;initial actor fallback and after-ready poster path only.','Corrupt response and late video.load are deliberate fixture actions;all application bundles and original media files unchanged.']};
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({runs:rows.length,nativeErrors:nativeErrors.length,actions:actions.length,pairs:pairs.length,hashes:Object.keys(hashes).length,sourceAndArtifactItems:report.sourceAndArtifactItems}));
