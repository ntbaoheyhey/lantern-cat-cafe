import type { SpineScene } from '../src/game/cardrpg/spine/scene';
import { expect, test } from '@playwright/test';

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
    for(const cat of cats)expect(cat.box.height/audit.height).toBeGreaterThanOrEqual(.2999);
    for(let i=0;i<audit.units.length;i++)for(let j=i+1;j<audit.units.length;j++){
      const a=audit.units[i]!.box,b=audit.units[j]!.box;
      const overlap=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
      expect(overlap/Math.min(a.width*a.height,b.width*b.height)).toBeLessThanOrEqual(.15);
    }
  });
}
