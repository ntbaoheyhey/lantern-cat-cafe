/** Public route decisions on isolated accounts; no balance/acceptance seed runs. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-events-final');await mkdir(output,{recursive:true});
const selected=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',');
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height] of [[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const {fixture,cases}=await page.evaluate(async root=>{window.__eventsR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');const R=window.__eventsR,m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.run=null;m.go('map');return{fixture:JSON.stringify(m.state),cases:[...R.EVENTS.flatMap(event=>event.choices.map(c=>({kind:event.id+'-'+c.id,event:event.id,choice:c.id}))),{kind:'short',event:'chipped-cup',choice:'mend'},{kind:'cap',event:'chipped-cup',choice:'mend'},{kind:'full',event:'chipped-cup',choice:'share'},...['points','charm','empty'].map(c=>({kind:'treasure-'+c,event:null,choice:c==='empty'?'points':c}))]};},root);
 for(const spec of cases){
  if(selected&&!selected.includes(spec.kind))continue;
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,spec})=>{
   const R=window.__eventsR,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';m.start(1,'campaign',1);
   const run=m.state.run,node=run.nodes.find(n=>n.kind===(spec.event?'event':'treasure'));run.current=node.id;if(spec.event)node.eventId=spec.event;run.points=spec.kind==='short'?7:35;run.hp.mochi-=43;run.hp.soot=0;run.hp.clover=1;
   if(spec.kind==='cap')run.boons['shelter-3']=2;if(spec.kind==='full')for(const cat of R.battleCats(m.state))run.hp[cat.id]=cat.stats.hp;if(spec.kind==='treasure-empty')for(const boon of R.BOONS)run.boons[boon.id]=boon.cap;
   m.state.v4.journey.pending=[];m.go('map');const offered=R.shopStock(run)[0];
   const choices=spec.event?R.EVENTS.find(e=>e.id===spec.event).choices:[{id:'points',label:'Take 70 run points'},{id:'charm',label:offered?'Take '+R.BOON_BY_ID[offered].name:'No charm available',boon:offered}];
   return{before:JSON.stringify(m.state),result:R.resolveNode(m.state,spec.choice),label:choices.find(c=>c.id===spec.choice).label,choices:choices.map(c=>{const result=R.resolveNode(m.state,c.id);return{label:c.label,boon:c.boon?R.boonForMode(c.boon,true):null,ok:result.ok,points:result.state.run.points,hp:result.state.run.hp};})};
  },{fixture,spec});
  const panel=page.locator(spec.event?'.dp-route-story':'.dp-route-treasure');await expect(panel).toBeVisible();
  const before=JSON.parse(expected.before);
  for(const choice of expected.choices){
   const card=page.getByRole('article',{name:choice.label,exact:true}),button=card.getByRole('button');expect(await button.isEnabled()).toBe(choice.ok);
   if(choice.ok){await expect(card).toContainText(`Run points: ${before.run.points} → ${choice.points}`);const changed=before.team.some(id=>before.run.hp[id]!==choice.hp[id]);if(changed)for(const id of before.team){const a=before.run.hp[id],b=choice.hp[id];await expect(card).toContainText(`${a} → ${b} HP (${b>=a?'+':''}${b-a})`);}else await expect(card).toContainText('Crew HP unchanged.');}
   if(choice.boon)await expect(card).toContainText(choice.boon.description);
  }
  if(spec.kind==='short')await expect(panel).toContainText('Need 18 more run points (7/25).');if(spec.kind==='cap')await expect(panel).toContainText('This charm is at its stacking cap.');
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);report.checks.push({width,kind:spec.kind,readOnly:true,allChoicesExact:true});
  await panel.evaluate(el=>el.scrollIntoView({block:'center'}));await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await panel.evaluate(el=>{const host=el.closest('.a6-route-activity').getBoundingClientRect(),r=el.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,panelFits:r.top>=host.top&&r.bottom<=host.bottom&&r.left>=host.left&&r.right<=host.right,controlsFit:[...el.querySelectorAll('button')].every(b=>{const a=b.getBoundingClientRect();return a.top>=host.top&&a.bottom<=host.bottom&&a.left>=host.left&&a.right<=host.right;}),rowsFit:[...el.querySelectorAll('li')].every(row=>row.scrollWidth<=row.clientWidth+1)};});
  const file=`${width}-${spec.kind}.webp`,png=`/tmp/cardrpg-c-events-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,kind:spec.kind,file,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);for(const key of ['panelFits','controlsFit','rowsFit'])expect(audit[key],file+' '+key).toBe(true);
  if(expected.result.ok){const button=page.getByRole('button',{name:expected.label,exact:true});await button.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.result.state);expect(await page.evaluate(()=>window.__depthReview.error)).toBe(false);await expect(panel).toBeHidden();report.checks.push({width,kind:spec.kind,keyboard:true,exactCommand:true,closed:true});}
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
