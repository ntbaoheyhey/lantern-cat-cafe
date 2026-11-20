/** Isolated accounts and deterministic browser audio devices. No audible output. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-sound-final';
await mkdir(output,{recursive:true});
const report={scope:'Isolated accounts; real CafeAudio controls with a local browser device fixture; no audible-output claim.',checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of baseline?[true]:[false,true]){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{
  window.__soundR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.Audio=undefined;
  const param=()=>({value:0,setTargetAtTime(){}}),node=()=>({connect(to){return to;},disconnect(){}});
  const Device=class{
   state='suspended';sampleRate=44100;currentTime=0;destination={};
   constructor(){window.__soundFixture.constructed++;}
   createGain(){return{...node(),gain:param()};}
   createDynamicsCompressor(){return{...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};}
   createBuffer(_,length){return{getChannelData:()=>new Float32Array(length)};}
   async resume(){const f=window.__soundFixture;f.calls++;if(f.mode==='denied')throw Error('Private audio diagnostic '.repeat(400));if(f.mode==='pending')await new Promise((resolve,reject)=>f.release=ok=>ok?resolve():reject(Error('Blocked')));if(f.mode!=='suspended')this.state='running';}
   close(){this.state='closed';return Promise.resolve();}
  };window.__soundDevice=Device;window.AudioContext=Device;
  window.__depthReview.audio.ui=()=>{};window.__depthReview.audio.update=()=>{};
 },root);
 const snapshot=()=>page.evaluate(()=>{const m=window.__depthReview;return JSON.stringify({state:{...m.state,settings:{...m.state.settings,sound:false}},paused:m.paused,battle:m.battle,plan:m.plan,at:m.playbackAt});});
 const setup=async(surface,mode)=>{
  await page.evaluate(()=>{const m=window.__depthReview;m.audio.dispose();m.watching=false;m.go('hub');});
  await page.locator('.a6-settings-desk,.uv-battle-hud').waitFor({state:'hidden'});
  await page.evaluate(({surface,mode,reduced})=>{
   const m=window.__depthReview,R=window.__soundR;m.offline=true;m.plan=null;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.watching=false;m.audio.blocked=false;
   window.__soundFixture={mode,calls:0,constructed:0,release:null};window.AudioContext=mode==='unsupported'?undefined:window.__soundDevice;
   m.state=R.setGameplayA6(R.createDepthAccount(918445,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;m.state.settings.sound=false;
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];
   if(surface==='battle'){m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.fight();m.paused=true;m.notify(false);}else m.go('save');
  },{surface,mode,reduced});
  if(surface==='battle'){await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);await page.getByRole('button',{name:'More battle options'}).click();}
  else await page.locator('.a6-settings-desk').waitFor();
  return snapshot();
 };
 const capture=async(surface,label,save=reduced)=>{
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('.uv-sheet').evaluateAll(els=>Promise.all(els.flatMap(el=>el.getAnimations({subtree:true}).filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(surface=>{
   const host=document.querySelector(surface==='battle'?'.uv-battle-menu':'.a6-settings-desk'),bounds=surface==='battle'?{left:0,top:0,right:innerWidth,bottom:innerHeight}:host.closest('.uv-sheet-content').getBoundingClientRect();
   const fits=el=>{const r=el.getBoundingClientRect();return r.top>=bounds.top-1&&r.bottom<=bounds.bottom+1&&r.left>=bounds.left-1&&r.right<=bounds.right+1;};
   const button=[...host.querySelectorAll('button')].find(b=>/sound/i.test(b.textContent));
   return{hostFits:fits(host),controlsFit:[...host.querySelectorAll('button,input,select')].every(fits),statusFits:[...host.querySelectorAll('.a6-sound-status')].filter(el=>el.getClientRects().length).every(fits),overflow:document.documentElement.scrollWidth>innerWidth,label:button.textContent,disabled:button.disabled,status:host.querySelector('.a6-sound-status')?.textContent??'',pressed:button.getAttribute('aria-pressed')};
  },surface);
  if(save){const file=`${width}-${surface}-${label}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+file]);report.shots.push({file,width,reduced,surface,label,...audit});}
  report.checks.push({width,reduced,surface,label,...audit});
  if(!baseline){expect(audit.hostFits,label).toBe(true);expect(audit.controlsFit,label).toBe(true);expect(audit.statusFits,label).toBe(true);expect(audit.overflow,label).toBe(false);}
 };
 for(const surface of['settings','battle']){
  const before=await setup(surface,'pending'),start=()=>page.getByRole('button',{name:surface==='battle'?'Turn sound on':'Sound off',exact:true});
  await start().focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__soundFixture.calls===1);
  if(!baseline){await expect(page.getByRole('button',{name:'Starting sound…'})).toBeDisabled();await expect(page.locator('.a6-sound-status')).toContainText('Opening sound');}
  await capture(surface,'pending');await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__soundFixture.calls)).toBe(1);expect(await snapshot()).toBe(before);
  await page.evaluate(()=>window.__soundFixture.release(false));await page.waitForFunction(()=>window.__depthReview.audio.blocked);
  await capture(surface,'blocked');if(baseline)continue;
  const retry=()=>page.getByRole('button',{name:'Try sound again'});await expect(retry()).toBeEnabled();await expect(retry()).toHaveAttribute('aria-pressed','false');
  expect(await snapshot()).toBe(before);expect(await page.evaluate(()=>window.__depthReview.state.settings.sound)).toBe(false);
  await page.evaluate(()=>window.__soundFixture.mode='success');await retry().focus();await page.keyboard.press('Enter');
  const off=()=>page.getByRole('button',{name:surface==='battle'?'Turn sound off':'Sound on',exact:true});await expect(off()).toHaveAttribute('aria-pressed','true');await expect(off()).toBeFocused();await expect(page.locator('.a6-sound-status')).toHaveText('');
  expect(await page.evaluate(()=>window.__depthReview.state.settings.sound)).toBe(true);expect(await snapshot()).toBe(before);await capture(surface,'enabled');
  await page.keyboard.press('Enter');await expect(start()).toHaveAttribute('aria-pressed','false');expect(await snapshot()).toBe(before);await capture(surface,'off');
  for(const mode of['denied','suspended','unsupported']){const state=await setup(surface,mode);await start().click();await expect(retry()).toBeEnabled();await capture(surface,mode);expect(await snapshot()).toBe(state);}
  // Start in one view, leave while pending, and return after the device settles.
  const state=await setup(surface,'pending');await start().click();await expect(page.getByRole('button',{name:'Starting sound…'})).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__soundFixture.release(false));await page.waitForFunction(()=>window.__depthReview.audio.blocked);
  if(surface==='battle')await page.getByRole('button',{name:'More battle options'}).click();else await page.evaluate(()=>window.__depthReview.go('save'));
  await expect(retry()).toBeEnabled();expect(await snapshot()).toBe(state);await capture(surface,'returned');
  if(reduced){const state=await setup(surface,'pending');await start().click();await expect(retry()).toBeEnabled({timeout:8000});await capture(surface,'timeout');expect(await snapshot()).toBe(state);await page.evaluate(()=>{window.__soundFixture.release(true);window.__soundFixture.mode='success';});await expect(retry()).toBeEnabled();expect(await page.evaluate(()=>window.__depthReview.audio.enabled)).toBe(false);await retry().click();await expect(off()).toHaveAttribute('aria-pressed','true');await capture(surface,'timeout-retry');expect(await snapshot()).toBe(state);}
 }
 await context.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
