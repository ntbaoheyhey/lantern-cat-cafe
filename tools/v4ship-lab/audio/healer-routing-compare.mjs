/** Compare current and candidate healer routing in memory, before product edits. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/healer-routing-comparison-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});let result;
try{
 const page=await browser.newPage();
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/__healer-comparison')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Audio routing comparison</title>'});return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();});
 await page.goto('http://127.0.0.1:5995/__healer-comparison');
 result=await page.evaluate(async root=>{
  const [{CATS,ENEMIES},{audioTimeline},{configureSequence},{pilotFixture},{resolveDesign},manifest]=await Promise.all([
   import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/catalog.ts'),
   import('/src/game/cardrpg/battle-v3/audio-timeline.ts'),
   import('/src/game/cardrpg/battle-v3/sequence.ts'),
   import('/src/game/cardrpg/vfx-layered/fixture.ts'),import('/src/audio/cues.ts'),fetch('/audio/manifest.json').then(r=>r.json())
  ]);
  const rows=[];
  if(resolveDesign('ult.clover.charge',manifest,'garden')!==manifest.designs['kit.garden.charge'])throw Error('Actual element resolver required');
  const hasImpactSamples=entry=>{
   const design=resolveDesign(entry.cue,manifest,entry.element);
   return (design?.layers??[]).some(l=>l.variants.some(v=>v.variantId?.includes('impact-sounds:')));
  };
  for(const unit of [...CATS,...ENEMIES].filter(u=>u.combatClass==='healer')){
   const cat=CATS.includes(unit),ids=cat?[unit.id+'-1',unit.id+'-4']:['enemy:'+unit.id+':basic','enemy:'+unit.id];
   for(const id of ids)for(const mode of ['full','short','off']){
    const plan=configureSequence(pilotFixture(id).plan,mode),original=audioTimeline(plan,plan.sequence);
    const contactOnly=original.map(c=>c.role==='impact'?{...c,cue:'heal.medium'}:c);
    const classAware=original.filter(c=>['voice','charge','impact'].includes(c.role)).map(c=>c.role==='impact'?{...c,cue:'heal.medium'}:c.role==='charge'?{...c,cue:'kit.magic.charge'}:c);
    rows.push({unit:unit.id,id,mode,ultimate:plan.ultimate,durationMs:plan.duration,contactMs:plan.sequence.impact,
     methods:[['current',original],['replace-contact-only',contactOnly],['class-aware',classAware]].map(([method,track])=>({method,
      track:track.map(({t,cue,role})=>({t,cue,role})),weaponMovement:track.filter(c=>c.role==='movement').length,
      impactSampleCues:track.filter(hasImpactSamples).map(c=>c.cue),
      contactCount:track.filter(c=>c.role==='impact').length,contactUnchanged:track.filter(c=>c.role==='impact').every(c=>c.t===plan.sequence.impact),
      voiceUnchanged:JSON.stringify(track.filter(c=>c.role==='voice'))===JSON.stringify(original.filter(c=>c.role==='voice')),
      maxSingleCueSources:Math.max(...track.filter(c=>c.role!=='voice').map(c=>(resolveDesign(c.cue,manifest,c.element)?.layers??manifest.cues[c.cue]??[]).length))
     }))});
   }
  }
  return {healers:[...new Set(rows.map(r=>r.unit))],rows,summary:['current','replace-contact-only','class-aware'].map(method=>{
   const cases=rows.map(r=>r.methods.find(m=>m.method===method));
   return {method,cases:cases.length,casesWithImpactSamples:cases.filter(c=>c.impactSampleCues.length).length,casesWithWeaponMovement:cases.filter(c=>c.weaponMovement).length,
    exactlyOneContact:cases.filter(c=>c.contactCount===1).length,unchangedContactAndVoice:cases.filter(c=>c.contactUnchanged&&c.voiceUnchanged).length};
  })};
 },root);
}finally{await browser.close();}
const signature=['apps/web/src/game/cardrpg/battle-v3/audio-timeline.ts','apps/web/public/audio/manifest.json','packages/game-rules/src/cardrpg/depth/catalog.ts','tools/v4ship-lab/audio/healer-routing-compare.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}));
writeFileSync(output,JSON.stringify({at:new Date().toISOString(),scope:'Read-only in-memory routing comparison on actual catalog/fixture/timeline/manifest; no playback, runtime edit or perceptual acceptance.',signature,...result},null,2)+'\n');
console.log(JSON.stringify({healers:result.healers,summary:result.summary}));
