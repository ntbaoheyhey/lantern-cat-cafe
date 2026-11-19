/** Real compiled battle with native decoding failure of one pinned media response. */
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {waitForBattleReady} from '../v4ship-lab/rehearsal/battle-ready.mjs';
import {chromium, config, judgeUrl} from './production-fixture.mjs';
export {chromium, config, judgeUrl};
const root = '/Users/bao/taskbar-hero-chain';
const sha = data => createHash('sha256').update(data).digest('hex');
export const corruptMedia = Buffer.from('CXI native media-error fixture: this is not an MP4.\n');
export const roster = ['mochi', 'clover', 'panko', 'mallow'];

export async function openDesignerFaultFixture(browser, {buildPath, mode, fault, cat}) {
  for (const name of ['STOP-ALL', 'STOP-CXI']) assert(!existsSync('/Users/bao/taskbar-hero-mailbox/' + name));
  assert(['normal', 'reduced'].includes(mode));
  assert(['none', 'startup', 'after-ready'].includes(fault));
  assert(fault === 'none' ? cat === null : ['mochi', 'clover'].includes(cat));
  const buildBytes = readFileSync(buildPath), build = JSON.parse(buildBytes);
  assert.equal(sha(Buffer.from(await (await fetch(judgeUrl)).arrayBuffer())), build.indexSha256);
  assert.equal(execFileSync('git', ['diff', build.sourceCommit, '--', 'packages/game-rules/src'], {cwd:root, encoding:'utf8'}), '');
  assert.deepEqual(Object.keys(build.registryOverride).sort(), ['clover', 'mochi']);
  const mediaPath = cat ? build.files.find(x => x.url.startsWith('/units/' + cat + '/') && x.url.endsWith('.mp4')).url : null;
  const page = await browser.newPage({viewport:{width:1280, height:720}, deviceScaleFactor:1});
  const errors = [], blockedRequests = [], faultRequests = [], responses = [];
  let faultEnabled = fault === 'startup';
  page.on('pageerror', e => errors.push({type:'pageerror', message:e.message}));
  page.on('console', m => {if (m.type() === 'error') errors.push({type:'console', message:m.text(), location:m.location()});});
  page.on('response', r => {if (r.status() >= 400) responses.push({url:r.url(), status:r.status()});});
  await page.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/@fs')) {blockedRequests.push(url.pathname);return route.abort();}
    if (req.method() === 'POST') {
      let body;try {body = req.postDataJSON();} catch {blockedRequests.push(url.pathname);return route.abort();}
      const calls = Array.isArray(body) ? body : [body];
      if (url.href !== 'https://api.avax-test.network/ext/bc/C/rpc' || !calls.every(c => /^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(c?.method))) {blockedRequests.push(url.origin + url.pathname);return route.abort();}
    }
    if (faultEnabled && url.origin === 'http://127.0.0.1:6301' && url.pathname === mediaPath) {
      faultRequests.push({utc:new Date().toISOString(), url:req.url(), method:req.method(), range:req.headers().range ?? null, bytes:corruptMedia.length, sha256:sha(corruptMedia)});
      return route.fulfill({status:200, contentType:'video/mp4', body:corruptMedia, headers:{'cache-control':'no-store'}});
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    localStorage.setItem('lantern.coach.v3', JSON.stringify({disabled:true}));
    window.__cxiNativeMediaErrors = [];
    const nativeLoad = HTMLMediaElement.prototype.load, observed = new WeakSet();
    HTMLMediaElement.prototype.load = function (...args) {
      if (!observed.has(this)) {
        observed.add(this);
        // Capture before the application's non-capture listener can settle readiness and dispose.
        this.addEventListener('error', () => window.__cxiNativeMediaErrors.push({at:performance.now(), src:this.currentSrc || this.src, nativeMediaError:this.error instanceof MediaError, code:this.error?.code, message:this.error?.message, readyState:this.readyState, networkState:this.networkState}), {capture:true});
      }
      return Reflect.apply(nativeLoad, this, args);
    };
  });
  await page.goto(judgeUrl + '&dev=1');
  await page.getByRole('button', {name:'Play free', exact:true}).click();
  await page.waitForFunction(() => window.__depthReview);
  const modules = await loadRules();
  let state, battle, action;
  try {
    const R = await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
    state = R.setFormationC2(R.setGameplayA6(R.createDepthAccount(config.seed), true));state.tutorial = 4;
    const template = state.account.cards[0];state.account.cards = roster.map(id => ({...template, id, cardId:id, level:6}));
    state.team = [...roster];state.rows = Object.fromEntries(roster.map((id, i) => [id, i < 2 ? 'front' : 'rear']));
    state.skills = Object.fromEntries(roster.map(id => [id, R.CAT_BY_ID[id].skills.map(s => s.id)]));
    Object.assign(state.settings, {speed:1, quality:'high', reducedMotion:mode === 'reduced'});
    const fixture = config.fixtures.find(x => x.id === 'boss');
    battle = R.createBattle({seed:config.seed, chapter:fixture.chapter, cats:R.battleCats(state), enemies:fixture.enemies, gameplayV4:true, skillsV5:true, gameplayA6:true, formationC2:true});battle.v4.committed = true;
    const choice = R.legalChoices(battle)[0], expected = structuredClone(battle);assert(choice && R.act(expected, choice));
    action = {choice, initial:battle, expected};
  } finally {await modules.vite.close();}
  await page.evaluate(({state, battle, url}) => {
    history.replaceState(null, '', url);const m = window.__depthReview;m.state = state;
    Object.assign(m, {tutorialBattle:battle, galleryBattle:null, replay:null, plan:null, roundPlan:null, watching:true, paused:true, sceneStarted:true, screen:'map'});m.notify(false);
  }, {state, battle, url:judgeUrl});
  await waitForBattleReady(page, 90000);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(({fault, cat, roster}) => {
    const s = window.__depthScene;
    return s?.ready && roster.every(id => s.actors.get(id)?.actor) && ['mochi', 'clover'].every(id => {
      const a = s.actors.get(id).actor;
      return fault === 'startup' && id === cat ? a.source === 'placeholder' : a.source === 'media' && a.designerMedia.media.state.ready;
    });
  }, {fault, cat, roster}, {timeout:15000});
  await page.evaluate(() => cancelAnimationFrame(window.__depthScene.raf));
  assert.equal(page.url(), judgeUrl);
  const triggerFault = async () => {
    assert.equal(fault, 'after-ready');faultEnabled = true;
    await page.evaluate(cat => {
      const a = window.__depthScene.actors.get(cat).actor, media = a.designerMedia.media;
      window.__cxiFaultIdentity = {actor:a, media, video:media.video};
      media.video.load();
    }, cat);
    await page.waitForFunction(cat => !!window.__depthScene.actors.get(cat).actor.designerMedia.media.failure, cat, {timeout:10000});
  };
  return {page, errors, blockedRequests, responses, faultRequests, triggerFault, mediaPath, build, buildSha256:sha(buildBytes), initialBattle:battle, action};
}

