import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const {gear,equipment,team,cards}=JSON.parse(await readFile(root+'/reports/cardrpg-c/checks/clean-live-build-observation.json','utf8'));
const output=root+'/reports/cardrpg-c/shots/c11-equipment';await mkdir(output,{recursive:true});
const report={fixture:'Controlled UI fixture copies observed owned gear and crew into a separate review account. No combat replay, balance tuning or recovery claim.',shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
for(const [width,height] of [[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text())});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async data=>{
  window.__equipRules=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
  const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;
  m.state.gear=data.gear;m.state.equipment=data.equipment;m.state.team=data.team;
  m.state.account.cards=m.state.account.cards.filter(c=>data.cards.some(x=>x.id===c.cardId));
  for(const card of m.state.account.cards){const found=data.cards.find(x=>x.id===card.cardId);card.level=found.level;card.stars=found.stars;}
  m.state.v4.journey.pending=[];return JSON.stringify(m.state);
 },{gear,equipment,team,cards});
 const capture=async name=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
  const region=page.getByRole('region',{name:'Quick upgrades'});await expect(region).toBeInViewport({ratio:1});
  await expect(region.getByRole('button',{name:'Auto-equip best gear'})).toBeInViewport({ratio:1});
  const note=region.locator('.a6-equip-action small');await expect(note).toBeInViewport({ratio:1});
  const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,note:document.querySelector('.a6-equip-action small').textContent,quickRect:(()=>{const r=document.querySelector('.a6-quick-upgrade').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()}));
  if(metrics.overflow||metrics.broken)throw Error(JSON.stringify(metrics));
  const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-equipment-${width}-${name}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','82',tmp,'-o',output+'/'+file]);report.shots.push({name,width,height,file,...metrics});
 };
 for(const screen of ['collection','team','inventory']){
  const expected=await page.evaluate(({fixture,screen})=>{const m=window.__depthReview,R=window.__equipRules;m.state=JSON.parse(fixture);m.cardId='sorrel';m.go(screen);const result=R.autoEquipA6(m.state);if(!result.ok)throw Error(result.error);return{equipment:result.state.equipment,power:Math.round(R.teamPowerV4(result.state)),gain:Math.round(R.teamPowerV4(result.state))-Math.round(R.teamPowerV4(m.state)),currencies:JSON.stringify(m.state.account.currencies)};},{fixture,screen});
  const region=page.getByRole('region',{name:'Quick upgrades'}),button=region.getByRole('button',{name:'Auto-equip best gear'});
  await expect(button).toBeEnabled();await expect(region.locator('.a6-equip-action small')).toHaveText(`Free · +${expected.gain.toLocaleString('en-US')} Power · owned gear`);
  await capture(screen+'-available');
  await button.click();await expect(button).toBeDisabled();await expect(region.locator('.a6-equip-action small')).toHaveText('No stronger gear available');
  const actual=await page.evaluate(()=>{const m=window.__depthReview;return{equipment:m.state.equipment,currencies:JSON.stringify(m.state.account.currencies),power:Math.round(window.__equipRules.teamPowerV4(m.state))};});
  if(JSON.stringify(actual.equipment)!==JSON.stringify(expected.equipment)||actual.currencies!==expected.currencies||actual.power!==expected.power)throw Error('Equipment click differed from preview or spent currencies.');
  report.shots.at(-1).click={exactPreview:true,currenciesUnchanged:true,power:actual.power,gain:expected.gain};
  if(screen==='team')await capture('team-equipped');
 }
 await page.evaluate(fixture=>{const m=window.__depthReview;m.state=JSON.parse(fixture);m.start(1,'campaign',1);m.go('collection');},fixture);
 const region=page.getByRole('region',{name:'Quick upgrades'});await expect(region.getByRole('button',{name:'Auto-equip best gear'})).toBeDisabled();await expect(region.locator('.a6-equip-action small')).toHaveText('After this route');await capture('collection-locked');
 await page.close();
}
if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log(JSON.stringify({complete:report.complete,shots:report.shots.length,errors:report.errors}));
