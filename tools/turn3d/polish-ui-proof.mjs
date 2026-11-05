// End-to-end browser evidence for local preparation, one full run and failure paths.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const out='reports/turn3d-polish',browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),checks=[],errors=[];
const open=async(options={},init)=>{const p=await browser.newPage({viewport:{width:1280,height:720},...options});p.on('pageerror',e=>errors.push(String(e)));if(init)await p.addInitScript(init);await p.goto('http://127.0.0.1:5512/?demo&squad=1&squad3d=1&squadDebug=1');await p.getByRole('button',{name:'Begin patrol'}).waitFor();return p};
const snap=async(p,id)=>p.screenshot({path:`${out}/shots/review/${id}.png`,fullPage:true});
try{
 const p=await open();await p.getByRole('button',{name:'Mochi Weapon',exact:true}).click();await p.getByRole('button',{name:'Unequip · empty slot',exact:true}).click();await p.getByRole('button',{name:'Unequip',exact:true}).click();assert.equal(await p.evaluate(()=>window.__turn3dReview.controller.battle.actors[0].equipment.weapon),undefined);await p.getByRole('button',{name:'Auto-equip best',exact:true}).click();await snap(p,'loadout-verified');
 await p.getByRole('button',{name:'Mochi Weapon',exact:true}).click();await p.keyboard.press('Escape');assert.equal(await p.getByRole('dialog').count(),0);checks.push({name:'Item picker equip, auto-equip, Escape',passed:true});
 await p.getByRole('button',{name:'Begin patrol'}).click();await p.waitForFunction(()=>window.__turn3dReview.controller.canChoose);await p.keyboard.press('2');await p.getByRole('button',{name:'Target Spool Ram',exact:true}).focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>window.__turn3dReview.controller.battle.history.some(h=>h.skillId==='shieldBash'));await snap(p,'keyboard-bash');checks.push({name:'Keyboard Bash locks legal target',passed:true});
 // Accelerate presentation by explicit Skip, but use the same controller/rules choices.
 await p.evaluate(()=>{const c=window.__turn3dReview.controller;c.autoAll(true);c.policy='active'});
 const stageShots=new Set();let transitions=[];
 for(let step=0;step<2000;step++){
  const r=await p.evaluate(()=>{const c=window.__turn3dReview.controller;for(let i=0;i<6;i++){c.skip();c.tick(100)}return {stage:c.battle.run.stage,wave:c.battle.wave,result:c.battle.result,busy:c.presenter.busy}});
  if(r.stage==='loot'&&!r.busy){if(!stageShots.has('loot')){await snap(p,'loot-verified');stageShots.add('loot')}await p.getByRole('button',{name:/^Keep /}).first().click();transitions.push('loot');}
  if(r.stage==='rest'&&!r.busy){if(!stageShots.has('rest')){await snap(p,'rest-verified');stageShots.add('rest')}await p.getByRole('button',{name:'Auto-equip best',exact:true}).click();await p.getByRole('button',{name:/Continue patrol|Face the Yarn Giant/}).click();transitions.push('rest');}
  if(r.result){await p.evaluate(()=>{const c=window.__turn3dReview.controller;while(c.presenter.busy)c.skip()});await snap(p,'summary-verified');checks.push({name:'Complete run through loot/rest to summary',result:r.result,transitions});break;}
  if(step===1999)throw Error('Run did not finish');
 }
 await p.close();
 for(const mode of ['missing','lost','calm','audio-blocked']){
  const init=mode==='missing'?()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:orig.call(this,type,...args)}}:mode==='audio-blocked'?()=>{window.AudioContext=class{constructor(){throw Error('Simulated browser audio denial')}}}:undefined;
  const q=await open(mode==='calm'?{reducedMotion:'reduce'}:{},init);await q.getByRole('button',{name:'Begin patrol'}).click();await q.waitForFunction(()=>window.__turn3dReview.controller.canChoose);
  if(mode==='lost'){await q.waitForFunction(()=>window.__turn3dReview.scene?.stats.loaded>=7);await q.evaluate(()=>document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())}
  if(mode==='missing'||mode==='lost'){await q.getByText('3D unavailable — turn combat remains playable.',{exact:true}).waitFor();await q.keyboard.press('2');await q.getByRole('button',{name:'Target Spool Ram',exact:true}).click();assert.equal(await q.evaluate(()=>window.__turn3dReview.controller.battle.history.at(-1).skillId),'shieldBash');assert(await q.locator('.t3-gear-icons').count()>0);assert(await q.locator('.t3-rounds').count()>0)}
  if(mode==='calm'){await q.getByRole('button',{name:'Effects',exact:true}).click();await q.evaluate(()=>window.__turn3dReview.controller.inspect('lanternstorm',2));const f=await q.evaluate(()=>{const f=window.__turn3dReview.controller.frame;return [f.camera,f.shake,f.flash]});assert.deepEqual(f,[0,0,0])}
  if(mode==='audio-blocked'){await q.getByRole('button',{name:'Synthesized audio'}).click();await q.getByText('Audio blocked by the browser. Click to retry.').waitFor()}
  await snap(q,mode);checks.push({name:mode,passed:true});await q.close();
 }
 assert.deepEqual(errors,[]);
}finally{await fs.writeFile(`${out}/ui-proof.json`,JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));await browser.close()}
console.log(JSON.stringify({checks:checks.length,errors}));
