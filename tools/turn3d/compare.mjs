// Semantic before/after fixtures: same seed, six roles and named action. Rules differ.
import {chromium,openSquad,root} from '../squad-support.mjs';
import fs from 'node:fs/promises';
const dir='reports/turn3d/shots/compare';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch(),rows=[];
try{
 const {page:old,errors}=await openSquad(browser,{base:'http://127.0.0.1:5511'});
 const next=await browser.newPage({viewport:{width:1280,height:720}});
 await next.goto('http://127.0.0.1:5511/?demo&squad=1&squad3d=1&squadDebug=1');
 await next.waitForFunction(()=>window.__turn3dReview?.scene?.stats.loaded>=7);
 for(const [skill,role] of [['shieldBash','guardian'],['lanternstorm','witch'],['milkFlask','alchemist'],['yarnAttack','yarn']]){
  const meta=await old.evaluate(({skill,role})=>{
   const h=window.__squadHarness,r=window.__squadReview,b=h.createBattle({encounter:role==='yarn'?'boss':'group',seed:11});
   if(role!=='yarn'){const seen=new Set();b.actors=b.actors.filter(a=>{if(a.side==='party')return true;if(seen.has(a.role))return false;seen.add(a.role);return true});}
   for(const a of b.actors){a.auto=false;a.nextBasic=Infinity;for(const id of Object.keys(h.ABILITIES))a.cooldowns[id]=Infinity;if(a.side==='party')a.hp=Math.round(a.maxHp*.55);else a.hp=a.maxHp=Math.max(a.maxHp,600);}
   const source=b.actors.find(a=>a.role===role);source.cooldowns[skill]=0;source.charge=h.SQUAD_CONFIG.ultimate.max;
   h.emit(b,{type:'wave_transition',wave:b.wave,actors:b.actors});if(!h.beginCast(b,source,skill))throw Error('Cast failed');
   r.controller.running=false;r.controller.battle=b;r.scene.reset(b.events);r.controller.notify();
   const impact=h.ABILITIES[skill].windupMs+h.ABILITIES[skill].travelMs+100;r.scene.consume(h.advance(b,impact));r.scene.invalidate();r.scene.update();r.game.step(performance.now(),0);r.game.loop.sleep();
   return {seed:11,roles:b.actors.map(a=>a.role),time:impact,skill};
  },{skill,role});
  await old.waitForTimeout(120);await old.evaluate(()=>{const r=window.__squadReview;r.scene.invalidate();r.scene.update();r.game.step(performance.now(),0);r.game.loop.sleep()});
  await old.locator('canvas').screenshot({path:`${dir}/pixel-${skill}.png`});
  await next.evaluate(skill=>window.__turn3dReview.controller.inspect(skill,2),skill);
  await next.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.controller.presenter.state.actors.length});
  await next.waitForTimeout(200);await next.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});
  await next.locator('.t3-stage').screenshot({path:`${dir}/turn-${skill}.png`});
  rows.push({...meta,pixel:`${dir}/pixel-${skill}.png`,turn:`${dir}/turn-${skill}.png`});
 }
 await fs.writeFile('reports/turn3d/comparison.json',JSON.stringify({method:'Real renderers at 1280x720. Same seed 11, named action and six-role encounter (boss alone for sweep). Semantic impact moments, not identical HP or time: the conversion changes rules and pacing. Native stage captures; no art tracing or generated references.',rows,errors},null,2));
 console.log(JSON.stringify({pairs:rows.length,errors}));
}finally{await browser.close()}
