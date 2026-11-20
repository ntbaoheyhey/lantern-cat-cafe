/** Bind every current ranged action to rules events and its authored flight data. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-class-inventory-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const signature=runtimeSignature(root),hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true});let rows;
try{
 const page=await browser.newPage();await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'||u.port!=='5995')return route.abort();if(u.pathname==='/__ranged-inventory')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Ranged class inventory</title>'});return route.continue();});
 await page.goto('http://127.0.0.1:5995/__ranged-inventory');
 rows=await page.evaluate(async catalogUrl=>{
  const [{CATS,ENEMIES},{pilotFixture},{configureSequence},{audioTimeline},{PAINT_TIMELINES}]=await Promise.all([import(catalogUrl),import('/src/game/cardrpg/vfx-layered/fixture.ts'),import('/src/game/cardrpg/battle-v3/sequence.ts'),import('/src/game/cardrpg/battle-v3/audio-timeline.ts'),import('/src/game/cardrpg/vfx-layered/player.ts')]);
  const rows=[];
  for(const [side,units] of [['party',CATS],['enemy',ENEMIES]])for(const unit of units.filter(u=>u.combatClass==='ranged'))for(const ultimate of [false,true]){
   const id=side==='party'?`${unit.id}-${ultimate?4:1}`:`enemy:${unit.id}${ultimate?'':':basic'}`,fixture=pilotFixture(id),plan=configureSequence(fixture.plan),timeline=PAINT_TIMELINES.get(plan.presentationId??plan.skillId),track=audioTimeline(plan,plan.sequence),impact=plan.beats[2].start,castStart=plan.ultimate?600:0;
   if(!timeline)throw Error('Missing published timeline '+id);
   const flight=timeline.layers.filter(l=>l.anchor==='flight'&&l.start<timeline.impact&&l.keys.some(k=>k.t<timeline.impact&&k.alpha>0)),first=flight.length?Math.min(...flight.map(l=>l.start)):null;
   const launch=first===null?null:castStart+first/timeline.impact*(impact-castStart);
   rows.push({owner:unit.id,side,id,ultimate,combatClass:unit.combatClass,friendly:timeline.friendly,hasFlight:first!==null,element:track[0]?.element,impactMs:impact,durationMs:plan.duration,launchMs:launch,travelMs:launch===null?null:(launch+impact)/2,flightLayers:flight.map(l=>({name:l.name,start:l.start,end:l.end})),events:plan.events.map(e=>({type:e.type,amount:e.amount,targetIds:e.targetIds})),originalTrack:track});
  }
  return rows;
 },`/@fs${root}/packages/game-rules/src/cardrpg/depth/catalog.ts`);
}finally{await browser.close();}
assert.equal(rows.length,14);assert.equal(new Set(rows.map(r=>r.owner)).size,7);assert(rows.filter(r=>!r.hasFlight).every(r=>r.id==='sorrel-4'&&r.friendly));
const manifest=JSON.parse(readFileSync(resolve(root,'apps/web/public/audio/manifest.json'))),elements=[...new Set(rows.filter(r=>r.hasFlight).map(r=>r.element))],impacts=elements.map(element=>{const d=manifest.designs[`kit.${element}.impact`];return {element,designSha256:hash(JSON.stringify(d)),packs:[...new Set(d.layers.flatMap(l=>l.variants.map(v=>v.pack)))],layers:d.layers.map(l=>({role:l.role,variants:l.variants.length,packs:[...new Set(l.variants.map(v=>v.pack))]}))};});
const duplicateImpacts=impacts.flatMap((a,i)=>impacts.slice(i+1).filter(b=>a.designSha256===b.designSha256).map(b=>[a.element,b.element]));
assertUnchanged(root,signature);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',signature,harness:signed(relative(root,import.meta.filename)),inputs:rows.map(r=>signed(`assets/cardrpg-look/vfx-layered/${r.id.replaceAll(':','-')}.json`)),rows,impacts,duplicateImpacts,
 scope:'All seven rules-classified ranged units, basic and ultimate, using existing legal rules fixtures, configured action clocks and shipping authored timelines. Inventory only; launch/travel times are computed, not actual paint or audio observations.',
 decisions:['Sorrel friendly ultimate has no flight: retain its authored supportive behavior and do not fabricate a projectile.','Render each constituent from its named pack; shadow/tide/ice cannot use the old b2-hits-only bake.','Identical tide/ice impact designs require distinct launch/travel selection and measured whole-basic comparison before claiming hero distinction.'],runtimeChanged:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),actions:rows.length,owners:[...new Set(rows.map(r=>r.owner))],flightActions:rows.filter(r=>r.hasFlight).length,impacts,duplicateImpacts}));
