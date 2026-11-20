import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import assert from 'node:assert/strict';import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';import {chromium,openFixture,config} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/P9');await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const rows=[],shots=[],found=new Set();
try{
 for(const fixture of [...config.fixtures,{...config.fixtures[2],id:'control-recovery'}]){
  const {page,errors}=await openFixture(browser,fixture);
  if(fixture.id==='control-recovery'){
   await page.evaluate(()=>{const m=window.__depthReview,R=window.__v3a2.R;m.offline=true;m.shortcut('unlock');m.state.team=['mochi','soot','sorrel','inkcap'];m.state.rows={mochi:'front',soot:'front',sorrel:'rear',inkcap:'rear'};for(const c of m.state.account.cards){c.level=6;m.state.skills[c.cardId]=R.CAT_BY_ID[c.cardId].skills.map(s=>s.id);}m.tutorialBattle=R.createBattle({...window.__v3a2.initial.initial,cats:R.battleCats(m.state)});m.tutorialBattle.v4.committed=true;window.__depthScene.prepare();m.notify(false);});
   for(let i=0;i<300;i++){await page.clock.runFor(34);if(await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;s.prepare();return s.ready&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId)&&s.actors.size===m.battle.actors.length;}))break;await new Promise(r=>setTimeout(r,15));}
  }
  for(let turn=0;turn<500;turn++){
   const sample=await page.evaluate(()=>{const m=window.__depthReview;if(!m.plan){m.paused=false;if(!m.battle.result){const R=window.__v3a2.R,choice=R.legalChoices(m.battle).find(c=>['sorrel-2','inkcap-2'].includes(c.skillId)&&c.targetId.includes('yarn-giant'));if(choice)m.act(choice);else m.step();}m.paused=true;}return {done:!m.plan,badges:m.plan?.numberBadges??[],plan:m.plan?.presentationId??m.plan?.skillId};});if(sample.done)break;
   const fresh=sample.badges.filter(b=>!found.has(b.kind));
   if(fresh.length){
    const data=await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene,before=JSON.stringify(m.battle);m.animationAt=m.plan.beats[2].start+150;s.render({...s.view(),fixedTime:20,paused:true},0);return {drawn:structuredClone(s.numbers.drawn),badges:structuredClone(m.plan.numberBadges),unchanged:before===JSON.stringify(m.battle)};});
    for(const b of fresh){assert.ok(data.drawn.some(d=>d.id===b.targetId&&d.kind===b.kind));found.add(b.kind);}
    assert.ok(data.unchanged);rows.push({fixture:fixture.id,...sample,...data});shots.push(await sharp(await page.screenshot()).resize(640,360).png().toBuffer());
   }
   await page.evaluate(()=>window.__depthReview.finishMoment());
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 await writeFile(resolve(out,'pilot.json'),JSON.stringify(rows,null,2)+'\n');
 assert.deepEqual([...found].sort(),['absorb','immune','resist']);
 const cols=2,height=28+Math.ceil(shots.length/cols)*360;
 await sharp({create:{width:1280,height,channels:3,background:'#171620'}}).composite([{input:Buffer.from('<svg width="1280" height="28"><text x="12" y="20" font-size="17" fill="white">Real resolved combat: shield absorption / resistance / immunity — icon badges, exact absorbed amount</text></svg>'),left:0,top:0},...shots.map((input,i)=>({input,left:i%cols*640,top:28+Math.floor(i/cols)*360}))]).png().toFile(resolve(out,'compare-badges.png'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),kinds:[...found],rows},null,2)+'\n');console.log('PASS: all3 badges from real combat; exact absorption; unchanged snapshots');
}finally{await browser.close();}
