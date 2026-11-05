// Controlled frame fixtures through the real pure core and the real Phaser presenter.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, chromium, openSquad } from './squad-support.mjs';
const out=resolve(root,'reports/squad/effects');mkdirSync(out,{recursive:true});
const browser=await chromium.launch(),records=[];
try {
 const {page,errors,writes}=await openSquad(browser);
 const cases=[
  ...['shieldBash','rally','hearthwall'].map(skill=>({skill,role:'guardian'})),
  ...['threadSnare','emberOrb','lanternstorm'].map(skill=>({skill,role:'witch'})),
  ...['milkFlask','mossFlask','nineLives'].map(skill=>({skill,role:'alchemist'})),
  ...['guard','flanker','ranger','healer','charger','elite'].map(role=>({role,skill:role+'Attack'})),
  ...['yarnAttack','crossSweep','bindThread'].map(skill=>({role:'yarn',skill})),
  {role:'guardian',skill:'shieldBash',passive:'steadfast'},
  {role:'witch',skill:'witchBasic',passive:'warmWick'},
  {role:'alchemist',skill:'milkFlask',passive:'lastSip'},
 ];
 for(const fixture of cases){
  const meta=await page.evaluate(f=>{
   const h=window.__squadHarness,r=window.__squadReview;
   r.controller.running=false;r.game.loop.sleep();
   const b=h.createBattle({encounter:f.role==='yarn'?'boss':'group',seed:11});
   // Quiet everyone except the demonstrated cast. No renderer computes an outcome.
   for(const a of b.actors){a.auto=false;a.nextBasic=Infinity;for(const id of Object.keys(h.ABILITIES))a.cooldowns[id]=Infinity;}
   const source=b.actors.find(a=>a.role===f.role);source.cooldowns[f.skill]=0;source.charge=h.SQUAD_CONFIG.ultimate.max;
   const g=b.actors[0],witch=b.actors[1];
   if(['milkFlask','mossFlask','nineLives'].includes(f.skill)){g.hp=Math.round(g.maxHp*.25);witch.hp=Math.round(witch.maxHp*.5);}
   if(f.skill==='healerAttack')b.actors.find(a=>a.role==='guard').hp=40;
   if(f.skill==='nineLives')for(const a of b.actors.filter(a=>a.side==='party'))h.applyStatus(b,b.actors[3],a,'burn',5000);
   if(f.passive==='warmWick')h.applyStatus(b,source,b.actors[3],'burn',5000);
   if(f.passive==='steadfast'){
    const foe=b.actors.find(a=>a.role==='charger');foe.cooldowns.chargerAttack=0;h.beginCast(b,foe,'chargerAttack');b.priority=foe.id;
   }
   if(f.skill==='crossSweep'){b.phase=2;h.emit(b,{type:'boss_phase',phase:2,actor:source});}
   h.emit(b,{type:'wave_transition',wave:b.wave,actors:b.actors});
   if(!h.beginCast(b,source,f.skill))throw Error('Could not begin '+f.skill);
   r.controller.battle=b;r.scene.reset(b.events);r.controller.notify();
   const a=h.ABILITIES[f.skill],impact=a.windupMs+a.travelMs;
   const frames=[{label:'Anticipation',time:a.windupMs-50},{label:'Motion',time:a.windupMs+Math.floor(a.travelMs/100)*50},{label:'Impact',time:impact},{label:'Residue',time:impact+200}];
   if(f.skill==='lanternstorm')frames.push({label:'Strike 2',time:impact+h.SQUAD_CONFIG.stormSpacingMs},{label:'Strike 3',time:impact+h.SQUAD_CONFIG.stormSpacingMs*2});
   if(f.skill==='mossFlask')frames.push({label:'Protective patch',time:impact+2000});
   return {frames,name:a.name,source:source.id};
  },fixture);
  const frames=[];
  for(const frame of meta.frames){
   const measured=await page.evaluate(time=>{
    const r=window.__squadReview,h=window.__squadHarness,b=r.controller.battle;
    r.scene.consume(h.advance(b,time-b.time));r.scene.invalidate();r.scene.update();r.game.step(performance.now(),0);r.game.loop.sleep();
    for(const actor of b.actors){const rendered=r.scene.model.actors[actor.id];if(rendered.hp!==actor.hp||rendered.shield!==actor.shield)throw Error('Presentation diverged from resolved HP/shield for '+actor.id);}
    return {time:b.time,events:b.events.filter(e=>e.time===b.time).map(e=>({type:e.type,skill:e.skill,source:e.source,target:e.target,amount:e.amount})),rigs:[...r.scene.rigs].map(([id,x])=>({id,x:x.sprite.x,y:x.sprite.y,frame:x.sprite.frame.name})),bright:r.scene.effects.length,labels:r.scene.labels.length};
   },frame.time);
   const name=fixture.passive??fixture.skill,file=`${name}-${frames.length}.png`;
   await page.locator('canvas').screenshot({path:resolve(out,file)});frames.push({...frame,...measured,file});
  }
  const events=await page.evaluate(()=>window.__squadReview.controller.battle.events.filter(e=>['impact','heal','shield','status_applied','passive','interrupt','spawn'].includes(e.type)).map(e=>({time:e.time,type:e.type,skill:e.skill,target:e.target,amount:e.amount})));
  const id=fixture.passive??fixture.skill;
  assert(events.some(e=>fixture.passive?e.type==='passive'&&e.skill===fixture.passive:e.skill===fixture.skill));
  records.push({...fixture,id,name:meta.name,frames,events});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
}finally{await browser.close();}
writeFileSync(resolve(root,'reports/squad/effects.json'),JSON.stringify({method:'Controlled fixtures; actual engine events and actual Phaser presenter, 50ms steps. Frames are native 680×330.',records},null,2)+'\n');
console.log(`${records.length} effect contracts captured, with resolved-event evidence.`);
