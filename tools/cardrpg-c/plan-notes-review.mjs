/** Readable tactical labels must describe stored decisions, independent of the current plan setting. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-plan-notes';await mkdir(output,{recursive:true});
const report={cases:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
const plans=[['finish','steady','Weak foes','Steady',45],['finish','protect','Weak foes','Protect',65],['support','steady','Their support','Steady',45],['support','protect','Their support','Protect',65],['leader','steady','Their leader','Steady',45],['leader','protect','Their leader','Protect',65]];
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const legacy of[false,true])for(const[focus,care,target,label,threshold]of plans){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const receipt=await page.evaluate(async({root,reduced,legacy,focus,care})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917286,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   const b=R.createBattle({...m.battle.initial,seed:917286,gameplayA6:!legacy,skillsV5:!legacy,plan:{focus,care},enemies:['button-guard']});
   const choice=R.legalChoices(b)[0],acted=R.act(b,choice),decision=b.v4.events.find(event=>event.kind==='plan-target');
   // A partial historical receipt must keep its text rather than inventing an action.
   b.v4.events.push({...decision,sequence:100,reason:'',text:'An older recorded choice without a reason.'});
   m.state.v4.plan={focus:focus==='finish'?'leader':'finish',care:care==='steady'?'protect':'steady'};
   m.state.run.battle=b;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('result');return{acted,decision,events:b.v4.events};
  },{root,reduced,legacy,focus,care});expect(receipt.acted).toBe(true);
  const trigger=page.getByRole('button',{name:'Read details'});await trigger.waitFor();await page.evaluate(()=>document.fonts.ready);
  const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__depthReview.state));const before=await snapshot();await trigger.click();
  const panel=legacy?page.locator('.uv-advanced'):page.getByRole('dialog',{name:'Battle details'});
  if(!legacy)await panel.getByRole('button',{name:'Battle notes',exact:true}).click();
  const summary=panel.locator('summary').filter({hasText:'Round-by-round notes'}),notes=summary.locator('..');await summary.focus();await page.keyboard.press('Enter');
  await expect(notes.locator(':scope > p')).toHaveText(`Recorded plan · Target: ${target}. Care: ${label} — prefer support below ${threshold}% HP.`);
  const expected=receipt.events.map(event=>`Round ${event.round} · ${event.kind==='plan-target'&&event.reason?`${target} · ${label}: ${event.reason}`:event.text}`);
  expect(await notes.locator('li').allTextContents()).toEqual(expected);
  await expect(notes).not.toContainText(`${focus}/${care} plan:`);await expect(notes).toContainText('An older recorded choice without a reason.');
  const region=legacy?page.locator('.uv-sheet-content'):panel.getByRole('region',{name:'Battle report content'});
  const note=notes.locator(':scope > p');await note.scrollIntoViewIfNeeded();await summary.focus();
  const geometry=await notes.evaluate(el=>{const body=el.closest('.a6-result-report-body')??el.closest('.uv-sheet-content'),b=body.getBoundingClientRect(),p=el.querySelector('p').getBoundingClientRect(),s=el.querySelector('summary').getBoundingClientRect();return{headerFits:p.left>=b.left&&p.right<=b.right&&p.top>=b.top&&p.bottom<=b.bottom,focusFits:s.top>=b.top&&s.bottom<=b.bottom,horizontalOverflow:body.scrollWidth>body.clientWidth+1,nestedScroll:el.scrollHeight>el.clientHeight+1};});
  expect(geometry).toEqual({headerFits:true,focusFits:true,horizontalOverflow:false,nestedScroll:false});
  if(reduced&&((!legacy&&(focus==='finish'&&care==='steady'||focus==='leader'&&care==='protect'))||(legacy&&focus==='support'&&care==='protect'))){
   const name=`${width}-${legacy?'legacy':'current'}-${focus}-${care}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,width,height,legacy,focus,care});
  }
  expect(await snapshot()).toBe(before);
  if(legacy){await trigger.click();await expect(panel).toHaveCount(0);}else{await region.focus();await page.keyboard.press('End');await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();}
  report.cases.push({width,height,reduced,legacy,focus,care,version:receipt.decision.version,notes:expected,...geometry,readOnly:true,keyboard:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
