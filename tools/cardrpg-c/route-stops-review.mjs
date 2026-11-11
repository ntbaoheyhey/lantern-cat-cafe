/** Isolated route-stop UI fixtures; no real saves or acceptance seeds. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-stops-final');await mkdir(output,{recursive:true});
const selected=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',');
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height] of [[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{window.__stopsR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.run=null;m.go('map');return JSON.stringify(m.state);},root);
 for(const kind of ['shop-cap','shop-short','shop-both','shop-tonic','shop-charm','shop-leave','shop-legacy','camp-heal','camp-upgrade','camp-capped','camp-full']){
  if(selected&&!selected.includes(kind))continue;
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const shop=kind.startsWith('shop');
  if(kind==='shop-legacy'){await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&ui=legacy');await page.waitForFunction(()=>!!window.__depthReview);await page.evaluate(async root=>{window.__stopsR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');},root);}
  else if(kind==='camp-heal'){await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();await page.evaluate(async root=>{window.__stopsR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');},root);}
  const expected=await page.evaluate(({fixture,kind,shop})=>{
   const R=window.__stopsR,m=window.__depthReview;m.offline=true;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';m.start(1,'campaign',1);
   const run=m.state.run;run.current=run.nodes.find(n=>n.kind===(shop?'shop':'campfire')).id;run.points=kind==='shop-short'||kind==='shop-both'?35:45;run.supplies=['shop-cap','shop-both','shop-legacy'].includes(kind)?5:2;
   if(kind==='shop-legacy'){run.gameplayV4=false;run.gameplayA6=false;m.state.gameplayV4=false;m.state.gameplayA6=false;}
   if(kind==='camp-heal'||kind==='camp-upgrade'){run.hp.mochi-=43;run.hp.soot=0;}
   const skills=m.state.team.flatMap(id=>R.defaultSkills(m.state,id)),skill=skills[1];
   if(kind==='camp-upgrade')run.upgrades[skill]=1;
   if(kind==='camp-capped')for(const id of skills)run.upgrades[id]=3;
   const choice=kind==='shop-charm'?R.shopStock(run)[0]:kind==='shop-leave'?'leave':shop?'tonic':kind==='camp-upgrade'?'upgrade':'heal';
   m.state.v4.journey.pending=[];m.go('map');const command=R.resolveNode(m.state,choice,skill);
   return{before:JSON.stringify(m.state),ok:command.ok,state:command.state,choice,skill,tonicOk:R.resolveNode(m.state,'tonic').ok,heal:R.resolveNode(m.state,'heal'),name:kind==='shop-charm'?R.BOON_BY_ID[choice].name:null};
  },{fixture,kind,shop});
  const panel=page.locator(shop?'.dp-route-shop':'.dp-route-campfire');await expect(panel).toBeVisible();
  if(kind==='camp-upgrade')await page.getByRole('combobox',{name:'Campfire skill'}).selectOption(expected.skill);
  if(shop){
   expect(await page.getByRole('button',{name:'Buy route tonic · 45 points',exact:true}).isEnabled()).toBe(expected.tonicOk);
   if(['shop-short','shop-both'].includes(kind))await expect(panel).toContainText('Need 10 more for a purchase.');
   if(['shop-cap','shop-both'].includes(kind))await expect(panel).toContainText('5/5. At the carrying limit.');
   if(kind==='shop-legacy')await expect(panel).toContainText('Route tonics: 5 → 6.');
  }else{
   const rows=JSON.parse(expected.before).run.hp;
   for(const [id,before] of Object.entries(rows)){const after=expected.heal.state.run.hp[id];await expect(page.getByRole('region',{name:'Campfire recovery'})).toContainText(`${before} → ${after} HP (+${after-before})`);}
   if(kind==='camp-upgrade')await expect(panel).toContainText('Rank 1 → 2/3 · effect power +12% → +24%');
   if(kind==='camp-capped')await expect(page.getByRole('button',{name:'Strengthen skill',exact:true})).toBeDisabled();
  }
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  report.checks.push({width,kind,readOnly:true,eligibility:true,exactPreview:true});
  await panel.evaluate(el=>el.scrollIntoView({block:'center'}));await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await panel.evaluate(el=>{const bounds=(el.closest('.a6-route-activity')??document.querySelector('#depth-main')).getBoundingClientRect(),host={top:Math.max(0,bounds.top),bottom:Math.min(innerHeight,bounds.bottom),left:bounds.left,right:bounds.right},r=el.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,panelFits:r.top>=host.top-1&&r.bottom<=host.bottom+1&&r.left>=host.left&&r.right<=host.right,controlBounds:[...el.querySelectorAll('button,select')].map(b=>({text:b.textContent,rect:b.getBoundingClientRect().toJSON(),scroll:b.scrollWidth,client:b.clientWidth})),host,controlsFit:[...el.querySelectorAll('button,select')].every(b=>{const a=b.getBoundingClientRect();return a.top>=host.top&&a.bottom<=host.bottom&&a.left>=host.left&&a.right<=host.right&&b.scrollWidth<=b.clientWidth+1;})};});
  const png=`/tmp/cardrpg-c-stops-${width}.png`,file=`${width}-${kind}.webp`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,kind,file,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);expect(audit.panelFits,file).toBe(true);expect(audit.controlsFit,file).toBe(true);
  if(expected.ok){
   const button=shop?kind==='shop-charm'?panel.getByRole('button',{name:new RegExp(expected.name)}):page.getByRole('button',{name:kind==='shop-leave'?'Keep points and leave':'Buy route tonic · 45 points',exact:true}):page.getByRole('button',{name:kind==='camp-upgrade'?'Strengthen skill':kind==='camp-heal'?'Heal the crew':'Continue at full HP',exact:true});
   await button.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.state);expect(await page.evaluate(()=>window.__depthReview.error)).toBe(false);
   await expect(panel).toBeHidden();report.checks.push({width,kind,keyboard:true,exactCommand:true,stopClosed:true});
  }
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
