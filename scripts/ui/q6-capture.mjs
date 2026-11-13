/** Q6 provisional review: real fixtures and viewport measurements, no invented scores. */
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {openAudioScreen} from '../audio/ui-fixtures.mjs';
import {measureScreen} from './measure-screen.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const width=Number(process.env.CAPTURE_WIDTH||1280),height=width===1440?900:width<600?844:720;
const ids=(process.env.SCREENS||'cats-list,hero-bonds,hero-awakening,battle-prep').split(',');
const label=process.env.CAPTURE_LABEL||'round1',out=`reports/v3-shell/b2/q6/${label}-${width}`;
mkdirSync(out,{recursive:true});const rows=[],errors=[];
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const sourcePaths=[...new Set([...execFileSync('git',['diff','--name-only','HEAD','--','apps/web/src','packages/game-rules/src'],{encoding:'utf8'}).trim().split('\n'),...execFileSync('git',['ls-files','--others','--exclude-standard','apps/web/src'],{encoding:'utf8'}).trim().split('\n')].filter(Boolean))];
const sourceSignatures=sourcePaths.map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
if(process.env.CAPTURE_RESUME&&existsSync(`${out}/metrics.json`)){
 const prior=JSON.parse(readFileSync(`${out}/metrics.json`));
 if(prior.sourceCommit!==sourceCommit||JSON.stringify(prior.sourceSignatures)!==JSON.stringify(sourceSignatures))throw Error('Product sources changed; choose a fresh capture label');
 rows.push(...prior.rows);
}
const browser=await chromium.launch({headless:true});
try{
 for(const id of ids){
  if(rows.some(row=>row.id===id))continue;
  const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push({id,message:e.message}));
  p.on('response',r=>{if(r.request().resourceType()==='image'&&r.status()>=400)errors.push({id,message:`Image ${r.status()}: ${new URL(r.url()).pathname}`});});
  try{
   await openAudioScreen(p,id,process.env.CAPTURE_URL||'http://127.0.0.1:5996');
   await p.evaluate(()=>document.fonts.ready);
   await p.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length&&!i.complete).map(i=>new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,3000);})))) ;
   // Let actual reward flights and balance counters finish after fixture setup.
   await p.waitForTimeout(1100);
   const broken=await p.locator('img:visible').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src')));
   if(broken.length)throw Error(`${id}: broken visible images ${broken.join(', ')}`);
   const metrics=await p.evaluate(measureScreen),path=`${out}/${id}.png`;
   await p.screenshot({path});
   rows.push({id,viewport:{width,height},screenshot:{path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')},...metrics});
   writeFileSync(`${out}/metrics.json`,JSON.stringify({label,sourceCommit,sourceSignatures,capturedAt:new Date().toISOString(),rows,errors},null,2)+'\n');
   console.log(JSON.stringify({id,words:metrics.visibleWords,plain:metrics.plainTextButtons,overflow:metrics.horizontalOverflow}));
  }finally{await p.close();}
 }
 if(errors.length)throw Error(JSON.stringify(errors));
 for(const source of sourceSignatures)if(createHash('sha256').update(readFileSync(source.path)).digest('hex')!==source.sha256)throw Error(`Source changed during capture: ${source.path}`);
}finally{await browser.close();}
