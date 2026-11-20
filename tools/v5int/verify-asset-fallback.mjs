/** Native production-browser fallback checks, with intentional faults kept separate from ordinary errors. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
import {loadPilotFixtures} from './pilot-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/asset-fallback',label);try{await access(out);throw Error('Use a fresh label');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const approved=JSON.parse(await readFile(resolve(root,'apps/web/src/game/cardrpg/spine/v5-approved-manifest-loader.json'))),delivery=JSON.parse(await readFile(resolve(root,'apps/web/src/game/cardrpg/spine/v5-avif-manifest-loader.json')));
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),rows:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),pilots=await loadPilotFixtures();
try{
 for(const mode of ['integrity','decode']){
  const result=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:async page=>{
   await page.addInitScript(mode=>{
    const original=window.fetch.bind(window),types=new Map(),create=URL.createObjectURL.bind(URL),decode=Image.prototype.decode;
    window.__assetFetch=[];window.__assetDecode=[];
    window.fetch=(input,init)=>{const url=typeof input==='string'?input:input.url??String(input);if(!url.startsWith('/vfx/v5/'))return original(input,init);window.__assetFetch.push({url,integrity:init?.integrity});
     return original(input,mode==='integrity'&&url.endsWith('.avif')?{...init,integrity:'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='}:init);
    };
    URL.createObjectURL=blob=>{const url=create(blob);types.set(url,blob.type);return url;};
    Image.prototype.decode=function(){const type=types.get(this.src);if(type)window.__assetDecode.push({src:this.src,type,rejected:mode==='decode'&&type==='image/avif'});if(mode==='decode'&&type==='image/avif')return Promise.reject(Error('Intentional AVIF decoder rejection'));return decode.call(this);};
   },mode);
  }});
  const {page}=result,fixture=pilots.pilotFixture('mochi-4'),plan=pilots.configureSequence(fixture.plan);
  await page.evaluate(({battle,plan})=>{const m=window.__depthReview;Object.assign(m,{galleryBattle:battle,tutorialBattle:null,plan,paused:true,sceneStarted:true,screen:'map'});m.notify(false);},{battle:fixture.battle,plan});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.view().frame?.plan.id===window.__depthReview.plan?.id);
  const data=await page.evaluate(ms=>{const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.animationAt=ms;const v={...s.view(),frame:m.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:true};s.render(v,0);return{fetches:window.__assetFetch,decodes:window.__assetDecode,ready:s.ready,audit:structuredClone(s.effects.timeline.audit)};},plan.beats[2].start+90);
  report.rows.push({mode,url:page.url(),...data,expectedFaultErrors:result.errors,unexpectedErrors:[]});
  const originals=data.fetches.filter(x=>x.url.endsWith('.webp'));assert.equal(new Set(originals.map(x=>x.url)).size,12);
  for(const row of Object.values(approved))assert(originals.some(x=>x.url==='/vfx/v5/'+row.file&&x.integrity===row.integrity),'Original fallback lost integrity pin');
  for(const row of Object.values(delivery))assert(data.fetches.some(x=>x.url==='/vfx/v5/'+row.file&&x.integrity===row.integrity),'Derivative lost integrity pin');
  assert(data.ready);assert(data.audit.textured>0,'No textured effect after recovery');
  const unexpected=result.errors.filter(e=>mode==='decode'||!/integrity|digest|SRI/i.test(e));assert.equal(unexpected.length,0);
  report.rows.at(-1).unexpectedErrors=unexpected;await page.close();
 }
 report.complete=true;
}catch(e){report.failure=String(e.stack);throw e;}finally{await browser.close();await pilots.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({complete:report.complete,rows:report.rows.map(x=>({mode:x.mode,originals:x.fetches.filter(f=>f.url.endsWith('.webp')).length,textured:x.audit.textured,unexpected:x.unexpectedErrors})),report:resolve(out,'report.json')}));
