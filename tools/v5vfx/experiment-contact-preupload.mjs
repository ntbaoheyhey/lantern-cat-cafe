/** Tool-only upload scheduling experiment. No loader or application source edits. */
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium, config, openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';

const out = resolve(process.env.CXV_CAPTURE_OUT ?? 'work/v5/CXV/films/V7-F-contact-preupload');
await mkdir(out, {recursive:true});
const repeats = Number(process.env.CXV_UPLOAD_REPEATS ?? 3);
assert(Number.isInteger(repeats) && repeats > 0 && repeats <= 10);
const modes = ['none', 'upfront', 'staggered'];
const frames = [['idle',0], ['anticipation',50], ['transition',300], ['contact',350], ['contact-warm',350], ['release',650], ['idle-return',799], ['contact-return',350]];
const report = {
  utc:new Date().toISOString(), source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  ...runtimeEvidence(), toolSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),
  viewport:{width:1280,height:720}, repeats, rows:[], parity:[], errors:[],
  method:'Fresh boss fixtures at 1x/4x CPU; alternating mode order per repetition. Only Yarn Giant K4 and shared Binding Thread K4 are initialized early. Upfront includes both uploads before idle; staggered includes one after idle and one after anticipation. Combined CPU includes render and preparation. All frames and allocation counts retained. Timing passes have no screenshots, readPixels, or CPU profiler. Separate deterministic parity passes read full renderer RGBA after each frozen frame. Submission timings are not GPU completion, actual idle-budget scheduling, ordinary gameplay FPS, or production acceptance.',
};
const browser = await chromium.launch({headless:true,args:['--use-angle=metal']});

async function run(mode, rate, repetition, parity = false) {
  const {page,errors} = await openFixture(browser,config.fixtures.find(f=>f.id==='boss'), {
    fixedClock:false,
    setupPage: parity ? async p => p.addInitScript(()=>{Math.random=()=>.5;}) : undefined,
  });
  const cdp = await page.context().newCDPSession(page);
  try {
    report.url=page.url();
    await page.evaluate(async()=>{
      const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');
      const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
      const f=pilotFixture('mochi-1'),m=window.__depthReview,s=window.__depthScene;
      Object.assign(m,{galleryBattle:f.battle,plan:configureSequence(f.plan),animationAt:0,paused:true});
      m.notify(false);s.ensureActors(s.view());cancelAnimationFrame(s.raf);
    });
    await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
    await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
    await page.evaluate(()=>{
      const s=window.__depthScene;cancelAnimationFrame(s.raf);
      const unique=new Map();
      for(const [id,entry]of s.actors) {
        if(!['yarn-giant','binding-thread'].includes(entry.asset))continue;
        const texture=entry.craftPose?.drawing.set.textures.K4;
        if(!texture)throw Error('Missing K4 for '+id);
        const row=unique.get(texture)??{texture,ids:[],asset:entry.asset};row.ids.push(id);unique.set(texture,row);
      }
      const targets=[...unique.values()].sort((a,b)=>b.texture.image.width-a.texture.image.width);
      if(targets.length!==2)throw Error('Expected two shared K4 textures, got '+targets.length);
      window.__cxvUploadExperiment={targets,uploads:[],restores:[]};
      const gl=s.renderer.getContext(),p=window.__cxvUploadExperiment;
      for(const key of ['texImage2D','texSubImage2D']) {
        const original=gl[key];
        gl[key]=function(...args){const at=performance.now();try{return original.apply(this,args);}finally{p.uploads.push({method:key,ms:performance.now()-at});}};
        p.restores.push(()=>gl[key]=original);
      }
    });
    await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    const result=await page.evaluate(async({mode,frames,parity})=>{
      const s=window.__depthScene,m=window.__depthReview,p=window.__cxvUploadExperiment;
      const rows=[],initialTextures=s.renderer.info.memory.textures;
      const targetInfo=p.targets.map(({texture,ids,asset})=>{
        let width=texture.image.width,height=texture.image.height,estimatedBytes=width*height*4;
        if(texture.generateMipmaps)while(width>1||height>1){width=Math.max(1,Math.floor(width/2));height=Math.max(1,Math.floor(height/2));estimatedBytes+=width*height*4;}
        return {ids,asset,key:'K4',width:texture.image.width,height:texture.image.height,generateMipmaps:texture.generateMipmaps,estimatedRGBA8MipBytes:estimatedBytes};
      });
      for(let i=0;i<frames.length;i++) {
        const [tag,ms]=frames[i];m.animationAt=ms;
        const texturesBefore=s.renderer.info.memory.textures,at=performance.now();p.uploads=[];
        let preparationMs=0,preparationUploads=[];
        const prepare=targets=>{const start=performance.now();for(const {texture}of targets)s.renderer.initTexture(texture);preparationMs+=performance.now()-start;preparationUploads.push(...p.uploads);p.uploads=[];};
        if(mode==='upfront'&&i===0)prepare(p.targets);
        const renderStart=performance.now();
        s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
        const renderMs=performance.now()-renderStart,renderUploads=p.uploads;p.uploads=[];
        if(mode==='staggered'&&i<2)prepare([p.targets[i]]);
        const combinedMs=performance.now()-at;
        const row={tag,ms,renderMs,preparationMs,combinedMs,texturesBefore,texturesAfter:s.renderer.info.memory.textures,renderUploads,preparationUploads,calls:s.stats.calls};
        if(parity) {
          const gl=s.renderer.getContext(),width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
          const rgba=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
          row.pixels={width,height,sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rgba)),b=>b.toString(16).padStart(2,'0')).join('')};
        }
        rows.push(row);
      }
      p.uploads=[];const beforeRepeat=s.renderer.info.memory.textures,repeatAt=performance.now();
      for(const {texture}of p.targets)s.renderer.initTexture(texture);
      const repeat={ms:performance.now()-repeatAt,uploads:p.uploads,texturesBefore:beforeRepeat,texturesAfter:s.renderer.info.memory.textures};
      for(const restore of p.restores)restore();delete window.__cxvUploadExperiment;
      return {initialTextures,targetInfo,rows,repeat};
    },{mode,frames,parity});
    if(parity)await page.screenshot({path:resolve(out,'parity-'+mode+'.png')});
    const row={mode,rate,repetition,utc:new Date().toISOString(),...result,errors:[...errors]};
    (parity?report.parity:report.rows).push(row);report.errors.push(...errors);
    await writeFile(resolve(out,'report.partial.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({mode,rate,repetition,parity,errors,contactMs:row.rows.find(r=>r.tag==='contact').renderMs,maxCombinedMs:Math.max(...row.rows.map(r=>r.combinedMs)),totalMs:row.rows.reduce((a,r)=>a+r.combinedMs,0),prepMs:row.rows.reduce((a,r)=>a+r.preparationMs,0)}));
  } finally {await page.close();}
}

