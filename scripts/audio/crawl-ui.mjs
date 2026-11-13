/** Real control activation, with a fresh screen fixture before every click. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openAudioScreen,screenControls,chainScreen} from './ui-fixtures.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const B='reports/v3-shell/b2',dir=`${B}/ui-audio`;mkdirSync(dir,{recursive:true});
const all=JSON.parse(readFileSync(`${B}/UI-AUDIT.json`)).screens.map(s=>s.id).concat('bag-batch-use');
const selected=process.env.SCREENS?.split(',')||all,limit=Number(process.env.CRAWL_LIMIT||0);
const cues=new Set(JSON.parse(readFileSync(`${B}/SOUND-MAP.json`)).rows.map(r=>r.cueId));
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const sourceHash=createHash('sha256').update(readFileSync('apps/web/src/audio/feedback.ts')).digest('hex');
const fixture=async action=>{
 const r=await fetch('http://127.0.0.1:5997/__fixture/'+action,{method:'POST'});const data=await r.json();if(!r.ok||!data.ok)throw Error(`Local ${action} failed (${r.status})`);return data;
};
async function visit(id,action){
 const snapshot=chainScreen(id)?await fixture('begin'):null;
 const context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Audio unavailable'))errors.push(m.text());});
 try{await openAudioScreen(p,id);return await action(p,errors);}
 catch(error){console.error('Fixture failure',id,error.message);throw error;}
 finally{await context.close();if(snapshot)await fixture('rollback');}
}
async function crawl(id){
 const path=`${dir}/${limit?'probe-':''}${id}.json`;
 if(process.env.CRAWL_RESUME&&existsSync(path)){
  const old=JSON.parse(readFileSync(path));if(old.complete&&old.sourceHash===sourceHash&&old.elements.every(e=>e.mappedCue)){console.log('reused',id);return;}
 }
 const previous=process.env.CRAWL_RETRY_FAILED&&existsSync(path)?JSON.parse(readFileSync(path)):null;
 const result={screen:id,sourceHash,diagnostic:!!limit,complete:false,elements:[],audioErrors:[],errors:[],method:'Fresh app/browser fixture before each visible, enabled control activation. Click, native select or keyboard edit; no dispatched fake click handlers and no test playback. Both SQL and Anvil state are rolled back between local chain fixtures; no public transactions.'};
 const save=()=>writeFileSync(path,JSON.stringify(result,null,2)+'\n');
 try{
  const inventory=await visit(id,async p=>p.evaluate(screenControls));result.inventory=inventory;save();
  for(const target of limit?inventory.slice(0,limit):inventory){
   const retained=previous?.sourceHash===sourceHash&&previous.elements.find(e=>e.key===target.key&&e.mappedCue&&!e.audioErrors.length);
   if(retained){result.elements.push(retained);save();continue;}
   try{
    const row=await visit(id,async(p,errors)=>{
     const current=await p.evaluate(screenControls),control=current.find(c=>c.key===target.key);
     if(!control)throw Error(`Control changed between isolated fixtures: ${target.key}`);
     const requested=[];await p.exposeFunction('__probeRequest',(id,at)=>requested.push({id,at}));
     await p.evaluate(()=>{
      const engine=window.__thAudio,play=engine.play.bind(engine);engine.hits.length=0;
      engine.play=(id,opts)=>{void window.__probeRequest(id,Date.now());return play(id,opts);};
     });
     const el=p.locator(`[data-audio-probe="${control.index}"]`);let mode='click';
     if(target.tag==='SELECT'){
      const values=await el.locator('option').evaluateAll(options=>options.filter(o=>!o.disabled).map(o=>o.value));
      await el.selectOption(values.find(v=>v!==control.value)??values[0]);mode='select';
     }else if(target.tag==='INPUT'&&target.type==='range'){await el.focus();await el.press(control.value==='1'?'ArrowLeft':'ArrowRight');mode='slider';}
     else if(target.tag==='INPUT'&&!['checkbox','radio','button','submit','reset','file'].includes(target.type)){await el.fill(target.type==='number'?'2':'audio check');mode='edit';}
     else await el.click({timeout:3000});
     await p.waitForTimeout(180);
     const hits=await p.evaluate(()=>window.__thAudio?.hits??[]).catch(()=>[]);
     const actual=requested.filter(r=>r.id!=='ui.hover'&&r.id!=='ui.release'&&r.id!=='ui.scroll');
     return {...target,mode,requested:actual,hits,mappedCue:actual.find(r=>cues.has(r.id))?.id??null,audioErrors:errors};
    });
    result.elements.push(row);result.audioErrors.push(...row.audioErrors);
   }catch(error){result.elements.push({...target,mappedCue:null,error:error.message.split('\n')[0]});}
   save();
  }
  result.complete=true;
 }catch(error){result.errors.push(error.message.split('\n')[0]);}
 save();console.log(id,result.elements.filter(e=>e.mappedCue).length+'/'+result.elements.length,'errors',result.errors.length+result.audioErrors.length);
}
try{
 // Anvil snapshots must be sequential. UI-only work can use two independent pages.
 const menus=selected.filter(id=>!chainScreen(id)),chain=selected.filter(chainScreen);
 let next=0;await Promise.all([0,1].map(async()=>{while(next<menus.length)await crawl(menus[next++]);}));
 for(const id of chain)await crawl(id);
}finally{await browser.close();}
