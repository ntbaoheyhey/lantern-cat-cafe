// Production-minified offline app, real rules, deliberately crowded local fixture.
// Run after squad-demo.mjs. No backend, storage, account or production review hook.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, chromium } from './squad-support.mjs';
const browser = await chromium.launch(), rows = [];
const out = resolve(root, 'reports/squad'); mkdirSync(resolve(out, 'fresh-eyes'), { recursive: true });
const quantile = (a, q) => { const s = [...a].sort((x,y)=>x-y); return +(s[Math.floor((s.length-1)*q)] ?? 0).toFixed(3); };
try {
  for (const calm of [false, true]) {
    const page = await browser.newPage({ viewport: { width:1280, height:720 }, reducedMotion:calm?'reduce':'no-preference' });
    const errors=[], requests=[]; page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))requests.push(r.url());});
    await page.goto(pathToFileURL(resolve(root,'docs/squad/index.html')).href+'?squadDebug=1#play');
    await page.waitForFunction(()=>window.__squadReview?.scene.loaded && window.__squadHarness);
    await page.getByRole('button',{name:'Yarn Giant',exact:true}).click();
    await page.evaluate(()=>{
      const h=window.__squadHarness,r=window.__squadReview,b=h.createBattle({encounter:'boss',seed:11});
      const group=h.createBattle({encounter:'group',seed:11});
      // Boss and seven adds share the eight-enemy cap; two are ordinary boss flankers.
      for(const [i,actor] of [...group.actors.slice(3,9),group.actors[10]].entries()){
        Object.assign(actor,h.SQUAD_CONFIG.formation.bossAdds[i+1]);b.actors.push(actor);
        b.totals[actor.id]={damage:0,healing:0,shielding:0,kills:0};
      }
      b.phase=2;b.nextAddAt=Infinity;b.nextThreadAt=Infinity;
      for(const a of b.actors){a.hp=a.maxHp*=25;a.auto=false;a.nextBasic=Infinity;for(const skill of Object.keys(h.ABILITIES))a.cooldowns[skill]=Infinity;}
      h.emit(b,{type:'wave_transition',wave:0,actors:b.actors});h.emit(b,{type:'boss_phase',phase:2});
      r.controller.battle=b;r.scene.reset(b.events);r.controller.running=true;r.controller.notify();
      window.__stress={round:0,maxEffects:0,maxLabels:0,maxCasts:0,maxActors:0,castSkills:new Set(),brightCap:h.SQUAD_CONFIG.presentation.maxBright};
      const castRound=()=>{
        const start=b.events.length,n=window.__stress.round++;
        const kits={guardian:['hearthwall','rally','shieldBash'],witch:['lanternstorm','threadSnare','emberOrb'],alchemist:['nineLives','mossFlask','milkFlask']};
        const heavy=['yarn','charger','elite'][n%3];
        for(const a of [...b.actors].sort((x,y)=>Number(y.role===heavy)-Number(x.role===heavy))){
          a.charge=h.SQUAD_CONFIG.ultimate.max;a.hp=Math.min(a.hp,a.maxHp*.7);
          const skill=kits[a.role]?.[n%3]??(a.role==='yarn'?'crossSweep':a.role+'Attack');
          a.cooldowns[skill]=0;
          if(h.beginCast(b,a,skill))window.__stress.castSkills.add(skill);
          a.cooldowns[skill]=Infinity;a.nextBasic=Infinity;
        }
        r.scene.consume(b.events.slice(start));r.scene.invalidate();
      };
      castRound();window.__stress.interval=setInterval(castRound,2600);
      window.__stress.sample=setInterval(()=>{
        const s=window.__stress;s.maxEffects=Math.max(s.maxEffects,r.scene.effects.length);
        s.maxLabels=Math.max(s.maxLabels,r.scene.labels.length);s.maxCasts=Math.max(s.maxCasts,Object.keys(r.scene.model.casts).length);
        s.maxActors=Math.max(s.maxActors,[...r.scene.rigs].filter(([id])=>r.scene.model.actors[id]?.hp>0).length);
      },25);
    });
    await page.waitForTimeout(1000);
    const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
    const metric=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    const start=await metric();
    const frames=await page.evaluate(async()=>{
      const deltas=[],longTasks=[];let last=performance.now(),request;
      const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));
      observer.observe({type:'longtask',buffered:false});
      const tick=now=>{deltas.push(now-last);last=now;request=requestAnimationFrame(tick);};request=requestAnimationFrame(tick);
      await new Promise(resolve=>setTimeout(resolve,20000));cancelAnimationFrame(request);observer.disconnect();return {deltas:deltas.slice(1),longTasks};
    });
    const end=await metric();
    const counts=await page.evaluate(()=>{const s=window.__stress;clearInterval(s.interval);clearInterval(s.sample);return {maxEffects:s.maxEffects,maxLabels:s.maxLabels,maxCasts:s.maxCasts,maxActors:s.maxActors,skills:[...s.castSkills],brightCap:s.brightCap};});
    // Explicit visibility lifecycle; synthetic hidden state is disclosed in the report.
    const hiddenBefore=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return window.__squadReview.controller.battle.time;});
    await page.waitForTimeout(600);
    const hiddenAfter=await page.evaluate(()=>window.__squadReview.controller.battle.time);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
    await page.waitForTimeout(300);
    const resumed=await page.evaluate(()=>window.__squadReview.controller.battle.time);
    await page.evaluate(()=>{const r=window.__squadReview;r.controller.running=false;r.controller.notify();});
    await page.locator('canvas').screenshot({path:resolve(out,`fresh-eyes/stress-${calm?'calm':'full'}.png`)});
    const row={mode:calm?'maximum-calm':'maximum-full',frameP50Ms:quantile(frames.deltas,.5),frameP95Ms:quantile(frames.deltas,.95),frameP99Ms:quantile(frames.deltas,.99),longTasks:frames.longTasks,
      rendererTaskPercent:+((end.TaskDuration-start.TaskDuration)/(end.Timestamp-start.Timestamp)*100).toFixed(3),heapStartBytes:start.JSHeapUsedSize,heapEndBytes:end.JSHeapUsedSize,
      ...counts,hiddenAdvanceMs:hiddenAfter-hiddenBefore,resumedAdvanceMs:resumed-hiddenAfter,errors,requests};
    rows.push(row);console.log(JSON.stringify(row));
    assert.equal(counts.maxActors,11);assert(counts.maxEffects<=32);assert(counts.maxLabels<=12);assert(counts.skills.length>=16);
    assert.equal(row.hiddenAdvanceMs,0);assert(row.resumedAdvanceMs>=200&&row.resumedAdvanceMs<=400);
    assert(row.frameP95Ms<=25);assert(row.heapEndBytes<=134217728);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);await page.close();
  }
} finally { await browser.close(); }
writeFileSync(resolve(out,'stress.json'),JSON.stringify({date:'2026-11-05',method:'Same production-minified SquadApp/Phaser/core in the self-contained offline review build, opt-in fixture hook. 1280×720, 20s measured after 1s warmup. Three heroes plus Yarn and seven adds (eight-enemy cap), 25×HP fixture, all nine hero skills cycled through real beginCast/advance. Forced overlap measures presentation load, not natural balance. RAF is cadence, CDP task is renderer busy time; synthetic visibilitychange verifies pause/resume, not OS background scheduling.',rows},null,2)+'\n');
