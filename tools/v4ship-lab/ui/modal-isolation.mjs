/** Pointer, programmatic-focus and AX isolation; local/headless only, no transactions. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,relative} from 'node:path';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/modal-isolation-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-9.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const sha=b=>createHash('sha256').update(b).digest('hex');
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&sha(Buffer.from(await response.arrayBuffer()))===build.indexSha256);
const methods=(process.env.V4_MODAL_METHODS??'current,raised,inert,native').split(',');
assert(methods.every(m=>['current','raised','inert','native'].includes(m)));
const motions=(process.env.V4_MODAL_MOTIONS??'no-preference').split(',');assert(motions.every(m=>['no-preference','reduce'].includes(m)));
const production=process.env.V4_MODAL_PRODUCTION==='1';if(production)assert.deepEqual(methods,['current']);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const report={at:new Date().toISOString(),buildPath,buildSourceCommit:build.sourceCommit,indexSha256:build.indexSha256,harnessSha256:sha(readFileSync(import.meta.filename)),methods,motions,production,rows:[],errors:[],complete:false,pass:false,limits:['Injected methods are mechanism experiments, not shipping acceptance.','AX protocol data is not human screen-reader testing. No screenshots or device/desktop control.']};
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const method of methods)for(const motion of motions){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:motion}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  page.on('pageerror',e=>report.errors.push(e.message.slice(0,250)));
  page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text().slice(0,250));});
  const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(u.hostname==='127.0.0.1'&&['5997','5998','8546'].includes(u.port)||['data:','blob:'].includes(u.protocol)||u.protocol==='https:'&&r.method()==='GET'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))await route.continue();else{report.errors.push(`Blocked ${u.origin}${u.pathname}`);await route.abort();}});
  try{
   await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');await page.getByRole('button',{name:'Play free',exact:true}).waitFor();
   for(const [opener,name] of [['Connect wallet','Wallet sign-in'],['Economy','economy'],['Odds','odds'],['Watch battle','trailer']]){
    assert(!existsSync(resolve(root,'STOP-V4SHIP')));
    const button=page.getByRole('button',{name:opener,exact:true}),dialog=page.getByRole('dialog',{name,exact:true});
    await button.focus();await page.keyboard.press('Enter');await dialog.waitFor();
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await dialog.evaluate((el,method)=>{
     const backdrop=el.closest('.b-modal-backdrop');
     if(method==='raised'){const before=backdrop.style.zIndex;backdrop.style.zIndex='2147483647';window.__releaseIsolation=()=>{backdrop.style.zIndex=before;};}
     if(method==='inert'){
      const changed=[];for(let node=el;node&&node!==document.body;node=node.parentElement)for(const sibling of node.parentElement?.children??[]){if(sibling!==node&&!sibling.hasAttribute('inert')){sibling.setAttribute('inert','');changed.push(sibling);}}
      window.__releaseIsolation=()=>changed.forEach(e=>e.removeAttribute('inert'));
     }
     if(method==='native'){
      const wrapper=document.createElement('dialog');wrapper.style.cssText='position:fixed;inset:0;margin:0;width:100%;height:100%;max-width:none;max-height:none;padding:0;border:0;background:transparent';
      backdrop.before(wrapper);wrapper.append(backdrop);wrapper.showModal();el.focus();
      window.__releaseIsolation=()=>{wrapper.close();wrapper.before(backdrop);wrapper.remove();};
     }
    },method);
    const row={width,height,method,motion,dialog:name,pointer:[],focus:[]};
    for(const [selector,state] of [['.th-audio>button','mute'],['.th-audio summary','mixer']]){
     const target=page.locator(selector),box=await target.boundingBox();assert(box);
     const snapshot=()=>target.evaluate((e,state)=>state==='mute'?e.getAttribute('aria-pressed'):e.parentElement.open,state);
     const before=await snapshot(),x=box.x+box.width/2,y=box.y+box.height/2;
     const hit=await page.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y);return {tag:e?.tagName,label:e?.getAttribute('aria-label'),background:!!e?.closest('.th-audio')};},{x,y});
     await page.mouse.click(x,y);await frame();const after=await snapshot();
     row.pointer.push({state,before,after,hit,blocked:before===after});
     if(before!==after){const restore=await target.boundingBox();assert(restore);row.pointer.at(-1).restore={x:restore.x+restore.width/2,y:restore.y+restore.height/2};await page.mouse.click(restore.x+restore.width/2,restore.y+restore.height/2);await frame();assert.equal(await snapshot(),before,'Background state restoration');}
    }
    row.focus=await dialog.evaluate(el=>Array.from(document.querySelectorAll('button:not(:disabled),a[href],summary,input:not(:disabled),[tabindex="0"]')).filter(e=>!el.contains(e)&&e.checkVisibility()).map(e=>{el.focus();e.focus();return {tag:e.tagName,label:e.getAttribute('aria-label')??e.textContent.trim().slice(0,60),escaped:document.activeElement===e};}));
    const ax=await cdp.send('Accessibility.getFullAXTree');
    row.backgroundAX=ax.nodes.filter(n=>!n.ignored&&['button','DisclosureTriangle'].includes(n.role?.value)&&['Mute sound','Unmute sound','Audio mixer','Connect wallet'].includes(n.name?.value)).map(n=>({role:n.role.value,name:n.name.value}));
    await dialog.focus();
    row.initialFocusInside=await dialog.evaluate(el=>el.contains(document.activeElement));
    row.bounds=await dialog.boundingBox();
    row.nativeModal=await dialog.evaluate(el=>el.matches(':modal'));
    if(production){
     row.tabs=[];const count=await dialog.locator('button:not(:disabled),a[href],summary,video,[tabindex="0"]').count();
     for(const key of ['Tab','Shift+Tab'])for(let i=0;i<count+2;i++){await page.keyboard.press(key);row.tabs.push({key,inside:await dialog.evaluate(el=>el.contains(document.activeElement))});}
     await dialog.evaluate(el=>{
      window.__exitSamples=[];window.__exitComplete=false;
      const start=()=>{const at=performance.now();const sample=()=>{if(!el.isConnected){window.__exitComplete=true;return;}const background=document.querySelector('.th-audio>button');background.focus();window.__exitSamples.push({ms:performance.now()-at,modal:el.matches(':modal'),escaped:document.activeElement===background});requestAnimationFrame(sample);};queueMicrotask(sample);};
      el.addEventListener('keydown',e=>{if(e.key==='Escape')start();},{once:true});el.querySelector('.b-close').addEventListener('click',start,{once:true});
     });
    }
    await page.evaluate(()=>{window.__releaseIsolation?.();delete window.__releaseIsolation;});
    await dialog.focus();if(production&&motion==='reduce')await dialog.locator('.b-close').click();else await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    if(production){await page.waitForFunction(()=>window.__exitComplete);row.exitSamples=await page.evaluate(()=>window.__exitSamples);}
    row.returned=await button.evaluate(e=>document.activeElement===e);
    row.pass=row.pointer.every(p=>p.blocked)&&row.focus.every(f=>!f.escaped)&&row.backgroundAX.length===0&&row.initialFocusInside&&row.returned;
    if(production)row.pass&&=row.nativeModal&&row.tabs.every(t=>t.inside)&&row.exitSamples.every(s=>s.modal&&!s.escaped)&&(motion==='reduce'||name==='Wallet sign-in'||row.exitSamples.length>0);
    report.rows.push(row);writeFileSync(output,JSON.stringify(report,null,2)+'\n');
   }
  }finally{await context.close();}
 }
 report.complete=report.rows.length===8*methods.length*motions.length;report.pass=report.complete&&!report.errors.length&&report.rows.every(r=>r.pass);
}catch(error){report.failure=error.message.slice(0,400);}
finally{await browser.close();writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output:relative(root,output),complete:report.complete,pass:report.pass,failure:report.failure,methods:methods.map(method=>{const rows=report.rows.filter(r=>r.method===method);return {method,rows:rows.length,passed:rows.filter(r=>r.pass).length,pointerLeaks:rows.flatMap(r=>r.pointer).filter(p=>!p.blocked).length,focusLeaks:rows.flatMap(r=>r.focus).filter(f=>f.escaped).length,backgroundAX:rows.reduce((n,r)=>n+r.backgroundAX.length,0)};})}));
if(!report.pass)process.exitCode=1;