export async function inspectDesignerFault(page) {
  return page.evaluate(roster => {
    const s = window.__depthScene, model = window.__depthReview;
    s.render({...s.view(), paused:true, fixedTime:0}, 0);
    return {url:location.href, battle:model.visualBattle, nativeErrors:window.__cxiNativeMediaErrors, sceneReady:s.ready,
      distinctVideos:new Set(roster.map(id => s.actors.get(id).actor.designerMedia?.media.video).filter(Boolean)).size,
      actors:roster.map(id => {
        const e = s.actors.get(id), a = e.actor, d = a.designerMedia, m = d?.media, v = m?.video, anchor = s.anchors.find(x => x.id === id), plate = document.querySelector('.b3-world[data-actor="' + id + '"]');
        const rect = plate?.getBoundingClientRect();
        return {id, source:a.source, rootVisible:a.root.visible, planeVisible:m?.plane.visible ?? null, state:m ? {...m.state} : null,
          nativeErrorCode:v?.error?.code ?? null, posterActive:m ? m.material.map === m.posterTexture : null, videoActive:m ? m.material.map === m.videoTexture : null,
          sameActor:window.__cxiFaultIdentity ? a === window.__cxiFaultIdentity.actor : null, sameMedia:window.__cxiFaultIdentity ? m === window.__cxiFaultIdentity.media : null,
          sameVideo:window.__cxiFaultIdentity ? v === window.__cxiFaultIdentity.video : null, anchor:anchor ?? null,
          label:plate ? {text:plate.textContent, visible:plate.checkVisibility(), rect:{x:rect.x, y:rect.y, width:rect.width, height:rect.height}} : null};
      })};
  }, roster);
}
