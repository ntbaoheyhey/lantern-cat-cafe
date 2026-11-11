/** Isolated reward choices; no recorded accounts or acceptance-seed runs. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-rewards-final');await mkdir(output,{recursive:true});
const selected=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',');
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height] of [[1280,720],[1440,900]])for(const modern of [true,false]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&'+(modern?'a6=1&lookSpine=1':'ui=legacy'));await page.waitForFunction(()=>!!window.__depthReview);
 const fixture=await page.evaluate(async root=>{window.__rewardR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;if(m.state.v4)m.state.v4.journey.pending=[];m.state.run=null;m.go('map');return JSON.stringify(m.state);},root);
 for(const kind of modern?['rank0','rank1','rank2','stack0','stack1','cap-skill','cap-charm','cap-both','single','exhausted']:['legacy-skill','legacy-charm','legacy-power-free']){
  if(selected&&!selected.includes(kind))continue;
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind,modern})=>{
   const R=window.__rewardR,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';m.start(1,'campaign',1);
   const run=m.state.run;run.current='0-0';run.rewardChoices=['shelter-1','night-1','skill:mochi-2'];
   const rank=kind==='rank2'?2:kind==='rank0'?0:1;run.upgrades['mochi-2']=rank;run.boons['shelter-1']=kind==='stack0'?0:1;
   if(kind==='cap-skill'||kind==='cap-both')run.upgrades['mochi-2']=3;
   if(kind==='cap-charm'||kind==='cap-both')run.boons['shelter-1']=2;
   if(kind==='single')run.rewardChoices=['skill:mochi-2'];
   if(kind==='legacy-power-free')run.rewardChoices=['skill:mochi-3'];
   if(kind==='exhausted'){
    run.current=null;run.rewardChoices=[];m.state=R.enterNode(m.state,'0-0').state;const r=m.state.run;
    for(const boon of R.BOONS)r.boons[boon.id]=boon.cap;for(const id of m.state.team.flatMap(id=>R.defaultSkills(m.state,id)))r.upgrades[id]=3;
    r.battle.result='party';const expected=R.finishEncounter(m.state);if(!expected.ok)throw Error(expected.error);m.apply(expected,'Route rewards already full. Continue along the route.');
    if(m.state.v4)m.state.v4.journey.pending=[];m.go('map');return{exhausted:true,state:JSON.stringify(m.state),available:R.availableNodes(m.state.run).map(n=>n.id)};
   }
   if(m.state.v4)m.state.v4.journey.pending=[];m.go('map');
   const pick=kind==='legacy-power-free'?'skill:mochi-3':kind==='stack0'||kind==='stack1'?'shelter-1':kind.startsWith('cap-')||kind==='legacy-charm'?'night-1':'skill:mochi-2';
   return{before:JSON.stringify(m.state),pick,result:R.chooseReward(m.state,pick),choices:run.rewardChoices.map(id=>{const skill=id.startsWith('skill:')?R.skillById(id.slice(6),!!run.skillsV5):null,boon=skill?null:R.boonForMode(id,!!run.gameplayV4),rank=skill?(run.upgrades[skill.id]??0):(run.boons[id]??0),quote=R.chooseReward(m.state,id);return{id,name:skill?.name??boon.name,skill:!!skill,description:boon?.description,rank,ok:quote.ok,error:quote.ok?null:quote.error};})};
  },{fixture,kind,modern});
  const panel=page.locator('.dp-route-rewards');
  if(expected.exhausted){
   await expect(panel).toHaveCount(0);const state=JSON.parse(expected.state);expect(state.run.current).toBeNull();expect(state.run.visited).toContain('0-0');expect(expected.available.length).toBeGreaterThan(0);
   expect(await page.locator('button').filter({hasText:/Choose|Go|battle|campfire|event|elite/}).count()).toBeGreaterThan(0);report.checks.push({width,kind,noPendingChoice:true,available:expected.available});
  }else{
   await expect(panel).toBeVisible();await expect(panel).toContainText('Choose one reward. It lasts for this route.');
   for(const choice of expected.choices){
    const button=panel.getByRole('button',{name:new RegExp('^'+choice.name)});expect(await button.isEnabled()).toBe(choice.ok);
    if(choice.skill){await expect(button).toContainText(`Rank ${choice.rank}${choice.ok?' → '+(choice.rank+1):''}/3`);if(choice.ok)await expect(button).toContainText(`Effect power +${choice.rank*20}% → +${(choice.rank+1)*20}%.`);}
    else{await expect(button).toContainText(choice.description);await expect(button).toContainText(`Stack ${choice.rank}${choice.ok?' → '+(choice.rank+1):''}/2`);}
    if(!choice.ok)await expect(button).toContainText(choice.error);
   }
   if(kind==='legacy-power-free')await expect(panel).toContainText('This skill has no power-based effect to increase.');
   expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);report.checks.push({width,kind,readOnly:true,exactRankStack:true,eligibility:true});
   await panel.evaluate(el=>el.scrollIntoView({block:'center'}));
  }
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(()=>{const panel=document.querySelector('.dp-route-rewards'),host=panel?.closest('.a6-route-activity')??document.querySelector('#depth-main'),bounds=host.getBoundingClientRect(),r=panel?.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,panelFits:!r||r.top>=Math.max(0,bounds.top)-1&&r.bottom<=Math.min(innerHeight,bounds.bottom)+1&&r.left>=bounds.left&&r.right<=bounds.right,controlsFit:!panel||[...panel.querySelectorAll('button')].every(b=>{const a=b.getBoundingClientRect();return a.top>=Math.max(0,bounds.top)-1&&a.bottom<=Math.min(innerHeight,bounds.bottom)+1&&a.left>=bounds.left&&a.right<=bounds.right&&b.scrollWidth<=b.clientWidth+1;})};});
  const file=`${width}-${kind}.webp`,png=`/tmp/cardrpg-c-rewards-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,kind,file,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);expect(audit.panelFits,file).toBe(true);expect(audit.controlsFit,file).toBe(true);
  if(!expected.exhausted){const chosen=expected.choices.find(c=>c.id===expected.pick),button=panel.getByRole('button',{name:new RegExp('^'+chosen.name)});await button.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.result.state);await expect(panel).toBeHidden();report.checks.push({width,kind,keyboard:true,exactCommand:true,dismissed:true});}
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
