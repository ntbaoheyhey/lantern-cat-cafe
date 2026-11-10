import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const part=process.argv.find(arg=>arg.startsWith('--part='))?.slice(7)??'all';
if(!['all','battle','sheets','phase'].includes(part))throw Error('Use --part=all, battle, sheets or phase.');
const require=createRequire(root+'/apps/web/package.json');
const {chromium,expect}=require('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const lease=setTimeout(()=>{console.error('Final gallery exceeded 19-minute lease.');void browser.close();},19*60*1000);
const errors=[],shots=[],battles=[],accessibility=[];
const stop=()=>{if(require('node:fs').existsSync(root+'/STOP-A6'))throw Error('STOP-A6 requested');};
const output=root+'/reports/cardrpg-a6/final-screens';
await mkdir(output,{recursive:true});
try {
 for(const [width,height] of [[1440,900],[1280,720]]){
  stop();
  const context=await browser.newContext({viewport:{width,height},...(width===1440&&part!=='sheets'&&part!=='phase'?{recordVideo:{dir:'/tmp/cardrpg-a6-final-boss-video',size:{width:1280,height:800}}}:{})}),page=await context.newPage();
  const video=page.video(),videoStartedAt=Date.now();
  page.on('pageerror',e=>errors.push({width,error:e.message}));
  page.on('console',e=>{if(e.type()==='error')errors.push({width,error:e.text()});});
  await page.goto('http://127.0.0.1:5960/?demo=1&squad=1&cardrpg2=1&a6=1');
  await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  await page.evaluate(()=>{const m=window.__depthReview;m.offline=true;m.state.tutorial=4;m.state.freeInvite=true;m.shortcut('unlock');m.shortcut('chapter');if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.go('hub');});
  const shot=async (name,immediate=false)=>{
   stop();if(!immediate)await page.waitForTimeout(350);
   const tmp=`/tmp/cardrpg-a6-final-${width}-${name}.png`,file=`${width}-${name}.webp`;
   await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','80',tmp,'-o',`${output}/${file}`]);
   shots.push({name,width,height,file,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),broken:await page.locator('img').evaluateAll(images=>images.filter(i=>i.getClientRects().length&&!i.naturalWidth).length)});
   await writeFile(output+`/${part}-partial.json`,JSON.stringify({shots,battles,accessibility,errors},null,2)+'\n');
  };
  const go=async screen=>{await page.evaluate(screen=>window.__depthReview.go(screen),screen);await page.locator(`[data-screen="${screen}"]`).waitFor();await page.waitForTimeout(600);};
  if(part!=='battle'&&part!=='phase'){
  await shot('home');
  await page.getByRole('button',{name:'Events',exact:true}).click();await page.locator('[data-screen="events"]').waitFor();await shot('daily');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await go('collection');await shot('cats-growth');
  const detail=page.getByRole('complementary',{name:'Cat details'});
  for(const tab of ['Skills','Bonds','Gear']){await detail.getByRole('button',{name:tab,exact:true}).click();await shot(`cats-${tab.toLowerCase()}`);}
  for(const screen of ['bonds','team','inventory','gacha','map','tower','journal','codex','save']){
   await go(screen);await shot(screen);
   if(screen==='team'){await page.locator('.a6-team-picker summary').click();await shot('suggested-teams');}
   if(screen==='map'){
    await page.emulateMedia({reducedMotion:'reduce'});
    accessibility.push({width,reducedMap:await page.locator('.a6-scenic').evaluate(el=>[...el.querySelectorAll('*')].every(n=>getComputedStyle(n).animationName==='none'))});
    await page.emulateMedia({reducedMotion:'no-preference'});
    const first=page.locator('.a6-chapters button:not(:disabled)').first();await first.focus();
    accessibility.at(-1).focusVisible=await first.evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle!=='none');
   }
  }
  await go('relics');await page.getByRole('button',{name:'Load demo relics',exact:true}).click();
  await page.getByRole('button',{name:/^Equip /}).last().click();await shot('relics');
  }
  await page.evaluate(()=>{const m=window.__depthReview;m.state.run=null;m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);});
  await page.getByRole('button',{name:/^Fight/}).waitFor();if(part!=='battle'&&part!=='phase')await shot('prepare');
  if(part==='sheets'){await context.close();continue;}
  if(part!=='phase'){
  await page.getByRole('button',{name:/^Fight/}).click();await page.getByRole('button',{name:'Pause auto',exact:true}).waitFor();await page.waitForFunction(()=>window.__depthReview.sceneReady,null,{timeout:90000});await page.waitForTimeout(1800);
  await page.getByRole('button',{name:'Pause auto',exact:true}).click();await shot('normal-battle');
  }
  // A controlled boss fixture uses real automatic actions, with no forced casts.
  await page.evaluate(async()=>{
   const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
   const m=window.__depthReview;m.plan=null;m.watching=false;m.tutorialBattle=null;m.replay=null;m.state.run=null;
   m.state.team=['mochi','soot','clover'];m.state.account.cards=m.state.account.cards.filter(c=>m.state.team.includes(c.cardId));m.state.gear=[];m.state.equipment={};m.state.selectedRelic=null;
   const themes={mochi:'hearthloom',soot:'moonwick',clover:'mossbrew'};
   for(const card of m.state.account.cards){card.level=6;card.stars=1;m.state.skills[card.cardId]=R.defaultSkills(m.state,card.cardId);for(const slot of ['weapon','outfit','charm','relic']){const item=R.makeGear(m.state,`${themes[card.cardId]}-${slot}-epic`,7);m.state.gear.push(item);(m.state.equipment[card.cardId]??={})[slot]=item.id;}}
   m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);
   const node=m.state.run.nodes[0];node.kind='boss';node.enemies=['yarn-giant'];
   m.state.run.battle=R.createBattle({seed:7,chapter:1,cats:R.battleCats(m.state),enemies:['yarn-giant'],gameplayV4:true,skillsV5:true,gameplayA6:true,challengeLevel:6});m.state.settings.speed=1;m.paused=false;m.go('prepare');
  });
  const bossStartedAt=Date.now();
  await page.getByRole('button',{name:/^Fight/}).click();
  await page.waitForFunction(()=>window.__depthReview.sceneReady,null,{timeout:90000});
  const seen={ultimate:false,combo:false,boss:false,phases:[]},started=Date.now();
  while(Date.now()-started<300000){
   stop();
   const active=await page.evaluate(()=>window.__depthReview.showBattle);if(!active)break;
   const phase=await page.locator('.uv-boss small').textContent();
   const phaseNumber=Number(phase?.match(/Phase (\d)/)?.[1]);
   if(phaseNumber>=2&&!seen.phases.includes(phaseNumber)){
    await expect(page.locator('.dp-boss-phase')).toContainText(`Phase ${phaseNumber}`);
    if(part==='phase'){await page.getByRole('button',{name:'Pause auto',exact:true}).click();await shot(`boss-phase${phaseNumber}`);await page.getByRole('button',{name:'Resume auto',exact:true}).click();}
    seen.phases.push(phaseNumber);
    if(part==='phase'&&phaseNumber===3)break;
   }
   if(part==='phase'){await page.waitForTimeout(100);continue;}
   if(!seen.boss&&Date.now()-started>1500){await shot('boss-battle',true);seen.boss=true;}
   for(const [key,selector] of [['ultimate','.a6-ultimate-cutin'],['combo','.a6-combo-banner']]){
    if(!seen[key]&&await page.locator(selector).isVisible()){
     seen[`${key}AtSeconds`]=(Date.now()-started)/1000;
     await shot(key,true);seen[key]=true;
    }
   }
   await page.waitForTimeout(100);
  }
  battles.push({width,...seen,seconds:(Date.now()-started)/1000,result:await page.evaluate(()=>window.__depthReview.battle?.result)});
  if(part==='phase'){if(!seen.phases.includes(2)||!seen.phases.includes(3))throw Error('Missing real boss threshold');await context.close();continue;}
  if(!seen.ultimate)throw Error('Final boss fixture did not show an automatic ultimate');
  await page.locator('.uv-result').waitFor({timeout:30000});await shot('result');
  if(width===1440&&Date.now()-bossStartedAt<65000)await page.waitForTimeout(65000-(Date.now()-bossStartedAt));
  // This defeat is an explicit UI fixture, not a measured earned-player loss.
  await page.evaluate(()=>{const m=window.__depthReview;m.watching=false;m.plan=null;m.battle.result='enemy';m.screen='result';m.notify(false);});
  await page.getByRole('region',{name:'Your next change'}).waitFor();await page.waitForTimeout(1000);await shot('controlled-loss');
  await context.close();
  if(video)battles.at(-1).video={path:await video.path(),startOffsetSeconds:(bossStartedAt-videoStartedAt)/1000,note:'Real automatic fixture battle; continuous playback during boss, ultimate and combo captures.'};
 }
 await writeFile(root+`/reports/cardrpg-a6/final-${part}-screens.json`,JSON.stringify({fixture:'Reviewer-granted roster/progression for screen coverage; boss actions run automatically; loss is controlled. Earned progression is measured separately.',shots,battles,accessibility,errors},null,2)+'\n');
 console.log(JSON.stringify({shots:shots.length,battles,accessibility,errors,layoutErrors:shots.filter(s=>s.overflow||s.broken)}));
 if(errors.length||shots.some(s=>s.overflow||s.broken)||accessibility.some(a=>!a.reducedMap||!a.focusVisible))process.exitCode=1;
}finally{clearTimeout(lease);await browser.close();}
