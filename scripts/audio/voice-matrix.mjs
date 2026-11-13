/** Actual WebAudio source starts on A's battle in the isolated B integration checkout. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {runtimeSignature,assertUnchanged} from './runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../..'),runtimeRoot=resolve(root,'work/v3solo-integration');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const fixtures=JSON.parse(readFileSync('/Users/bao/taskbar-hero-cardrpg-a6/scripts/v3a2/fixtures.json'));
const manifest=JSON.parse(readFileSync(resolve(runtimeRoot,'apps/web/public/audio/manifest.json')));
const integration=JSON.parse(readFileSync(resolve(root,'reports/v3-shell/b2/q2/integration.json')));
const runtimeSources=runtimeSignature(runtimeRoot);
const trial=process.env.VOICE_MATRIX_TRIAL??'current';
if(!/^[a-zA-Z0-9-]+$/.test(trial))throw Error('Invalid matrix trial');
const base=resolve(root,'reports/v3-shell/b2/q2'),out=resolve(base,'matrices',trial),rows=[];
if(existsSync(resolve(out,'voice-matrix.json')))throw Error('Preserve measured matrix; choose a new trial label.');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 for(const fixture of fixtures.fixtures)for(const speed of [1,2,3]){
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3','{"disabled":true}');});
  await page.goto('http://127.0.0.1:5996/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
  await page.evaluate(async({fixture,seed,speed,runtimeRoot})=>{
   const m=window.__depthReview,R=await import('/@fs'+runtimeRoot+'/packages/game-rules/src/cardrpg/depth/index.ts');
   m.state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(seed),true));m.state.tutorial=4;
   Object.assign(m.state.settings,{speed,quality:'high',reducedMotion:false});
   for(const card of m.state.account.cards){card.level=6;m.state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(s=>s.id);}
   const battle=R.createBattle({seed,chapter:fixture.chapter,cats:R.battleCats(m.state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});battle.v4.committed=true;
   Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});m.notify(false);
   window.__matrix={R,initial:structuredClone(battle),plans:[],seen:new Set(),fired:[],lastEvent:0};
   await window.__thAudio.unlock();await window.__thAudio.preload('battle');
  },{fixture,seed:fixtures.seed,speed,runtimeRoot});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.evaluate(()=>{
   const m=window.__depthReview,c=window.__matrix;
   window.__thAudio.hits.length=0;c.started=Date.now();m.paused=false;m.notify(false);
   c.timer=setInterval(()=>{
    if(m.plan&&!c.seen.has(m.plan)){c.seen.add(m.plan);c.plans.push({id:m.plan.id,skill:m.plan.presentationId??m.plan.skillId,voiceWindows:m.plan.voiceWindows??[],duration:m.plan.duration});}
    const events=window.__depthScene?.audio.events??[];
    c.fired.push(...events.slice(c.lastEvent));c.lastEvent=events.length;
    if(Date.now()-c.started>=30000&&!m.plan){m.paused=true;c.ended=Date.now();clearInterval(c.timer);m.notify(false);}
   },8);
  });
  await page.waitForFunction(()=>window.__matrix.ended,null,{timeout:55000});
  // Allow the final source its complete recorded length before closing the page.
  await page.waitForTimeout(3500);
  const sample=await page.evaluate(()=>{
   const c=window.__matrix,m=window.__depthReview,expected=structuredClone(c.initial),actual=structuredClone(m.battle);
   c.R.playBattle(expected,'auto');c.R.playBattle(actual,'auto');
   return {started:c.started,ended:c.ended,plans:c.plans,fired:c.fired,hits:window.__thAudio.hits,parity:JSON.stringify(expected)===JSON.stringify(actual)};
  });
  const voices=sample.hits.filter(h=>h.id.startsWith('voice.')&&h.result==='played'),cuts=[];
  for(let i=0;i<voices.length-1;i++){
   const cur=voices[i],next=voices[i+1],layer=cur.layers[0],take=manifest.cues[cur.id]?.find(s=>s.variantId===layer.variantId);
   if(!take)throw Error('Missing actual sample '+cur.id+'/'+layer.variantId);
   const expectedMs=take.duration/(layer.pitch||1)*1000,heardMs=next.at-cur.at;
   if(expectedMs>heardMs+40)cuts.push({cueId:cur.id,variantId:layer.variantId,expectedMs,heardMs,nextCueId:next.id,at:cur.at});
  }
  const required=sample.plans.flatMap(p=>p.voiceWindows),ult=v=>v.includes('.ult.'),skill=v=>v.includes('.skill.');
  const barks=sample.fired.filter(e=>e.role==='bark'),spacings=barks.slice(1).map((b,i)=>b.at-barks[i].at);
  const row={fixture:fixture.id,speed,seconds:(sample.ended-sample.started)/1000,ultimateRequired:required.filter(v=>ult(v.cue)).length,ultimatePlayed:voices.filter(v=>ult(v.id)).length,ultimateInterrupted:cuts.filter(v=>ult(v.cueId)).length,skillPlayed:voices.filter(v=>skill(v.id)).length,skillInterrupted:cuts.filter(v=>skill(v.cueId)).length,meanBarkIntervalSeconds:spacings.reduce((a,b)=>a+b,0)/Math.max(1,spacings.length),parity:sample.parity,errors,played:voices.length,interrupted:cuts.length,suppressed:sample.hits.filter(h=>h.id.startsWith('voice.')&&h.result!=='played').reduce((a,h)=>(a[h.result]=(a[h.result]??0)+1,a),{})};
  assertUnchanged(runtimeRoot,runtimeSources);
  const raw=resolve(out,`voice-${fixture.id}-x${speed}.json.gz`);writeFileSync(raw,gzipSync(JSON.stringify({...sample,cuts,row})));
  row.raw={path:raw.slice(root.length+1),sha256:createHash('sha256').update(readFileSync(raw)).digest('hex')};rows.push(row);
  const result=JSON.stringify({generatedAt:new Date().toISOString(),trial,integration,runtimeSources,method:'B source-start method, actual selected sprite duration/pitch, single-voice stop policy and40ms jitter tolerance. Real wall clock and original production engine.',rows},null,2)+'\n';
  writeFileSync(resolve(out,'voice-matrix.json'),result);
  writeFileSync(resolve(base,'voice-matrix.json'),result);
  console.log(JSON.stringify(row));await page.close();
 }
}finally{await browser.close();}
