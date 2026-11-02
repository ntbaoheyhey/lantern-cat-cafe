import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [root, head, proofPath, out] = process.argv.slice(2); assert.ok(root && head && proofPath && out);
const site='https://taskbarhero-eight.vercel.app/';
const proof=JSON.parse(await readFile(proofPath,'utf8'));
assert.equal(proof.status,'ARTIFACT_MATCH');assert.equal(proof.expectedHead,head);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),head);
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),'');
const {chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sha=x=>createHash('sha256').update(x).digest('hex');
const safeUrl=u=>{try{const v=new URL(u);return v.origin+v.pathname;}catch{return '[invalid URL]';}};
const redact=x=>String(x).replace(/https?:\/\/[^\s"')]+/g,safeUrl).replace(/(?:Bearer\s+|eyJ)[A-Za-z0-9._-]+/g,'[redacted]');
const source={head,tree:proof.testedTree,role:'Clean exact-main checkout; production bytes match an in-memory build of this head'};
const results=[];await mkdir(out,{recursive:false});
const browser=await chromium.launch({headless:true});
try{
for(const [width,height] of [[1280,720],[1600,900]]){
 const dir=out+'/'+width+'x'+height;await mkdir(dir);
 const result={viewport:{width,height},source,deployment:{head,identityMethod:'Fresh production asset hashes match the exact-main in-memory build',artifactProof:proofPath},phase:'merged-core-plus-hero-help',fullNineStagePass:false,startedAt:new Date().toISOString(),steps:[],errors:[],responses:[],transactionsPerformed:0,guestOnly:true};
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(20000);
 const err=(kind,message)=>result.errors.push({kind,message:redact(message)});
 page.on('console',m=>{if(m.type()==='error')err('console',m.text());});page.on('pageerror',e=>err('page',e.message));
 page.on('requestfailed',r=>err('request-failed',safeUrl(r.url())+' '+r.failure()?.errorText));
 page.on('response',r=>{result.responses.push({url:safeUrl(r.url()),status:r.status()});if(r.status()>=400)err('http',r.status()+' '+safeUrl(r.url()));});
 await context.route('**/*',async route=>{if(['GET','HEAD','OPTIONS'].includes(route.request().method()))await route.continue();else{err('blocked-write',route.request().method()+' '+safeUrl(route.request().url()));await route.abort();}});
 const visible=async l=>{await expect(l).toBeVisible();await expect(l).toBeInViewport();};
 const click=async l=>{await visible(l);await expect(l).toBeEnabled();await l.click();};
 const id=n=>page.getByTestId(n),tab=n=>page.getByRole('tab',{name:n,exact:true});
 const xp=()=>id('hud-level-xp').getByRole('progressbar',{name:'Experience'});let beforeXp;let guestDisclosure='';
 const started=Date.now();
 const actions={
 landing:async()=>{const r=await page.goto(site,{waitUntil:'domcontentloaded'});assert.ok(r?.ok());const html=await r.text();result.identity={htmlSha256:sha(html),entryScripts:await page.locator('script[src]').evaluateAll(es=>es.map(e=>e.getAttribute('src'))),etag:r.headers().etag??null};assert.equal(result.identity.htmlSha256,proof.htmlStartSha256);for(const p of result.identity.entryScripts)assert.ok(proof.liveEntries.includes(p));guestDisclosure=await page.locator('body').innerText();const help=page.getByRole('dialog',{name:'How to play',exact:true});if(await help.isVisible())await click(page.getByRole('button',{name:'Close help',exact:true}));await visible(id('class-picker'));return {scope:'Current class-picker entry; no future landing CTA claim.'};},
 guest:async()=>{await visible(id('class-picker'));assert.match(guestDisclosure+' '+await page.locator('body').innerText(),/guest|demo|preview/i);return {scope:'Fresh unauthenticated context; guest/preview disclosure observed before dismissing initial help.',disclosure:guestDisclosure};},
 class:async()=>{await click(id('class-card-warrior'));await click(id('class-picker-choose-button'));await click(id('class-picker-confirm-button'));await visible(id('home-dashboard'));await expect(id('home-hero-card')).toContainText('Warrior');await visible(page.locator('canvas').first());beforeXp=Number(await xp().getAttribute('aria-valuenow'));return {xpBefore:beforeXp};},
 'idle-loop':async()=>{await expect.poll(async()=>Number(await xp().getAttribute('aria-valuenow')),{timeout:35000}).toBeGreaterThan(beforeXp);await expect(id('home-event-log')).toContainText(/gathered [1-9]\d* Fish|leveled up|Advanced to Chapter/);return {xpBefore:beforeXp,xpAfter:Number(await xp().getAttribute('aria-valuenow')),scope:'Real guest idle reward; no clock/state injection.'};},
 boss:async()=>{await click(tab('Map'));await visible(page.getByRole('region',{name:'Boss Gate',exact:true}));const fight=page.getByRole('button',{name:'Fight',exact:true});await visible(fight);await expect(fight).toBeDisabled();await visible(id('block-reason-boss'));assert.match(await id('block-reason-boss').innerText(),/\S/);return {scope:'Locked boss with visible reason; no victory claimed.'};},
 forge:async()=>{await click(tab('Forge'));await click(id('tab-craft'));await visible(id('craft-panel'));assert.match(await id('craft-panel').innerText(),/recipe|craft/i);const action=id('craft-btn');await action.scrollIntoViewIfNeeded();await visible(action);await expect(action).toBeDisabled();return {scope:'Current recipe and shortage action; no funded crafting or mint.',actionBounds:await action.boundingBox()};},
 bag:async()=>{await click(tab('Bag'));await visible(id('bag-screen'));const items=page.getByRole('list',{name:'Bag items',exact:true});await visible(items);await click(items.getByRole('button').first());await visible(page.getByRole('region',{name:'Item detail',exact:true}));return {scope:'Earned guest loot list and selected item detail.'};},
 market:async()=>{await click(tab('Market'));const panel=page.getByRole('tabpanel',{name:'Market',exact:true});await visible(panel);await expect(panel).toContainText('Connect your wallet to see');return {scope:'Current guest wallet requirement; no trading or wallet connection.'};}
 };
 actions.hero=async()=>{await click(tab('Hero'));const hero=page.getByRole('region',{name:'Character',exact:true});await visible(hero);await expect(hero.getByRole('group',{name:'Gear slots'}).getByRole('button')).toHaveCount(9);await visible(id('character-power'));const change=hero.getByRole('button',{name:'Change class',exact:true});await change.focus();await click(change);const dialog=page.getByRole('dialog',{name:'Change class',exact:true});await visible(dialog);await expect(page.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(change).toBeFocused();assert.equal(await page.locator('#root').getAttribute('inert'),null);assert.notEqual(await page.locator('#root').getAttribute('aria-hidden'),'true');return {scope:'Real guest Hero, nine slots, power and modal open/Escape/focus restoration; no class change request.'};};
 actions.help=async()=>{await click(tab('Help'));const panel=page.getByRole('tabpanel',{name:'Help',exact:true});await visible(panel);const search=panel.getByRole('searchbox',{name:'Search help'});await search.fill('30 Yarn');await expect(panel.getByRole('heading',{level:3})).toHaveText('Forge');await search.fill('Warrior: sword');await expect(panel.getByRole('heading',{level:3})).toHaveText('Classes');await click(panel.getByRole('button',{name:'Start Exploring',exact:true}));await visible(id('home-dashboard'));return {scope:'Live phrase search and primary return-to-Home action.'};};
 for(const [name,action] of Object.entries(actions)){
  const step={name,status:'PASS',startedAt:new Date().toISOString()};
  try{assert.ok(Date.now()-started<180000);step.detail=await action();assert.deepEqual(result.errors,[]);step.layout=await page.evaluate(()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,height:innerHeight,docHeight:document.documentElement.scrollHeight}));assert.ok(step.layout.docWidth<=width);await page.screenshot({path:dir+'/'+name+'.png',fullPage:false});await writeFile(dir+'/'+name+'.txt',redact(await page.locator('body').innerText()));assert.deepEqual(result.errors,[]);assert.ok(Date.now()-started<180000);}
  catch(e){step.status='FAIL';step.error=redact(e.message);try{await page.screenshot({path:dir+'/'+name+'-FAIL.png'});}catch{}}
  result.steps.push(step);console.log(width+'x'+height+' '+name+' '+step.status);if(step.status==='FAIL')break;
 }
 result.status=result.steps.length===10&&result.steps.every(s=>s.status==='PASS')&&result.errors.length===0?'PASS':'FAIL';result.endedAt=new Date().toISOString();
 await writeFile(dir+'/result.json',JSON.stringify(result,null,2)+'\n');results.push(result);await context.close();
 if(result.responses.some(r=>r.status===429))break;
}
}finally{await browser.close();}
const summary={status:results.length===2&&results.every(r=>r.status==='PASS')?'PASS':'FAIL',method:'Direct Playwright, fresh guest contexts and real UI actions; no state injection or write requests',source,deploymentProof:proofPath,phaseAuthority:'Merged-core plus Hero/Help release check; not the future on-chain nine-stage demo gate',results};
await writeFile(out+'/summary.json',JSON.stringify(summary,null,2)+'\n');process.exitCode=summary.status==='PASS'?0:1;
