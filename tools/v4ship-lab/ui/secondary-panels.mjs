/** Secondary production UI coverage. LEARN/S11-secondary-panels.md. No screenshots. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {observeDocument} from './observe.mjs';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/secondary-panels-${attempt}.json`),rawPath=output.replace(/\.json$/,'.rows.json.gz');
assert(!existsSync(output)&&!existsSync(rawPath),'Preserve previous evidence');
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=v=>createHash('sha256').update(v).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');stop();
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-8.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
assert.equal(git(['diff','--name-only',build.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions']),'','Matching production source required');
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===build.indexSha256);
const candidate=process.env.V4_PANEL_CSS?readFileSync(resolve(root,process.env.V4_PANEL_CSS),'utf8'):null;
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
const report={at:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),buildPath,buildSourceCommit:build.sourceCommit,harnessSha256:hash(readFileSync(import.meta.filename)),observerSha256:hash(readFileSync(resolve(root,'tools/v4ship-lab/ui/observe.mjs'))),candidate:candidate?{path:process.env.V4_PANEL_CSS,sha256:hash(candidate)}:null,scope:'Landing, wallet dialog, audio mixer, every Economy/Odds tab, fees help and trailer. Headless Chromium; no wallet connections or transactions. Optional bounded production capture is recorded separately.',rows:[],profiles:[],pass:false};
const raw=[];
const save=()=>{writeFileSync(rawPath,gzipSync(JSON.stringify(raw)));report.raw={path:relative(root,rawPath),sha256:hash(readFileSync(rawPath))};writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
const safe=e=>String(e).replace(/0x[\da-f]{64,}/gi,'[hash]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,240);
const roles=new Set(['button','link','checkbox','slider','textbox','combobox','img','image','DisclosureTriangle']);
const summarize=dom=>({texts:dom.texts.length,proseWords:dom.proseWords,allVisibleWords:dom.allVisibleWords,scrollHidden:dom.scrollHidden.length,horizontalOverflow:dom.horizontalOverflow,contrastFailures:dom.texts.filter(t=>t.contrast==='fail').map(t=>({text:t.text,ratio:t.ratio,minimum:t.minimum})),contrastUnknown:dom.texts.filter(t=>t.contrast==='unknown').map(t=>({text:t.text,reason:t.unknownReason,effect:t.effect})),clipping:dom.texts.filter(t=>t.clipping.length).map(t=>({text:t.text,clipping:t.clipping})),brokenImages:dom.brokenImages});
async function inspect(page,cdp,width,phase,scopeSelector){
 stop();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
 const observations=await page.evaluate(({source,scopeSelector})=>{const observe=(0,eval)(`(${source})`);return {document:observe(),scope:observe({scopeSelector})};},{source:observeDocument.toString(),scopeSelector});
 const {root:documentRoot}=await cdp.send('DOM.getDocument');
 const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:documentRoot.nodeId,selector:scopeSelector});assert(nodeId);
 const {node}=await cdp.send('DOM.describeNode',{nodeId}),tree=await cdp.send('Accessibility.getFullAXTree'),byId=new Map(tree.nodes.map(n=>[n.nodeId,n]));
 const axRoot=tree.nodes.find(n=>n.backendDOMNodeId===node.backendNodeId);assert(axRoot,'Scope must be present in AX tree');
 const descendants=[];function visit(n){descendants.push(n);for(const id of n.childIds??[]){const child=byId.get(id);if(child)visit(child);}}visit(axRoot);
 const controls=descendants.filter(n=>!n.ignored&&roles.has(n.role?.value)).map(n=>({role:n.role.value,name:n.name?.value??'',disabled:n.properties?.find(p=>p.name==='disabled')?.value?.value??false}));
 const summary=summarize(observations.scope),row={width,phase,scopeSelector,...summary,controls:controls.length,unnamedControls:controls.filter(c=>!c.name.trim()),document:summarize(observations.document)};
 row.pass=!row.contrastFailures.length&&!row.contrastUnknown.length&&!row.clipping.length&&!row.brokenImages.length&&!row.unnamedControls.length&&!row.horizontalOverflow&&row.proseWords<=25;
 raw.push({width,phase,...observations,controls});report.rows.push(row);save();
 if(process.env.V4_PANEL_CAPTURE==='1'&&width===1280&&phase==='economy:flow'){
  assert(!candidate,'Capture only actual production');
  const path=resolve(root,`reports/v4-ship/S11/secondary-panels-${attempt}-economy.png`);assert(!existsSync(path));
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:.8}});
  writeFileSync(path,Buffer.from(shot.data,'base64'));report.screenshot={path:relative(root,path),sha256:hash(readFileSync(path)),width:1024,height:576};save();
 }
 console.log(JSON.stringify({width,phase,texts:row.texts,prose:row.proseWords,unknown:row.contrastUnknown.length,failed:row.contrastFailures.length,clipped:row.clipping.length,unnamed:row.unnamedControls.length}));
}
try{
 // Scoping selects text, but must keep ancestor opacity and overflow checks.
 const probe=await browser.newPage();
 await probe.setContent('<div style="opacity:.5;overflow:hidden;width:12px;height:12px"><section id="probe" style="background:#111;color:#fff;width:200px"><p>Ancestor checks survive scoping</p></section></div>');
 const probeResult=await probe.evaluate(observeDocument,{scopeSelector:'#probe'});
 report.scopeCheck={texts:probeResult.texts.length,unknown:probeResult.texts.filter(t=>t.unknownReason==='opacity/filter/blend').length,clipped:probeResult.texts.filter(t=>t.clipping.length).length};
 assert(report.scopeCheck.texts===1&&report.scopeCheck.unknown===1&&report.scopeCheck.clipped===1);
 await probe.setContent('<section id="probe" style="background:#111;color:#fff;width:12px;height:12px;white-space:nowrap">Outside backing</section>');
 const backing=await probe.evaluate(observeDocument,{scopeSelector:'#probe'});report.scopeCheck.backingUnknown=backing.texts.filter(t=>t.unknownReason==='text-outside-background').length;assert.equal(report.scopeCheck.backingUnknown,1);await probe.close();
 for(const [width,height] of [[1280,720],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  const profile={width,height,errors:[],blocked:[],failedRequests:[],complete:false,interactions:[]};report.profiles.push(profile);
  page.on('pageerror',e=>profile.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')profile.errors.push(safe(e.text()));});
  page.on('requestfailed',r=>profile.failedRequests.push({url:new URL(r.url()).origin+new URL(r.url()).pathname,error:safe(r.failure()?.errorText)}));
  await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),local=['data:','blob:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5997','5998','8546'].includes(u.port),font=u.protocol==='https:'&&r.method()==='GET'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname);if(local||font)await route.continue();else{profile.blocked.push(u.origin+u.pathname);await route.abort();}});
  try{
   await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
   const button=name=>page.getByRole('button',{name,exact:true});await button('Play free').waitFor();
   if(candidate)await page.addStyleTag({content:candidate});
   const audit=async(phase,scope)=>{
    const panel=page.locator(scope);await panel.evaluate(e=>e.scrollTo({top:0,behavior:'instant'}));
    await inspect(page,cdp,width,phase,scope);
    const dimensions=await panel.evaluate(e=>({height:e.clientHeight,max:e.scrollHeight-e.clientHeight}));
    const positions=[];
    for(let offset=Math.min(dimensions.max,Math.floor(dimensions.height*.7));offset>0;offset=Math.min(dimensions.max,offset+Math.floor(dimensions.height*.7))){
     assert(positions.length<20,'Unexpected scroll scope');await panel.evaluate((e,top)=>e.scrollTo({top,behavior:'instant'}),offset);positions.push(await panel.evaluate(e=>e.scrollTop));
     await inspect(page,cdp,width,`${phase}@scroll${positions.length}`,scope);if(offset===dimensions.max)break;
    }
    profile.interactions.push({kind:'scroll-coverage',phase,...dimensions,positions,pass:dimensions.max<=0||positions.at(-1)===dimensions.max});
    await panel.evaluate(e=>e.scrollTo({top:0,behavior:'instant'}));
   };
   await audit('landing','.b-landing');
   async function open(opener,name){await button(opener).focus();await page.keyboard.press('Enter');await page.getByRole('dialog',{name,exact:true}).waitFor();}
   async function close(opener,name){await page.keyboard.press('Escape');await page.getByRole('dialog',{name,exact:true}).waitFor({state:'hidden'});profile.interactions.push({kind:'dialog-return',name,pass:await button(opener).evaluate(e=>document.activeElement===e)});}
   await open('Connect wallet','Wallet sign-in');await audit('wallet','.b-modal');await close('Connect wallet','Wallet sign-in');
   const mixer=page.locator('.th-audio summary');await mixer.focus();await page.keyboard.press('Enter');await page.locator('.th-audio details[open]').waitFor();await audit('mixer','.th-audio details');
   const sliderRows=[];
   for(const bus of ['master','music','ambience','sfx','voice','ui']){
    const slider=page.getByRole('slider',{name:`${bus} volume`,exact:true});const before=Number(await slider.inputValue());await slider.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');const adjusted=Number(await slider.inputValue());sliderRows.push({bus,before,adjusted,pass:Math.abs(adjusted-.05)<1e-6});
   }
   await page.reload();await button('Play free').waitFor();if(candidate)await page.addStyleTag({content:candidate});await mixer.focus();await page.keyboard.press('Enter');
   for(const row of sliderRows){const slider=page.getByRole('slider',{name:`${row.bus} volume`,exact:true});row.persisted=Number(await slider.inputValue());row.pass&&=Math.abs(row.persisted-row.adjusted)<1e-6;await slider.focus();await page.keyboard.press('Home');for(let i=0;i<Math.round(row.before/.05);i++)await page.keyboard.press('ArrowRight');}
   profile.interactions.push({kind:'mixer-keyboard-persistence',rows:sliderRows,pass:sliderRows.every(r=>r.pass)});
   await mixer.focus();await page.keyboard.press('Enter');assert(!await page.locator('.th-audio details').evaluate(e=>e.open));
   await open('Economy','economy');
   for(const tab of ['flow','allocation','fees','craft','odds']){
    await page.getByRole('dialog',{name:'economy',exact:true}).getByRole('button',{name:tab,exact:true}).click();
    if(tab==='odds')for(const [id,label] of [['banner','Banner odds'],['featured','Featured & shards'],['enhance','Enhancement & fusion'],['drops','Drops']]){await button(label).click();await audit(`economy:odds:${id}`,'.b-page');}
    else{await audit(`economy:${tab}`,'.b-page');if(tab==='flow'){await page.locator('.b-page summary').click();await audit('economy:flow:ratio','.b-page');}if(tab==='fees'){await button('Limits and risks').click();await audit('economy:fees:help','.b-page');}}
   }
   await close('Economy','economy');await open('Odds','odds');
   for(const [id,label] of [['banner','Banner odds'],['featured','Featured & shards'],['enhance','Enhancement & fusion'],['drops','Drops']]){await button(label).click();await audit(`odds:${id}`,'.b-page');}
   await close('Odds','odds');await open('Watch battle','trailer');await page.locator('.b-page video').evaluate(v=>new Promise((resolve,reject)=>{if(v.readyState>=2)return resolve();v.addEventListener('loadeddata',resolve,{once:true});v.addEventListener('error',()=>reject(new Error('Trailer load failed')),{once:true});}));
   await audit('trailer','.b-page');profile.video=await page.locator('.b-page video').evaluate(v=>({readyState:v.readyState,width:v.videoWidth,height:v.videoHeight,duration:v.duration,paused:v.paused,muted:v.muted,error:v.error?.code??null}));await close('Watch battle','trailer');profile.complete=true;
  }catch(error){profile.failure=safe(error.message);}
  finally{await context.close();save();}
 }
 const primary=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S11/ui-audit-3.json')));
 report.coverageComparison={primary:{evidence:'reports/v4-ship/S11/ui-audit-3.json',samples:primary.rows.length,phases:[...new Set(primary.rows.map(r=>r.phase))],secondaryStatesObserved:0},expanded:{samples:report.rows.length,phases:[...new Set(report.rows.map(r=>r.phase))],secondaryStatesObserved:report.rows.filter(r=>r.phase!=='landing').length},note:'Primary journey samples did not open these secondary surfaces. Both methods retain their own findings; additional coverage is not a global UI pass.'};
 report.observationComplete=[1280,1440].every(width=>report.rows.filter(r=>r.width===width&&!r.phase.includes('@scroll')).length===18)&&report.profiles.every(p=>p.complete);
 report.pass=report.observationComplete&&report.rows.every(r=>r.pass)&&report.profiles.every(p=>!p.errors.length&&!p.blocked.length&&!p.failedRequests.length&&p.interactions.every(i=>i.pass));
 report.limits=['No physical listening, screen-reader or whole-product accessibility claim. Native media-control shadow text is outside the DOM observer.','All document observations are retained alongside selected panel text; scope does not reset ancestor effects or clipping.','Unknown image/gradient contrast remains a failure to establish AA. Captures, when enabled, are recorded separately.'];
}catch(error){report.failure=safe(error.message);}
finally{await browser.close();save();}
console.log(JSON.stringify({output:relative(root,output),rows:report.rows.length,complete:report.observationComplete,pass:report.pass,failure:report.failure,profileFailures:report.profiles.map(p=>p.failure)}));if(!report.pass)process.exitCode=1;
