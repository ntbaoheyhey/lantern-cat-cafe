import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const url=process.env.CARDRPG_URL||'file://'+process.cwd()+'/docs/cardrpg/index.html',out=process.env.CARDRPG_CHECK_OUT||'reports/cardrpg/fallback';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),checks=[],errors=[];
try{for(const mode of ['missing','lost','calm','audio-blocked']){
 const p=await browser.newPage({viewport:{width:1024,height:600},reducedMotion:mode==='calm'?'reduce':'no-preference'});p.on('pageerror',e=>errors.push(String(e)));
 if(mode==='missing')await p.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:orig.call(this,type,...args)}});
 if(mode==='audio-blocked')await p.addInitScript(()=>{window.AudioContext=class{constructor(){throw Error('Simulated audio denial')}}});
 await p.goto(url);await p.getByRole('button',{name:/Prepare patrol/}).click();await p.getByRole('button',{name:/Begin patrol/}).click();await p.waitForFunction(()=>window.__turn3dReview.controller.canChoose);
 if(mode==='lost'){await p.waitForFunction(()=>window.__turn3dReview.scene?.stats.loaded>=7);await p.evaluate(()=>document.querySelector('.t3-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())}
 if(mode==='missing'||mode==='lost'){await p.getByText('3D unavailable — turn combat remains playable.',{exact:true}).waitFor();await p.keyboard.press('2');await p.getByRole('button',{name:'Target Spool Ram',exact:true}).click();assert.equal(await p.evaluate(()=>window.__turn3dReview.controller.battle.history.at(-1).skillId),'shieldBash');assert.ok(await p.locator('.t3-rounds').count()>0)}
 if(mode==='calm'){await p.evaluate(()=>window.__turn3dReview.controller.inspect('lanternstorm',2));assert.deepEqual(await p.evaluate(()=>{const f=window.__turn3dReview.controller.frame;return [f.camera,f.shake,f.flash]}),[0,0,0])}
 if(mode==='audio-blocked'){await p.getByRole('button',{name:'Synthesized audio'}).click();await p.getByText('Audio blocked by the browser. Click to retry.').waitFor()}
 await p.screenshot({path:out+'/'+mode+'.png'});checks.push({mode,pass:true});await p.close();
}}finally{await browser.close();await fs.writeFile(out+'/check.json',JSON.stringify({date:new Date().toISOString(),url,checks,errors},null,2))}
assert.deepEqual(errors,[]);console.log(JSON.stringify(checks));
