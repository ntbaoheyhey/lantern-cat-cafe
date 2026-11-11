/** Skill catalogue/preview timing and route-rank context, on isolated accounts. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-skill-context';
const supplement=process.argv.includes('--supplement');
const report={checks:[],shots:[],errors:[],complete:false};await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__skillR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');},root);
 const cats=await page.evaluate(()=>window.__skillR.CATS.map(c=>({id:c.id,name:c.name,skills:c.skills.map(s=>({...s,cooldown:window.__skillR.kitSkillV5(s).cooldown,description:window.__skillR.kitSkillV5(s).description}))})));
 const setup=async mode=>page.evaluate(mode=>{
  const m=window.__depthReview,R=window.__skillR;m.offline=true;m.state=R.setGameplayA6(R.createDepthAccount(826116,0),true);
  m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;
  if(mode!=='fresh'){
   const started=R.startRun(m.state,1,826116);if(!started.ok)throw Error(started.error);m.state=started.state;
   m.state.run.upgrades={'soot-2':2,'mochi-4':3};if(mode==='complete')m.state.run.complete=true;
  }
  R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.cardId='mochi';m.go('collection');return JSON.stringify(m.state);
 },mode);
 const capture=async(name,preview=false)=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const host=page.locator(preview?'.a6-cat-preview-dialog':'.a6-cat-detail');
  await host.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
  const audit=await page.evaluate(preview=>{
   const container=document.querySelector(preview?'.a6-cat-preview-dialog':'.uv-sheet-content').getBoundingClientRect();
   const note=document.querySelector(preview?'.a6-preview-copy':'.a6-cat-skill-detail');
   const fits=el=>{const r=el.getBoundingClientRect();return r.top>=container.top-1&&r.bottom<=container.bottom+1&&r.left>=container.left-1&&r.right<=container.right+1;};
   const controls=[...document.querySelectorAll(preview?'.a6-preview-header button,.a6-preview-notes>nav>button':'.a6-cat-tabs button,.a6-cat-skill-index button,.a6-cat-preview')];
   return{overflow:document.documentElement.scrollWidth>innerWidth,noteFits:fits(note),controlsFit:controls.every(fits),noteHeight:note.clientHeight,noteTotal:note.scrollHeight,noteTop:note.scrollTop,stageHeight:preview?document.querySelector('.a6-preview-stage>.dp-miniature').clientHeight:null,focus:document.activeElement?.getAttribute('aria-label')??document.activeElement?.textContent?.slice(0,80)};
  },preview);
  const file=`${width}-${name}.webp`,png='/tmp/cardrpg-c-skill-context.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);report.shots.push({file,width,name,preview,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.noteFits,file+' note').toBe(true);expect(audit.controlsFit,file+' controls').toBe(true);expect(audit.noteHeight,file+' readable area').toBeGreaterThanOrEqual(90);if(preview)expect(audit.stageHeight,file+' preview stage').toBeGreaterThan(200);
  if(name.endsWith('-home'))expect(audit.noteTop,file+' scroll home').toBe(0);
  if(name.endsWith('-end'))expect(audit.noteTotal-audit.noteHeight-audit.noteTop,file+' scroll end').toBeLessThanOrEqual(1);
 };
 const select=async(cat,skill)=>{
  await page.locator('.uv-cat-grid').getByRole('button',{name:new RegExp('^'+cat.name+',')}).click();
  const detail=page.getByRole('complementary',{name:'Cat details'});await detail.getByRole('button',{name:'Skills',exact:true}).click();
  await detail.getByRole('navigation',{name:cat.name+' skills'}).getByRole('button',{name:new RegExp(skill.name)}).click();return detail.getByRole('region',{name:skill.name,exact:true});
 };
 let before=await setup('fresh');await page.getByRole('button',{name:'Discover all',exact:true}).click();
 for(const cat of cats){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  for(const skill of supplement?cat.skills.filter(s=>s.type==='ultimate'):cat.skills){
   const note=await select(cat,skill);await expect(note).toContainText(skill.description);await expect(note).toContainText(skill.cooldown?`Wait ${skill.cooldown} round${skill.cooldown===1?'':'s'} after use.`:'Can be used every round.');await expect(note).toContainText('Base effects shown.');
   if(supplement){await expect(note.locator('.a6-cat-passive')).toContainText('PASSIVE');await note.focus();await page.keyboard.press('Home');await expect.poll(()=>note.evaluate(el=>el.scrollTop)).toBe(0);await capture('fresh-'+skill.id+'-home');report.checks.push({width,skill:skill.id,home:true,passiveRetained:true});continue;}
   expect(await note.evaluate(el=>el.scrollTop)).toBe(0);await note.focus();await page.keyboard.press('End');await expect.poll(()=>note.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(1);
   if(skill.type==='ultimate'||['soot-2','inkcap-1'].includes(skill.id))await capture('fresh-'+skill.id+'-end');
   await page.keyboard.press('Home');await expect.poll(()=>note.evaluate(el=>el.scrollTop)).toBe(0);
   report.checks.push({width,skill:skill.id,cooldown:skill.cooldown,keyboardNote:true});
  }
 }
 expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);report.checks.push({width,mode:'fresh',readOnly:true});
 for(const[catId,skillId]of supplement?[]:[['soot','soot-2'],['cinnamon','cinnamon-4']]){
  const cat=cats.find(c=>c.id===catId),skill=cat.skills.find(s=>s.id===skillId),note=await select(cat,skill);
  await note.focus();await page.keyboard.press('Tab');const watch=page.getByRole('button',{name:'Watch skill previews'});await expect(watch).toBeFocused();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:cat.name+' · skill previews'});await expect(dialog).toBeVisible();await page.waitForFunction(()=>window.__depthPreviewScene?.ready);await expect(page.locator('.a6-preview-stage .dp-miniature-loading')).toHaveCount(0);
  const copy=dialog.getByRole('region',{name:skill.name,exact:true});await expect(copy).toContainText(skill.description);await copy.focus();await page.keyboard.press('End');await expect.poll(()=>copy.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(1);await capture('preview-'+skillId+'-end',true);
  await page.keyboard.press('Home');await expect.poll(()=>copy.evaluate(el=>el.scrollTop)).toBe(0);await capture('preview-'+skillId+'-home',true);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(watch).toBeFocused();expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);report.checks.push({width,skill:skillId,preview:true,keyboard:true,readOnly:true,returnFocus:true});
 }
 for(const mode of['active','complete']){
  before=await setup(mode);const cat=cats.find(c=>c.id==='soot'),skill=cat.skills[1],note=await select(cat,skill);
  if(mode==='active')await expect(note).toContainText('Your patrol rank 2 adds 40% effect power.');else await expect(note).not.toContainText('Your patrol rank');
  await note.focus();await page.keyboard.press('End');await expect.poll(()=>note.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(1);await capture(mode+'-rank-end');await page.keyboard.press('Home');await expect.poll(()=>note.evaluate(el=>el.scrollTop)).toBe(0);await capture(mode+'-rank-home');
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);report.checks.push({width,mode,rank:true,readOnly:true});
  if(mode==='active'){
   const watch=page.getByRole('button',{name:'Watch skill previews'});await watch.click();await page.waitForFunction(()=>window.__depthPreviewScene?.ready);await expect(page.locator('.a6-preview-stage .dp-miniature-loading')).toHaveCount(0);
   const copy=page.locator('.a6-preview-copy');await expect(copy).toContainText('Your patrol rank 2 adds 40% effect power.');await capture('active-rank-preview-home',true);
   await page.keyboard.press('Escape');await expect(watch).toBeFocused();expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);report.checks.push({width,mode,previewRank:true,readOnly:true});
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
