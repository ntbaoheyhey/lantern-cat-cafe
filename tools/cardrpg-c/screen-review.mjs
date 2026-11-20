/** Reviewer fixtures and screenshots. This is not a natural-progression or timing claim. */
import {createRequire} from 'node:module';
import {writeFile,mkdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium,expect}=require('@playwright/test');
const arg=(name,fallback)=>process.argv.find(v=>v.startsWith(`--${name}=`))?.split('=').slice(1).join('=')??fallback;
const tag=arg('tag','c11'),names=arg('screens','home,daily,collection,cats-skills,cats-bonds,cats-gear,bonds,team,inventory,relics,gacha,map-choose,map-progress,map-choice,map-boss,tower,journal,codex,save,prepare,result,loss,recruit-welcome,recruit-letter,recruit-seal,recruit-burst,recruit-highlight,recruit-legendary,recruit-summary,recruit-reduced,bag-empty').split(',');
const reuseCaptures=process.argv.includes('--reuse-captures');
const sizes=arg('sizes','1440x900,1280x720').split(',').map(v=>v.split('x').map(Number));
const output=resolve(root,'reports/cardrpg-c/shots',tag),shots=[],errors=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const lease=setTimeout(()=>{console.error('Screenshot review exceeded 19-minute lease.');process.exit(2);},19*60*1000);
try {
 for(const [width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');
  await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  await page.evaluate(()=>{const m=window.__depthReview;m.offline=true;m.state.tutorial=4;m.state.freeInvite=true;m.shortcut('unlock');m.shortcut('chapter');if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.go('hub');});
  const recruitFixture=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
  for(const name of names){
   if(await access(resolve(root,'reports/cardrpg-c/STOP-C')).then(()=>true,()=>false))throw Error('STOP-C');
   let scrollBeforeReveal;
   if(name==='home')await page.evaluate(()=>window.__depthReview.go('hub'));
   else if(name.startsWith('cats-')){
    await page.evaluate(()=>window.__depthReview.go('collection'));
    const label={skills:'Skills',bonds:'Bonds',gear:'Gear'}[name.slice(5)];
    await page.getByRole('complementary',{name:'Cat details'}).getByRole('button',{name:label,exact:true}).click();
   }else if(name.startsWith('map-')){
    await page.evaluate(async kind=>{const m=window.__depthReview;m.state.run=null;m.tutorialBattle=null;m.watching=false;m.plan=null;m.state.cleared=[];m.go('map');
     if(kind!=='choose'){m.start(1,'campaign',1);const run=m.state.run;
      if(kind==='choice'){const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');run.current=run.nodes[0].id;run.rewardChoices=['skill:mochi-1',...Object.keys(R.BOON_BY_ID).slice(0,2)];}
      if(kind==='progress'||kind==='boss'){
       run.visited=kind==='boss'?['0-0','1-0','2-0','3-0','4-0','5-0']:['0-0','1-0','2-0','3-0'];
       for(const id of run.visited){const node=run.nodes.find(n=>n.id===id),key=`${run.chapter}/${run.challengeLevel}/${id}/${node.kind}`;m.state.v4.journey.stars[key]={key,chapter:1,band:run.challengeLevel,nodeId:id,kind:node.kind,conditions:[true,true,true]};}
      }
     }
     m.notify(false);
    },name.slice(4));
    await page.waitForTimeout(2200);
    await page.evaluate(()=>{const m=window.__depthReview;m.error=false;m.notice='';m.notify(false);});
   }else if(name==='bag-empty'){
    await page.evaluate(()=>{const m=window.__depthReview;m.state.gear=[];m.itemId='';m.go('inventory');});
   }else if(name==='prepare')await page.evaluate(()=>{const m=window.__depthReview;m.state.run=null;m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);});
   else if(name.startsWith('recruit-')){
    await page.evaluate(({fixture,kind})=>{const m=window.__depthReview;m.state=JSON.parse(fixture);m.state.run=null;m.tutorialBattle=null;m.watching=false;m.plan=null;m.state.account.seed=11;m.state.settings.reducedMotion=kind==='reduced';
     if(kind!=='summary')m.state.account.cards=m.state.account.cards.filter(c=>['mochi','soot','clover'].includes(c.cardId));
     if(kind==='legendary')m.state.account.pity['cats-standard']={sinceLegendary:23,totalPulls:23,featuredGuaranteed:false};
     m.go('gacha');m.notify(false);
    },{fixture:recruitFixture,kind:name.slice(8)});
    if(name!=='recruit-welcome'){
     if(name==='recruit-reduced'){
      // Activate the visible recruit control by keyboard without moving the sheet.
      await page.getByRole('button',{name:/^Recruit ×10/}).focus();
      scrollBeforeReveal=await page.locator('.uv-sheet-content').evaluate(el=>{el.scrollTop=el.scrollHeight;return el.scrollTop;});
      await page.keyboard.press('Enter');
     }else{
     await page.getByRole('button',{name:/^Recruit ×10/}).click();
      if(name==='recruit-summary')scrollBeforeReveal=await page.locator('.uv-sheet-content').evaluate(el=>{el.scrollTop=el.scrollHeight;return el.scrollTop;});
     }
     const target={letter:'letter',seal:'seal',burst:'burst',highlight:'reveal',legendary:'reveal',summary:'summary',reduced:'summary'}[name.slice(8)];
     await page.locator(`[data-beat="${target}"]`).waitFor();
    }
   }else if(name==='recruit'){
    await page.evaluate(()=>{const m=window.__depthReview;m.state.run=null;m.tutorialBattle=null;m.watching=false;m.plan=null;m.go('gacha');});
    await page.getByRole('button',{name:/^Recruit ×10/}).click();
    await page.locator('[data-beat="reveal"]').waitFor();
   }else if(name==='result'){
    await page.evaluate(()=>{const m=window.__depthReview;m.state.run=null;m.tutorialBattle=null;m.watching=false;m.plan=null;m.state.settings.speed=3;m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);});
    await page.getByRole('button',{name:/^Fight/}).click();
    await page.locator('.uv-result').waitFor({timeout:120000});
   }else if(name==='loss'){
    await page.evaluate(()=>{const m=window.__depthReview;m.watching=false;m.plan=null;m.battle.result='enemy';m.screen='result';m.notify(false);});
    await page.getByRole('region',{name:'Your next change'}).waitFor();
   }else if(name==='daily'){
    await page.evaluate(()=>window.__depthReview.go('hub'));
    await page.getByRole('button',{name:'Events',exact:true}).click();
   }else{
    await page.evaluate(screen=>{const m=window.__depthReview;m.watching=false;m.plan=null;m.state.run=null;m.go(screen);},name);
    await page.locator(`[data-screen="${name}"]`).waitFor();
    if(name==='relics'){
     await page.getByRole('button',{name:'Load demo relics',exact:true}).click();
     await page.getByRole('button',{name:/^Equip /}).last().click();
    }
   }
   if(name==='prepare')await page.waitForFunction(()=>!document.querySelector('.dp-v4-forecast')?.textContent.includes('Reading the matchup'),{},{timeout:30000});
   await page.waitForTimeout(name.startsWith('recruit')?150:name==='home'?1500:600);
   await page.waitForFunction(()=>Array.from(document.images).filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-${tag}-${width}-${name}.png`;
   const reusedCapture=reuseCaptures&&await access(resolve(output,file)).then(()=>true,()=>false);
   if(!reusedCapture){await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','82',tmp,'-o',resolve(output,file)]);}
   const detail=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth>innerWidth,
    recruit:document.querySelector('.uv-recruit-stage')?{beat:document.querySelector('.uv-recruit-stage').getAttribute('data-beat'),rarity:document.querySelector('.uv-recruit-stage').getAttribute('data-rarity'),splash:document.querySelector('.uv-recruit-stage').getAttribute('data-splash'),draws:window.__depthReview.state.account.daily.draws,rewards:window.__depthReview.state.account.history.slice(-10).map(r=>({rarity:r.rarity,duplicate:r.duplicate,shards:r.shards}))}:undefined,
    illustrated:[...document.querySelectorAll('img')].filter(i=>i.getClientRects().length&&i.currentSrc.includes('cardrpg-a6/illustrations')).length,
    primaryActions:[...(document.querySelector('.uv-sheet-content')??document).querySelectorAll('.cr-primary,.uv-fight')].filter(e=>e.checkVisibility()).map(e=>({text:e.textContent?.trim(),bottom:Math.round(e.getBoundingClientRect().bottom),visible:e.getBoundingClientRect().bottom<=innerHeight-12})),
    crewHeights:[...document.querySelectorAll('.uv-home-crew img')].map(i=>Math.round(i.getBoundingClientRect().height)),
    sheet:(()=>{const s=document.querySelector('.uv-sheet-content');return s?{height:s.clientHeight,content:s.scrollHeight,scrollTop:s.scrollTop}:null})(),
    broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).map(i=>i.src),
   }));
   shots.push({name,width,height,file,reusedCapture,scrollBeforeReveal,...detail});
   await writeFile(resolve(output,'review.json'),JSON.stringify({fixture:'Reviewer unlocks; no natural-progression claim.',shots,errors,complete:false},null,2)+'\n');
   if(detail.overflow||detail.broken.length)throw Error(JSON.stringify(detail));
   if(detail.primaryActions.some(action=>!action.visible))throw Error(`Primary action below fold: ${JSON.stringify(detail.primaryActions)}`);
   if(['recruit-summary','recruit-reduced'].includes(name)){
    const heading=page.getByRole('heading',{name:'Welcome home'});
    await expect(heading).toBeInViewport({ratio:1});
    await expect(heading).toBeFocused();
    await expect(page.locator('.uv-recruit-summary article')).toHaveCount(10);
    if(detail.sheet.scrollTop!==0)throw Error('Completed reveal did not reset the sheet scroll');
    for(const card of await page.locator('.uv-recruit-summary article').all())await expect(card).toBeInViewport({ratio:1});
    await expect(page.getByRole('button',{name:'Meet your cats'})).toBeInViewport({ratio:1});
    shots.at(-1).allRewardsVisible=true;
   }
   if(name==='map-choice'){
    const choice=page.locator('.a6-route-activity .dp-reward').first();
    await expect(choice).toBeInViewport({ratio:1});await choice.focus();await page.keyboard.press('Enter');
    await expect(page.locator('.a6-route-activity')).toHaveCount(0);
    shots.at(-1).keyboardChoiceSettled=await page.evaluate(()=>window.__depthReview.state.run.rewardChoices.length===0);
   }
   if(name==='inventory'){
    const equip=page.locator('.a6-gear-detail').getByRole('button',{name:'Equip',exact:true});
    if(await equip.count()){await expect(equip).toBeInViewport({ratio:1});await equip.click();shots.at(-1).equipWorked=await page.evaluate(()=>!window.__depthReview.error);}
   }
   if(name==='daily'){
    const login=page.getByRole('button',{name:'Collect login gift',exact:true});
    await expect(login).toBeInViewport({ratio:1});await login.focus();await page.keyboard.press('Enter');
    await expect(page.getByRole('button',{name:'Next gift tomorrow',exact:true})).toBeDisabled();
    shots.at(-1).loginKeyboardClaimed=await page.evaluate(()=>window.__depthReview.state.dailyA6?.loginGifts===1);
   }
   if(name==='tower')await expect(page.getByRole('button',{name:/^Climb floor/})).toBeInViewport({ratio:1});
   await writeFile(resolve(output,'review.json'),JSON.stringify({fixture:'Reviewer unlocks; no natural-progression claim.',shots,errors,complete:false},null,2)+'\n');
  }
  await page.close();
 }
 if(errors.length)throw Error(JSON.stringify(errors));
 await writeFile(resolve(output,'review.json'),JSON.stringify({fixture:'Reviewer unlocks; no natural-progression claim.',shots,errors,complete:true},null,2)+'\n');
 console.log(JSON.stringify({shots:shots.length,errors,output}));
}finally{clearTimeout(lease);await browser.close();}
