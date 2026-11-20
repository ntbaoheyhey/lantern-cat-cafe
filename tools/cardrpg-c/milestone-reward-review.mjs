/** Review one-time milestone decisions on isolated practice accounts. No combat runs. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-milestones-final');
const cases=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',')??['full','partial','capped','ribbon-owned','patrol','incomplete','collected'];
const screens=process.argv.find(a=>a.startsWith('--screens='))?.slice(10).split(',')??['events','keepsakes','discoveries','map'];
await mkdir(output,{recursive:true});const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__giftR=R;const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.cleared=[1,2,3];m.state.towerBest=30;
 for(const chapter of[1,2])for(const nodeId of['0-0','2-0','4-0']){const key=`${chapter}/0/${nodeId}/battle`;m.state.v4.journey.stars[key]={key,chapter,band:0,nodeId,kind:'battle',conditions:[true,true,true]};}
 m.state.v4.journal={cats:R.CATS.map(c=>c.id),gear:R.GEAR.slice(0,12).map(g=>g.id),sets:[R.SETS[0].id],rewardedRoutes:10,claims:[]};R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];return JSON.stringify(m.state);},root);
 for(const kind of cases)for(const screen of screens){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind,screen})=>{const R=window.__giftR,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';
   const caps=R.depthCaps(m.state);m.state.account.daily.earned={fish:0,stamps:0,threads:0,essence:0};
   if(kind==='partial'||kind==='ribbon-owned')m.state.account.daily.earned={...caps,fish:caps.fish-3,stamps:caps.stamps-3,threads:caps.threads-2};
   if(kind==='capped')m.state.account.daily.earned={...caps};
   if(kind==='ribbon-owned')m.state.account.inventory.stacks['cafe-ribbon']=1;
   if(kind==='patrol')m.state=R.startRun(m.state,1,826022).state;
   if(kind==='incomplete'){m.state.v4.journey.stars={};m.state.cleared=[];m.state.v4.journal={cats:[],gear:[],sets:[],rewardedRoutes:0,claims:[]};}
   if(kind==='collected'){m.state.v4.journey.claims=R.STAR_REWARDS_V4.map(p=>p.id);m.state.v4.journal.claims=R.MILESTONES_V4.map(p=>p.id);}
   m.state.v4.journey.pending=[];m.go(screen==='events'?'hub':screen==='map'?'map':'journal');
   const stars=R.STAR_REWARDS_V4.map(p=>({...R.starRewardPreviewV4(m.state,p.id),kind:'stars',command:R.claimStarRewardV4(m.state,p.id)}));
   const journal=R.MILESTONES_V4.map(p=>({...R.milestonePreviewV4(m.state,p.id),kind:'journal',command:R.claimMilestoneV4(m.state,p.id)}));
   return{before:JSON.stringify(m.state),gifts:screen==='events'?[...stars,...journal]:screen==='keepsakes'?journal:stars};
  },{fixture,kind,screen});
  if(screen==='events'){await page.getByRole('button',{name:'Events',exact:true}).click();await page.getByRole('button',{name:/Ready gifts/}).click();}
  if(screen==='discoveries')await page.getByRole('button',{name:/Discoveries/}).click();
  const buttonFor=p=>screen==='events'?page.getByRole('button',{name:`Collect ${p.kind==='stars'?p.target+'-star chest':p.name}`,exact:true}):screen==='keepsakes'?page.getByRole('button',{name:`Claim ${p.name}`,exact:true}):screen==='map'?page.locator('.a6-map-chest').nth([3,9,18].indexOf(p.target)):page.getByRole('region',{name:'Route star board'}).getByRole('article').nth([3,9,18].indexOf(p.target)).getByRole('button');
  const cardFor=b=>screen==='map'?b:b.locator('xpath=ancestor::article[1]');
  for(const p of expected.gifts){const button=buttonFor(p),card=cardFor(button),text=await card.innerText(),reduced=Object.entries(p.requested).some(([id,n])=>(p.reward[id]??0)<n);
   expect(await button.isEnabled(),`${width}/${kind}/${screen}/${p.id}`).toBe(p.command.ok);
   if(!p.claimed){for(const[id,n]of Object.entries(p.requested))await expect(card).toContainText(`${n} ${id}`);if(p.ribbon)await expect(card).toContainText('Cafe ribbon');
    if(reduced){await expect(card).toContainText('Today:');for(const[id]of Object.entries(p.requested))await expect(card).toContainText(`${p.reward[id]??0} ${id}`);}
    if(p.command.ok&&reduced){expect(text.toLowerCase()).toContain('uses the whole gift');if(screen!=='map')expect(await button.innerText()).toBe('Collect reduced gift');
     const description=await button.evaluate(b=>(b.getAttribute('aria-describedby')??'').split(' ').map(id=>document.getElementById(id)?.textContent??'').join(' '));if(screen!=='map')expect(description).toContain('uses the whole gift');}
   }
   report.checks.push({width,kind,screen,id:p.id,eligible:p.command.ok,fullVisible:!p.claimed,disclosed:p.command.ok&&reduced});
  }
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  const capture=async suffix=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
   const audit=await page.evaluate(screen=>{const host=document.querySelector('.uv-sheet-content').getBoundingClientRect(),cards=[...document.querySelectorAll(screen==='keepsakes'?'.a6-journal-ticket':screen==='discoveries'?'.dp-v4-star-board article':screen==='map'?'.a6-map-chest':'.a6-gift-tickets article')];
    const map=document.querySelector('.a6-scenic')?.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,cardsFit:cards.every(c=>c.scrollWidth<=c.clientWidth+1),cardsContained:screen!=='discoveries'||cards.every(c=>c.getBoundingClientRect().bottom<=c.closest('.dp-v4-star-board').getBoundingClientRect().bottom-2),buttonsFit:screen==='events'||cards.every(c=>{const b=(c.tagName==='BUTTON'?c:c.querySelector('button')).getBoundingClientRect();return b.top>=host.top-1&&b.bottom<=host.bottom+1;}),mapFits:screen!=='map'||cards.every(c=>{const b=c.getBoundingClientRect();return b.top>=map.top&&b.bottom<=map.bottom&&b.left>=map.left&&b.right<=map.right;})};},screen);
   const file=`${width}-${screen}-${kind}${suffix}.webp`,png=`/tmp/cardrpg-c-milestones-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({file,...audit});
   expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);expect(audit.cardsFit,file).toBe(true);expect(audit.cardsContained,file).toBe(true);expect(audit.buttonsFit,file).toBe(true);expect(audit.mapFits,file).toBe(true);
  };
  await capture('');
  const claim=kind==='ribbon-owned'?expected.gifts.find(p=>p.id==='three-chapters'&&p.command.ok):expected.gifts.find(p=>p.command.ok);
  if(claim){const button=buttonFor(claim);await button.focus();await expect(button).toBeInViewport({ratio:1});await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(claim.command.state);await expect(button).toBeDisabled();report.checks.push({width,kind,screen,keyboard:true,exactCommand:true});if(['partial','ribbon-owned'].includes(kind))await capture('-claimed');}
  if(kind==='capped'){
   const next=await page.evaluate(()=>{const R=window.__giftR,m=window.__depthReview,r=R.metaCommand(m.state,{type:'advanceLocalDay'});m.apply(r);return r.state;});expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(next);
   for(const p of expected.gifts.filter(p=>!p.ribbon)){await expect(buttonFor(p)).toBeEnabled();await expect(cardFor(buttonFor(p))).not.toContainText('Today:');}report.checks.push({width,kind,screen,nextDayRestores:true});
  }
  if(await page.getByRole('button',{name:'Close',exact:true}).count())await page.getByRole('button',{name:'Close',exact:true}).click();
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output,checks:report.checks.length,keyboard:report.checks.filter(c=>c.keyboard).length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
