/** Saved-loadout UI versus the exact public commands; isolated review accounts only. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-saved-team-final');await mkdir(output,{recursive:true});
const report={method:'Saved crew/gear public-command previews and keyboard application on isolated fixtures. No combat or acceptance seeds.',checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async path=>{window.__savedTeamRules=await import(path);const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);m.state.run=null;m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.gear=[];m.state.equipment={};m.state.v4.loadouts=[null,null,null];m.state.v4.journey.pending=[];return JSON.stringify(m.state);},'/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
 const capture=async name=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(()=>{const dialog=document.querySelector('.a6-formation-tool'),footer=dialog.querySelector('.a6-saved-team-desk>footer').getBoundingClientRect(),box=dialog.getBoundingClientRect(),quote=dialog.querySelector('.a6-saved-team-impact')?.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,footerFits:footer.bottom<=Math.min(box.bottom,innerHeight)&&footer.top>=box.top,quoteFits:!quote||(quote.top>=box.top&&quote.bottom<=footer.top),dialogFits:box.top>=0&&box.bottom<=innerHeight};});
  const file=`${width}-${name}.webp`,png='/tmp/cardrpg-c-saved-team-'+width+'.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,height,file,...audit});expect(audit.overflow).toBe(false);expect(audit.broken).toBe(0);for(const k of ['footerFits','quoteFits','dialogFits'])expect(audit[k],name+' '+k).toBe(true);
 };
 for(const kind of ['transfer','lower','bench','dense','same','missing','empty','daily','tower','route','prepare','later-stop']){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind})=>{
   const m=window.__depthReview,R=window.__savedTeamRules;m.state=JSON.parse(fixture);m.tutorialBattle=null;m.replay=null;m.watching=false;m.plan=null;m.notice='';m.error=false;
   const mode=kind==='daily'?'daily':kind==='tower'?'tower':'campaign',slot={campaign:0,daily:1,tower:2}[mode];
   let seed=819210;const add=(cat,set,slot,rarity='epic')=>{const item=R.makeGear(m.state,`${set}-${slot}-${rarity}`,seed++);m.state.gear.push(item);m.state=R.equipGear(m.state,cat,item.id).state;return item.id;};
   if(kind==='dense')for(const [cat,set]of[['mochi','hearthloom'],['soot','moonwick'],['clover','mossbrew']])for(const slot of ['weapon','outfit','charm','relic'])add(cat,set,slot,slot==='weapon'?'legendary':'epic');
   else if(!['lower','empty'].includes(kind)){add('mochi','hearthloom','weapon','legendary');add('mochi','hearthloom','outfit');}
   if(kind!=='empty')m.state=R.saveLoadoutV4(m.state,slot,mode+' team').state;
   if(kind==='dense'){
    for(const[cat,donor]of[['mochi','velvet'],['soot','marigold'],['clover','tansy']])for(const id of Object.values(m.state.equipment[cat]))m.state=R.equipGear(m.state,donor,id).state;
   }else if(kind==='lower'){add('mochi','hearthloom','weapon','legendary');add('mochi','hearthloom','outfit');}
   else if(kind==='bench'){const id=m.state.equipment.mochi.weapon;m.state=R.equipGear(m.state,'velvet',id).state;add('velvet','hearthloom','outfit');}
   else if(!['empty','same'].includes(kind)){
    const id=m.state.equipment.mochi.weapon;m.state=R.equipGear(m.state,'soot',id).state;
    if(['missing','prepare'].includes(kind)){m.state=R.equipGear(m.state,'soot',null,'weapon').state;m.state=R.salvageGear(m.state,id).state;}
   }
   if(['route','prepare','later-stop'].includes(kind)){m.start(1,'campaign',1);if(kind!=='route')m.enter(R.availableNodes(m.state.run)[0].id);if(kind==='later-stop')m.state.run.visited=['0-0'];}
   m.state.v4.journey.pending=[];m.go(['prepare','later-stop'].includes(kind)?'prepare':'team');
   const state=m.state,saved=state.v4.loadouts[slot],preparing=['prepare','later-stop'].includes(kind),command=saved?(preparing?R.configurePreparation(state,saved.team,{...state.rows,...saved.rows},saved.plan):R.applyLoadoutV4(state,slot)):null;
   const equipment=command?.state.equipment,ok=!!command?.ok&&kind!=='later-stop';
   const snapshot=s=>({equipment:s.equipment,team:s.team,rows:s.rows,plan:s.v4.plan,currencies:s.account.currencies,power:Math.round(R.teamPowerV4(s)),seed:s.run?.battle?.seed,enemies:s.run?.battle?.initial.enemies});
   const effects=[];if(!preparing&&command?.ok)for(const{cardId}of state.account.cards){const old=R.equipmentEffects(state,cardId).effects,next=R.equipmentEffects(command.state,cardId).effects;for(const gain of [false,true])for(const effect of(gain?next:old).filter(e=>!(gain?old:next).includes(e))){const set=R.SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect),text=set?R.setTextV4(set,true):null;effects.push(`${R.CAT_BY_ID[cardId].name}${(gain?command.state:state).team.includes(cardId)?'':' (bench)'} ${gain?'gains':'loses'} ${set?`${set.name} · ${set.twoEffect===effect?2:4} pieces`:'unique effect'}. ${set?(set.twoEffect===effect?text.two:text.four):R.effectTextV4(effect)}`);}}
   const gear=[];if(!preparing&&command?.ok)for(const{cardId}of state.account.cards)for(const slot of['weapon','outfit','charm','relic'])if(state.equipment[cardId]?.[slot]!==equipment[cardId]?.[slot])gear.push({cat:cardId,slot});
   return {mode,slot,preparing,saved:!!saved,ok,command:command?.ok?snapshot(command.state):null,before:snapshot(state),error:command?.error,effects,gear,unchanged:JSON.stringify(state)};
  },{fixture,kind});
  await page.getByRole('button',{name:'Saved teams',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Saved teams'});await dialog.getByRole('combobox',{name:'Team mode'}).selectOption(expected.mode);
  const apply=dialog.getByRole('button',{name:`Use saved ${expected.mode} team`,exact:true}),quote=dialog.getByRole('region',{name:'Saved team changes'});
  await expect(apply).toBeInViewport({ratio:1});expect(await apply.isEnabled()).toBe(expected.ok);
  if(expected.preparing){await expect(dialog.getByText('Uses saved cats, rows and plan with their current gear.',{exact:true})).toBeVisible();await expect(quote).toHaveCount(0);}
  else if(expected.saved){
   await expect(quote).toBeVisible();if(expected.ok){await expect(quote.locator('.a6-saved-team-power strong')).toHaveText(`${expected.before.power.toLocaleString('en-US')} → ${expected.command.power.toLocaleString('en-US')}`);if(expected.gear.length)await expect(quote.locator('summary')).toHaveText(`${expected.gear.length} gear slots change · Review gear and bonuses`);else await expect(quote).toContainText('Gear and bonuses stay the same.');}
   else await expect(quote).toContainText(expected.error);
  }else await expect(quote).toHaveCount(0);
  await capture(kind);
  if(expected.gear.length){
   await quote.locator('summary').focus();await page.keyboard.press('Enter');await expect(quote.locator('details')).toHaveAttribute('open','');for(const text of expected.effects)await expect(quote).toContainText(text);
   expect(await quote.locator('details p').count()).toBe(expected.gear.length+expected.effects.length);
   await capture(kind+'-changes');await quote.locator('details p').last().scrollIntoViewIfNeeded();await expect(quote.locator('details p').last()).toBeInViewport({ratio:1});await expect(apply).toBeInViewport({ratio:1});
  }
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.unchanged);delete expected.unchanged;report.checks.push({width,kind,expected});
  if(expected.ok){
   await apply.focus();await page.keyboard.press('Enter');await expect(dialog).toHaveCount(0);
   const actual=await page.evaluate(()=>{const s=window.__depthReview.state,R=window.__savedTeamRules;return{equipment:s.equipment,team:s.team,rows:s.rows,plan:s.v4.plan,currencies:s.account.currencies,power:Math.round(R.teamPowerV4(s)),seed:s.run?.battle?.seed,enemies:s.run?.battle?.initial.enemies};});expect(actual).toEqual(expected.command);report.checks.push({width,kind,exactCommand:true});await expect(page.getByRole('button',{name:'Saved teams',exact:true})).toBeFocused();
  }else{await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Saved teams',exact:true})).toBeFocused();}
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors}));
