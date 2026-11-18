/** Bounded native fault fixture validation; no art or performance acceptance. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {openDesignerFaultFixture, inspectDesignerFault, chromium, judgeUrl} from './designer-media-fault-fixture.mjs';
const root = '/Users/bao/taskbar-hero-chain';
const buildPath = resolve(process.env.CXI_BUILD_DESCRIPTOR), out = resolve(process.env.CXI_FAULT_OUT);
const protocolPath = resolve(root, 'reports/v5/CXI/evidence/v8-dual-media-fault-r1-preregistration.json');
const protocolBytes = await readFile(protocolPath), protocol = JSON.parse(protocolBytes);
const sha = b => createHash('sha256').update(b).digest('hex');
assert(!existsSync(resolve(out, 'report.json')), 'Preserve earlier attempts');await mkdir(out, {recursive:true});
const report = {utc:new Date().toISOString(), url:judgeUrl, viewport:[1280,720], build:{path:buildPath, sha256:sha(await readFile(buildPath))},
  sourceCommit:protocol.sourceCommit, indexSha256:protocol.indexSha256, preregistration:{path:protocolPath, sha256:sha(protocolBytes)},
  harnessSha256:sha(await readFile(import.meta.filename)), fixtureSha256:sha(await readFile(resolve(root, 'tools/v5int/designer-media-fault-fixture.mjs'))), runs:[], pass:false, imagesViewed:0, productionAcceptance:false};
const save = () => writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
let browser;
try {
  browser = await chromium.launch({headless:true});report.browser = browser.version();
  for (const condition of protocol.cases) {
    for (const name of ['STOP-ALL','STOP-CXI']) assert(!existsSync('/Users/bao/taskbar-hero-mailbox/' + name));
    assert(Date.now() < Date.parse(process.env.CXI_CAPTURE_LEASE_UNTIL), 'Lease expired');
    const run = {...condition, utc:new Date().toISOString(), pass:false};report.runs.push(run);await save();
    const fixture = await openDesignerFaultFixture(browser, {buildPath, ...condition});
    try {
      run.before = await inspectDesignerFault(fixture.page);
      if (condition.fault === 'after-ready') await fixture.triggerFault();
      run.after = await inspectDesignerFault(fixture.page);
      run.errors = fixture.errors;run.blockedRequests = fixture.blockedRequests;run.responses = fixture.responses;run.faultRequests = fixture.faultRequests;
      assert.deepEqual(run.before.battle, fixture.initialBattle);assert.deepEqual(run.after.battle, fixture.initialBattle);
      assert.equal(run.after.distinctVideos, condition.fault === 'startup' ? 1 : 2);
      assert(run.after.sceneReady && run.after.actors.every(a => a.rootVisible && a.label?.visible && [a.label.rect.x,a.label.rect.y,a.label.rect.width,a.label.rect.height].every(Number.isFinite)));
      assert(run.after.actors.every(a => a.anchor?.visible && [a.anchor.x,a.anchor.y,a.anchor.labelX,a.anchor.labelY,a.anchor.footY,...Object.values(a.anchor.body),...Object.values(a.anchor.face)].every(Number.isFinite)));
      for (const id of ['mochi','clover']) {
        const a = run.after.actors.find(a => a.id === id), broken = id === condition.cat;
        if (!broken) assert(a.source === 'media' && a.state.ready && !a.state.failure && a.planeVisible);
        else if (condition.fault === 'startup') assert(a.source === 'placeholder' && a.state === null);
        else assert(a.source === 'media' && a.sameActor && a.sameMedia && a.sameVideo && a.posterActive && !a.videoActive && a.planeVisible && a.state.failure && a.state.paused && !a.state.disposed && a.state.sourceFrame === 0);
      }
      if (condition.fault === 'none') {assert.equal(run.faultRequests.length,0);assert.deepEqual(run.after.nativeErrors,[]);}
      else {
        assert(run.faultRequests.length > 0);
        assert(run.after.nativeErrors.some(e => e.nativeMediaError && new URL(e.src).pathname === fixture.mediaPath && [3,4].includes(e.code)));
      }
      run.expectedErrors = run.errors.filter(e => e.type === 'console' && fixture.mediaPath && new URL(e.location?.url || judgeUrl).pathname === fixture.mediaPath);
      run.unexpectedErrors = run.errors.filter(e => !run.expectedErrors.includes(e));
      assert.deepEqual(run.unexpectedErrors,[]);assert.deepEqual(run.blockedRequests,[]);assert.deepEqual(run.responses,[]);
      const actual = await fixture.page.evaluate(choice => {
        const m = window.__depthReview;m.paused = false;if (!m.canAct) throw Error('Fault fixture cannot act');
        m.act(choice);m.paused = true;m.notify(false);return m.battle;
      }, fixture.action.choice);
      assert.deepEqual(actual, fixture.action.expected);run.action = {...fixture.action, actual, exact:true};
      run.pass = true;
    } finally {await fixture.page.close();await save();}
  }
  assert.equal(report.runs.length,10);report.pass = true;
} catch (error) {report.failure = error.stack;process.exitCode = 1;}
finally {if(browser) await browser.close();report.finishedUTC = new Date().toISOString();await save();console.log(JSON.stringify({out, pass:report.pass, runs:report.runs.length, failure:report.failure}));}
