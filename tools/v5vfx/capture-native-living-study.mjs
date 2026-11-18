import {chromium,config,openFixture} from './browser-fixture.mjs';
import {nativeLivingExperiment} from './native-living-experiment.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const cat=process.env.CXV_M_CAT??'mallow',out=resolve(process.env.CXV_M_OUT??`work/v5/CXV/films/M-V2-${cat}-study-R1`),hash=x=>createHash('sha256').update(x).digest('hex');await mkdir(out,{recursive:true});
const original=await readFile(`apps/web/public/units/${cat}/rig.json`),candidate=JSON.stringify(nativeLivingExperiment(JSON.parse(original)));
await writeFile(resolve(out,'candidate-rig.json'),candidate);
const report={utc:new Date().toISOString(),cat,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),sourceRigSha256:hash(original),prototypeRigSha256:hash(candidate),prototypeCodeSha256:hash(await readFile('tools/v5vfx/native-living-experiment.mjs')),viewport:{width:1280,height:720},method:'Isolated cloned rig response, shipped code/art unchanged. Deterministic10s30Hz study, not runtime/performance acceptance.',modes:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of ['baseline','candidate']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:mode==='candidate'?p=>p.route(`**/units/${cat}/rig.json`,route=>route.fulfill({body:candidate,contentType:'application/json'})):undefined});
  report.url=page.url();report.artifactSha256=hash(await(await page.request.get('http://127.0.0.1:6310/')).body());
  await page.evaluate(async cat=>{const{pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),m=window.__depthReview;const f=pilotFixture(cat+'-1');m.galleryBattle=f.battle;m.plan=null;m.galleryId=cat+'-1';m.paused=true;m.sceneStarted=true;m.notify(false);const s=window.__depthScene;cancelAnimationFrame(s.raf);s.ensureActors(s.view());},cat);
  await page.waitForFunction(cat=>window.__depthScene.ready&&[...window.__depthScene.actors.values()].some(e=>e.asset===cat),cat,{timeout:90000});
  const dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const measures=await page.evaluate(cat=>{
   const e=[...window.__depthScene.actors.values()].find(e=>e.asset===cat),m=e.actor.mesh,names=['leg_l','leg_r','head','tail_3','weapon','torso'],rows=[],rest=new Map();let minTriangleRatio=Infinity;
   for(let f=0;f<=300;f++){
    const t=f/30;m.proceduralTime=t;m.pose(t%m.data.clips.idle.duration,'idle');
    const points=names.map(n=>{const b=m.skeleton.findBone(n);return{x:b.worldX,y:b.worldY};});
    for(const batch of m.batches)for(const {part,offset}of batch.parts){
     if(!part.visible||part.name.startsWith('eye')||part.name.startsWith('mouth'))continue;
     for(let i=0;i<part.triangles.length;i+=3){const a=(offset+part.triangles[i])*3,b=(offset+part.triangles[i+1])*3,c=(offset+part.triangles[i+2])*3,p=batch.positions,area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]);const key=part.name+':'+i;if(!f)rest.set(key,area);else if(Math.abs(rest.get(key))>.001)minTriangleRatio=Math.min(minTriangleRatio,area/rest.get(key));}
    }
    rows.push({t,points,vertices:f%30===0?m.batches.map(b=>Array.from(b.positions)):undefined});
   }return{duration:m.data.clips.idle.duration,pointNames:names,height:m.data.bounds.height,samples:rows,minTriangleRatio};
  },cat);await writeFile(resolve(dir,'measure.json'),JSON.stringify(measures));
  const render=t=>page.evaluate(({cat,t})=>{const s=window.__depthScene;for(const e of s.actors.values())e.hurtAt=-100;s.render({...s.view(),frame:null,fixedTime:t,paused:true,galleryPreview:true},0);},{cat,t});
  await render(20);const box=await page.evaluate(cat=>{const s=window.__depthScene,id=[...s.actors].find(([,e])=>e.asset===cat)[0],body=s.anchors.find(a=>a.id===id).body;return{x:Math.max(0,Math.floor(body.x-32)),y:Math.max(0,Math.floor(body.y-32)),width:Math.ceil(body.width+64),height:Math.ceil(body.height+64),body};},cat);const{body,...clip}=box;
  for(let i=0;i<4;i++){await render(20+i*2.5);await page.screenshot({path:resolve(dir,`cat-${i}.png`),clip});}
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(dir,'cat-%d.png'),'-vf','scale=256:288:force_original_aspect_ratio=decrease,pad=256:288:(ow-iw)/2:(oh-ih)/2,tile=4x1','-frames:v','1','-y',resolve(dir,'cat-sheet.jpg')]);
  if(mode==='candidate'){const frames=resolve(dir,'frames');await mkdir(frames,{recursive:true});for(let i=0;i<300;i++){await render(20+i/30);await page.screenshot({path:resolve(frames,`${String(i).padStart(3,'0')}.png`)});}execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','30','-i',resolve(frames,'%03d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-y',resolve(dir,`${cat}-1280x720.mp4`)]);}
  report.modes.push({mode,box,errors,measure:resolve(dir,'measure.json'),minTriangleRatio:measures.minTriangleRatio});await page.close();
 }
 report.pass=report.modes.every(m=>!m.errors.length)&&hash(await readFile(`apps/web/public/units/${cat}/rig.json`))===report.sourceRigSha256;
}catch(e){report.pass=false;report.error=String(e);process.exitCode=1;}finally{await browser.close();report.completedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error,completedUTC:report.completedUTC}));}
