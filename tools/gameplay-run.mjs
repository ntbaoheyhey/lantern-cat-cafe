// Real wall-clock ten-minute guest walkthrough. No accelerated clock or fixture economy.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, root, pinExistingFonts } from './visual-support.mjs';
const phase=process.argv[2]??'before', base=process.argv[3]??'http://127.0.0.1:5390';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Local demo only');
const out=resolve(root,'reports/gameplay');mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[], actions=[], samples=[];let events=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
await pinExistingFonts(page);
await page.addInitScript(()=>{let s=1404;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);});
try {
await page.goto(base+'/?demo');
await page.getByTestId('class-picker').waitFor();
if(await page.getByRole('button',{name:'Start playing',exact:true}).count())await page.getByRole('button',{name:'Start playing',exact:true}).click();
await page.getByTestId('class-picker-choose-button').click();
const confirm=page.getByRole('button',{name:'Confirm',exact:true});
if(await confirm.isVisible())await confirm.click();
await page.getByTestId('home-dashboard').waitFor();
await page.waitForFunction(()=>window.__g1Loop?.getSnapshot().state?.cat.classId);
await page.evaluate(()=>{window.__runEvents=[];window.__runLoop=window.__g1Loop;window.__runLoop.onEvent(e=>window.__runEvents.push(e));});
const start=Date.now();console.log('Started',phase,new Date(start).toISOString());
const record=async(name,fn)=>{try{await fn();actions.push({t:(Date.now()-start)/1000,name,ok:true});}catch(e){actions.push({t:(Date.now()-start)/1000,name,ok:false,error:String(e).slice(0,200)});}};
const nav=async id=>page.getByTestId('nav-'+id).click();
let lastSlot=0,bossAttempted=false;
while(Date.now()-start<600000){
 const t=Math.floor((Date.now()-start)/1000);const slot=Math.floor(t/15);
 if(slot!==lastSlot){lastSlot=slot;
 if(t>=45&&t<60)await record('Inspect bag',()=>nav('bag'));
 if(t>=60&&t<75)await record('Inspect forge choices',()=>nav('forge'));
 if(t>=75&&t<90)await record('Choose common helmet',async()=>{await page.getByTestId('slot-helmet').click();await page.getByTestId('rarity-common').click();});
 if(t>=90&&t<105)await record('Craft if affordable',async()=>{const b=page.getByTestId('craft-btn');if(await b.isEnabled()){await b.click();await page.getByTestId('craft-confirm-btn').click();}else throw Error(await b.innerText());});
 if(t>=105&&t<120)await record('Inspect crafted/drop gear',()=>nav('bag'));
 if(t>=120&&t<135)await record('Equip visible upgrades',async()=>{const b=page.getByRole('button',{name:'Equip best',exact:true});if(await b.isEnabled())await b.click();else throw Error('No upgrade available');});
 if(t>=135&&t<150)await record('Return home',()=>nav('home'));
 if(t>=240&&t<255)await record('Inspect boss gate',()=>nav('map'));
 if(t>=270&&t<285)await record('Return home',()=>nav('home'));
 if(t>=360&&t<375)await record('Inspect new gear',()=>nav('bag'));
 if(t>=375&&t<390)await record('Equip upgrades',async()=>{const b=page.getByRole('button',{name:'Equip best',exact:true});if(await b.isEnabled())await b.click();});
 if(t>=390&&t<405)await record('Return home',()=>nav('home'));
 if(t>=450&&t<465)await record('Inspect boss gate again',()=>nav('map'));
 if(t>=495&&t<510)await record('Return home',()=>nav('home'));
 }
 const s=await page.evaluate(()=>({state:window.__runLoop.getSnapshot().state,events:window.__runEvents,text:document.body.innerText}));events=s.events;
 samples.push({t:(Date.now()-start)/1000,cat:s.state.cat,progress:s.state.progress,currencies:s.state.currencies,inventory:s.state.inventory.map(i=>({id:i.id,key:i.itemKey,rarity:i.rarity,equipped:i.equipped})),next: s.text.match(/Next Goal[\s\S]{0,300}/)?.[0]??s.text.match(/Next:[^\n]+/)?.[0]??null});
 if(s.state.progress.round===10&&s.state.progress.kills>=s.state.progress.killsPerRound&&s.state.currencies.keys>0&&!bossAttempted){await record('First boss attempt',async()=>{await nav('map');const b=page.getByRole('button',{name:'Fight',exact:true});if(await b.isEnabled()){await b.click();bossAttempted=true;}});}
 if(t%60<3){await page.screenshot({path:resolve(out,`${phase}-minute-${Math.floor(t/60)}.png`)});console.log(JSON.stringify({t,progress:s.state.progress,items:s.state.inventory.length,fish:s.state.currencies.fish}));}
 writeFileSync(resolve(out,`${phase}-run.json`),JSON.stringify({phase,base,seed:1404,economySeed:1,start:new Date(start).toISOString(),duration:(Date.now()-start)/1000,actions,samples,events,errors}));
 await page.waitForTimeout(2000);
}
console.log('Finished',phase,'wall seconds',(Date.now()-start)/1000);
}finally{await browser.close();}
