# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: battle-hud.spec.ts >> battle plates and HUD stay separate on 1280
- Location: ../../tools/ui-v3/specs/battle-hud.spec.ts:6:99

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - img "Original 3D cafe battlefield" [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Binding Thread
        - generic [ref=e10]: 383/383
      - progressbar "Binding Thread health" [ref=e11]
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Binding Thread
        - generic [ref=e15]: 383/383
      - progressbar "Binding Thread health" [ref=e16]
  - generic "Battle controls":
    - banner:
      - generic:
        - generic: Tangled Cafe
        - generic: Wave 1/1 · Round 1
      - generic "Yarn Giant boss health":
        - generic: Yarn Giant
        - progressbar
        - generic: 2870/2870 · Phase 1
      - generic [ref=e17]:
        - button "Change playback speed" [ref=e18] [cursor=pointer]: ×1
        - button "Resume auto" [ref=e19] [cursor=pointer]
        - button "Skip to result" [ref=e20] [cursor=pointer]
        - button "Read battle guide" [ref=e21] [cursor=pointer]: "?"
        - button "More battle options" [ref=e22] [cursor=pointer]: ⋯
    - generic "Crew health and ultimates":
      - article [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: Clover
          - generic [ref=e26]: 350/350 HP
          - progressbar "Clover health" [ref=e27]
          - 'progressbar "Clover ultimate: 2 turns" [ref=e28]'
          - generic [ref=e29]: Ultimate · 2 turns
      - article [ref=e30]:
        - generic [ref=e31]:
          - generic [ref=e32]: Sorrel
          - generic [ref=e33]: 350/350 HP
          - progressbar "Sorrel health" [ref=e34]
          - 'progressbar "Sorrel ultimate: 2 turns" [ref=e35]'
          - generic [ref=e36]: Ultimate · 2 turns
      - article [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]: Panko
          - generic [ref=e40]: 555/555 HP
          - progressbar "Panko health" [ref=e41]
          - 'progressbar "Panko ultimate: 2 turns" [ref=e42]'
          - generic [ref=e43]: Ultimate · 2 turns
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {readFileSync,mkdirSync,unlinkSync} from 'node:fs';
  3  | import {resolve} from 'node:path';
  4  | import {execFileSync} from 'node:child_process';
  5  | const fixtures=JSON.parse(readFileSync(resolve(__dirname,'../../../packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json'),'utf8')).fixtures;
  6  | for(const look of ['on','off'])for(const [width,height] of [[1024,600],[1280,720],[1440,900]])test(`battle plates and HUD stay separate ${look} ${width}`,async({page})=>{
  7  |  test.setTimeout(120000);await page.setViewportSize({width:width!,height:height!});await page.goto(`?ui=v3&look=${look}`);await page.locator('.uv-shell').waitFor();
  8  |  for(const id of ['rupture','boss']){
  9  |   await page.evaluate(async initial=>{
  10 |    // Production rules and registered TRAIN fixtures; no synthetic enemy geometry.
  11 |    const R=await import('/packages/game-rules/src/cardrpg/depth/index.ts');
  12 |    const m=window.__depthReview!;m.plan=null;m.replay=R.createBattle(initial);m.watching=true;m.sceneStarted=true;m.paused=true;m.notify(false);
  13 |   },fixtures.find((f:{id:string})=>f.id===id).initial);
  14 |   await page.waitForFunction(()=>window.__depthReview!.sceneReady,{},{timeout:45000});
  15 |   for(const beat of ['ready','cast']){
  16 |    if(beat==='cast')await page.evaluate(()=>{
  17 |     const m=window.__depthReview!;m.paused=false;
  18 |     for(let i=0;i<120&&!m.battle!.result;i++){
  19 |      m.step();if(m.plan?.ultimate){m.animationAt=200;m.paused=true;m.notify(false);return}
  20 |      while(m.plan)m.finishMoment();
  21 |     }throw new Error('Fixture did not reach a natural ultimate');
  22 |    });
  23 |    await page.waitForTimeout(250);
  24 |    const geometry=await page.evaluate(()=>{
  25 |     const rects=(s:string)=>Array.from(document.querySelectorAll<HTMLElement>(s)).filter(e=>e.getClientRects().length&&!e.hidden&&getComputedStyle(e).visibility!=='hidden').map(e=>({name:e.dataset.actor??e.className,...Object.fromEntries(['x','y','width','height'].map(k=>[k,e.getBoundingClientRect()[k as 'x']]))})) as {name:string;x:number;y:number;width:number;height:number}[];
  26 |     const plates=rects('.dp-world-plate'),hud=rects('.uv-battle-top,.uv-battle-cat'),fallback=rects('.dp-v5-status-strip');
  27 |     const overlap=(a:typeof plates[number],b:typeof plates[number])=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  28 |     return {plates,hud,fallback,collisions:plates.flatMap((a,i)=>[...plates.slice(i+1),...hud,...fallback].filter(b=>overlap(a,b)>0).map(b=>[a.name,b.name])),overflow:document.documentElement.scrollWidth>innerWidth};
  29 |    });
> 30 |    if(beat==='ready')expect(geometry.plates.length).toBeGreaterThan(0);expect(geometry.collisions).toEqual([]);expect(geometry.overflow).toBe(false);
     |                                                     ^ Error: expect(received).toBeGreaterThan(expected)
  31 |    await expect(page.locator('.dp-party')).toBeHidden();await expect(page.locator('.uv-hud')).toHaveCount(0);
  32 |    if(beat==='cast')await expect(page.getByRole('complementary',{name:'Ultimate cast'})).toBeVisible();
  33 |    const out=resolve(__dirname,'../../../reports/ui-v3/u5');mkdirSync(out,{recursive:true});
  34 |    const png=`/tmp/ui-v3-battle-${look}-${width}-${id}-${beat}.png`;await page.screenshot({path:png});
  35 |    execFileSync('/tmp/ui-v3-python/bin/python',['-c','from PIL import Image;import sys;Image.open(sys.argv[1]).save(sys.argv[2],quality=76)',png,`${out}/${look}-${width}-${id}-${beat}.webp`]);unlinkSync(png);
  36 |   }
  37 |  }
  38 | });
  39 | 
  40 | test('battle ignores unknown events and supports guide, speed and banners',async({page})=>{
  41 |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('?ui=v3');await page.getByRole('button',{name:'Night Patrol'}).click();await page.getByRole('button',{name:'Fight',exact:true}).click();
  42 |  await page.getByRole('button',{name:'Pause auto'}).click();
  43 |  await page.evaluate(()=>{const m=window.__depthReview!;m.battle!.v4!.events.push({version:99,kind:'future-event'} as never);m.notify(false)});
  44 |  await page.getByRole('button',{name:'Change playback speed'}).click();expect(await page.evaluate(()=>window.__depthReview!.state.settings.speed)).toBe(2);
  45 |  await page.getByRole('button',{name:'Read battle guide'}).click();await expect(page.getByRole('dialog',{name:'Battle guide'})).toBeVisible();await page.keyboard.press('Escape');
  46 |  await page.getByRole('button',{name:'More battle options'}).click();await page.getByRole('button',{name:'Turn banners off'}).click();
  47 |  expect(await page.evaluate(()=>localStorage.getItem('lantern-ui-v3-banners'))).toBe('off');expect(errors).toEqual([]);
  48 | });
  49 | 
```