try {
  for(const rate of [1,4])for(let repetition=0;repetition<repeats;repetition++)for(const mode of repetition%2?[...modes].reverse():modes)await run(mode,rate,repetition);
  for(const mode of modes)await run(mode,1,0,true);
  const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
  report.summary=[1,4].flatMap(rate=>modes.map(mode=>{
    const runs=report.rows.filter(r=>r.rate===rate&&r.mode===mode);
    return {rate,mode,contactMedianMs:median(runs.map(r=>r.rows.find(v=>v.tag==='contact').renderMs)),maxCombinedMedianMs:median(runs.map(r=>Math.max(...r.rows.map(v=>v.combinedMs)))),totalMedianMs:median(runs.map(r=>r.rows.reduce((a,v)=>a+v.combinedMs,0))),prepMedianMs:median(runs.map(r=>r.rows.reduce((a,v)=>a+v.preparationMs,0))),frames:frames.map(([tag])=>({tag,combinedMedianMs:median(runs.map(r=>r.rows.find(v=>v.tag===tag).combinedMs))}))};
  }));
  report.parityChecks=report.parity.slice(1).flatMap(run=>run.rows.map((row,i)=>({mode:run.mode,tag:row.tag,equal:JSON.stringify(row.pixels)===JSON.stringify(report.parity[0].rows[i].pixels)})));
  report.idempotent=[...report.rows,...report.parity].every(run=>run.repeat.uploads.length===0&&run.repeat.texturesBefore===run.repeat.texturesAfter);
  report.pass=report.errors.length===0&&report.parityChecks.every(row=>row.equal)&&report.idempotent;
  report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({out,pass:report.pass,summary:report.summary,parity:report.parityChecks,idempotent:report.idempotent}));
  if(!report.pass)process.exitCode=1;
} catch(error) {
  report.errors.push(String(error.stack??error));report.pass=false;report.ended=new Date().toISOString();
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));throw error;
} finally {await browser.close();}
