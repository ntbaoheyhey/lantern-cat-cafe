import type { SpineScene } from '../src/game/cardrpg/spine/scene';
import { expect } from '@playwright/test';
import { test } from './support/depth-fixture';
import targets from '../../../scripts/v3a2/targets.json';

test('C2 recovers a fallen frontline through the two visible placement taps', async ({page}) => {
  await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.waitForFunction(()=>!!window.__depthReview);
  const before=await page.evaluate(()=>{
    const m=window.__depthReview!;m.state.tutorial=4;m.state.freeInvite=true;
    m.start(1,'campaign',1);
    const front=m.state.team.filter(id=>m.state.rows[id]==='front');
    const back=m.state.team.find(id=>m.state.rows[id]==='rear')!;
    for(const id of front)m.state.run!.hp[id]=0;
    m.enter('0-0');
    return {front:front[0]!,back,hp:m.battle!.initial.hp,enemyStats:m.battle!.initial.enemyStats,seed:m.battle!.seed};
  });
  await page.locator(`.c2-seat[data-seat="${before.back}"]`).click();
  await page.locator(`.c2-seat[data-seat="${before.front}"]`).click();
  const after=await page.evaluate(()=>{const b=window.__depthReview!.battle!;return {hp:b.initial.hp,enemyStats:b.initial.enemyStats,seed:b.seed};});
  expect(after).toEqual({hp:before.hp,enemyStats:before.enemyStats,seed:before.seed});
  await page.getByRole('button',{name:/^Fight/}).click();
  await page.waitForFunction(()=>window.__depthReview!.showBattle);
  expect(await page.evaluate(()=>window.__depthReview!.error)).toBe(false);
});

for (const viewport of [{width:1280,height:720},{width:1440,height:900},{width:1024,height:600}]) {
  test(`C2 four slots, tap swap and battle bounds at ${viewport.width}×${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
    await page.waitForFunction(()=>!!window.__depthReview);
    await page.evaluate(()=>{const m=window.__depthReview!;m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.tutorial();m.notice='';m.notify(false);});
    const seats=page.locator('.c2-seat');await expect(seats).toHaveCount(4);
    const ids=await seats.evaluateAll(buttons=>buttons.map(b=>b.getAttribute('data-seat')!));
    const original=await page.evaluate(()=>({rows:{...window.__depthReview!.state.rows},seed:window.__depthReview!.battle!.seed}));
    await page.locator(`[data-seat="${ids[0]}"]`).click();await page.locator(`[data-seat="${ids[2]}"]`).click();
    expect(await page.evaluate(id=>window.__depthReview!.state.rows[id],ids[0]!)).toBe(original.rows[ids[2]!]!);
    expect(await page.evaluate(()=>window.__depthReview!.battle!.seed)).toBe(original.seed);
    await page.getByRole('button',{name:/^Fight/}).click();
    await page.evaluate(()=>{const m=window.__depthReview!;m.paused=true;m.notify(false);});
    await page.waitForFunction(()=>window.__depthReview!.sceneReady);
    const audit=await page.evaluate(()=>(window.__depthScene as SpineScene).sizeAudit());
    const cats=audit.units.filter(u=>u.side==='party');expect(cats).toHaveLength(4);
    for(const cat of cats){
      expect(cat.coreBox.height/viewport.height).toBeGreaterThanOrEqual(targets.scaleBand[0]!);
      expect(cat.coreBox.height/viewport.height).toBeLessThanOrEqual(targets.scaleBand[1]!);
    }
    for(let i=0;i<audit.units.length;i++)for(let j=i+1;j<audit.units.length;j++){
      const a=audit.units[i]!.box,b=audit.units[j]!.box;
      const overlap=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
      // Actual face alpha occlusion across the six desktop fixtures is measured
      // independently by scripts/v3a2/field-audit.mjs.
      expect(overlap/Math.min(a.width*a.height,b.width*b.height)).toBeLessThanOrEqual(.4);
    }
  });
}
