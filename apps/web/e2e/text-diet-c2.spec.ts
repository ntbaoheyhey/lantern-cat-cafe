import {expect,test} from '@playwright/test';
import {runBudget} from '../../../tools/cardrpg-c2/word-budget.mjs';

test('C2 player screens and route decisions stay within 25 visible words',async({page})=>{
 test.setTimeout(180_000);
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const rows=await runBudget(page);
 for(const row of rows)expect.soft(row.count,`${row.screen}: ${row.words.join(' ')}`).toBeLessThanOrEqual(25);
 expect(errors).toEqual([]);
});

test('C2 explanations keep keyboard access and return focus',async({page})=>{
 await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>!!window.__depthReview);
 await page.evaluate(()=>{const m=window.__depthReview!;m.state.tutorial=4;m.state.v4!.journey!.pending=[];m.go('team');});
 const trigger=page.getByRole('button',{name:'How to play',exact:true});
 await trigger.focus();await page.keyboard.press('Enter');
 const help=page.getByRole('dialog',{name:'How to play',exact:true});
 await expect(help).toBeVisible();
 for(let i=0;i<5;i++)await page.keyboard.press('Tab');
 expect(await help.evaluate(el=>el.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');
 await expect(help).toHaveCount(0);await expect(trigger).toBeFocused();
 await expect(page.getByRole('dialog',{name:'Team',exact:true})).toBeVisible();
});

test('C2 battle controls have separate pointer targets at every supported viewport',async({page})=>{
 for(const viewport of [{width:1280,height:720},{width:1440,height:900},{width:1024,height:600}]){
  await page.setViewportSize(viewport);
  await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.waitForFunction(()=>!!window.__depthReview);
  await page.evaluate(()=>{
   const m=window.__depthReview!;m.state.tutorial=4;m.state.v4!.journey!.pending=[];m.state.run=null;
   m.start(1,'campaign',1);m.enter(m.state.run!.nodes[0]!.id);
   const r=m.state.run!,n=r.nodes.find(n=>n.id===r.current)!;
   const key=`${r.chapter}/${r.challengeLevel??0}/${n.id}/${n.kind}`;
   m.state.v4!.journey!.stars[key]={key,chapter:r.chapter,band:r.challengeLevel??0,nodeId:n.id,kind:n.kind,conditions:[true,true,true]};
   m.fight();m.paused=true;m.autoContinue=false;m.notify(false);
  });
  await page.waitForFunction(()=>window.__depthReview!.sceneReady);
  await page.getByRole('button',{name:'More battle options'}).click();
  const auto=page.getByRole('checkbox',{name:'Auto-next'});
  const box=await auto.boundingBox(),parent=await auto.locator('..').boundingBox();
  expect(box).not.toBeNull();expect(parent).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(parent!.x);expect(box!.y).toBeGreaterThanOrEqual(parent!.y);
  expect(box!.x+box!.width).toBeLessThanOrEqual(parent!.x+parent!.width);
  expect(box!.y+box!.height).toBeLessThanOrEqual(parent!.y+parent!.height);
  await auto.check();await expect(auto).toBeChecked();
  await auto.focus();await page.keyboard.press('Space');expect(await page.evaluate(()=>window.__depthReview!.autoContinue)).toBe(false);
  await page.getByRole('button',{name:'More battle options'}).click();
  const speed=await page.evaluate(()=>window.__depthReview!.state.settings.speed);
  await page.getByRole('button',{name:'Change playback speed'}).click();
  expect(await page.evaluate(()=>window.__depthReview!.state.settings.speed)).not.toBe(speed);
  expect(await page.evaluate(()=>window.__depthReview!.autoContinue)).toBe(false);
  await page.getByRole('button',{name:'More battle options'}).click();
  await expect(page.getByRole('button',{name:'Read battle log'})).toBeVisible();
  await page.getByRole('button',{name:'More battle options'}).click();
  await page.getByRole('button',{name:'Skip to result'}).click();
  await expect(page.locator('.uv-result')).toBeVisible();
 }
});
