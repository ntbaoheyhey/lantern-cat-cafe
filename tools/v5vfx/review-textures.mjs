/** Independent pair review: production player at live sockets plus fresh-frame composite. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {runtimeEvidence} from './runtime-evidence.mjs';
const root=process.cwd(),set=process.env.CXV_REVIEW_SET??'mochi';
const assetRoot=resolve(process.env.CXV_REVIEW_ASSETS??'/Users/bao/th-v5-ag2/apps/web/public/vfx/v5');
const out=resolve(process.env.CXV_REVIEW_OUT??'work/v5/CXV/films/AGV-'+set);
const manifest=JSON.parse(await readFile(resolve(assetRoot,'manifest.json'),'utf8'));
const entries=Object.entries(manifest).filter(([id])=>set==='all'||set.split(',').some(key=>id.startsWith(key+'-')||id===key));
if(!entries.length)throw Error('No textures in '+set);
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),runtimeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 ...runtimeEvidence(),
 assetCommit:process.env.CXV_REVIEW_ASSET_REVISION??execFileSync('git',['-C',assetRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),set,
 method:'16 samples per texture. Left: actual DOM screenshot of production effect and blend canvases at idle battle sockets in isolated proxy timeline. Right: same texture at full alpha over a fresh battle-frame composite, half dimmed. Uses manifest blend; no production manifest wiring or approval implied.',textures:[]};
const files=new Map(),hashes={};
for(const [id,spec]of entries){const path=resolve(assetRoot,spec.file);if(!path.startsWith(assetRoot+'/'))throw Error('Invalid asset path');const data=await readFile(path);files.set(id,data);hashes[id]=createHash('sha256').update(data).digest('hex');}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:process.env.CXV_URL??'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 await page.route('**/__cxv_texture__/*',route=>{const id=decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1));const data=files.get(id);return data?route.fulfill({body:data,contentType:'image/webp'}):route.abort();});
 for(const [id,spec]of entries){
  const dir=resolve(out,id);await mkdir(dir,{recursive:true});
  const meta=await page.evaluate(async({root,id,spec})=>{
   const {pilotFixture}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/vfx-layered/fixture.ts');
   const {V5_SKILL_TIMELINES,registerV5Texture,clearV5Textures}=await import('/src/game/cardrpg/spine/vfx-registry.ts');
   const {sampleActionPlan}=await import('/@fs'+root+'/apps/web/src/game/squad/turn3d/effects.ts');
   const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const heroes=['mochi','soot','clover','panko'];
   const owner=[...heroes,'yarn-giant','needle-moth','binding-thread','teacup-healer','kettle-knight'].find(owner=>id.startsWith(owner+'-')||id.startsWith('enemy-'+owner+'-'))??'mochi';
   const fixtureId=heroes.includes(owner)?owner+'-1':'enemy:'+owner;
   const f=pilotFixture(fixtureId),m=window.__depthReview,s=window.__depthScene;
   m.galleryBattle=f.battle;m.plan=null;m.galleryId=fixtureId;m.animationAt=0;m.paused=true;m.sceneStarted=true;m.labOpen=false;m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
   const image=new Image();image.src='/__cxv_texture__/'+encodeURIComponent(id);await image.decode();clearV5Textures();
   if(!registerV5Texture(id,{image,width:image.naturalWidth,height:image.naturalHeight,cols:spec.cols,rows:spec.rows,frameMs:spec.frameMs,blend:spec.blend==='add'?'add':spec.blend==='screen'?'screen':'normal'}))throw Error('Invalid texture geometry '+id);
   const animated=spec.cols*spec.rows>1,particle=id.includes('particle')||id.startsWith('util-');
   const anchor=spec.anchor==='ground'?'ground':spec.anchor==='caster'?'caster':'target';
   const shape=id.includes('decal')?'decal':particle?'mote':id.includes('anticipation')||id.includes('charge')?'charge':id.includes('slash')?'slash':id.includes('projectile')?'projectile':'burst';
   const blend=spec.blend==='add'?'add':spec.blend==='screen'?'screen':'normal';
   const plan={...configureSequence(f.plan),presentationId:'cxv-review'};
   const timeline={...(V5_SKILL_TIMELINES.get(fixtureId)??V5_SKILL_TIMELINES.get('mochi-1')),id:'cxv-review',owner,impactMs:plan.beats[2].start,durationMs:800,layers:[{id,beat:shape==='charge'?'anticipation':'impact',shape,anchor,startMs:0,durationMs:800,blend,easing:'outCubic',texture:id,size:Math.min(2.2,(spec.sizePx??256)/200),alpha:.85,count:particle?4:1}]};
   V5_SKILL_TIMELINES.set('cxv-review',timeline);
   if(!s.effects.timeline.handles(plan))throw Error('Review timeline is not bound to live registry');
   let card=document.querySelector('[data-cxv-texture-review]');if(!card){card=document.createElement('canvas');card.dataset.cxvTextureReview='true';card.width=760;card.height=380;Object.assign(card.style,{position:'fixed',left:'0',top:'0',width:'760px',height:'380px',zIndex:'999999'});document.body.append(card);}
   const layer=document.createElement('canvas');layer.width=s.width;layer.height=s.height;
   window.__cxvTextureReview={id,spec,image,timeline,plan,sampleActionPlan,card,layer,owner,anchor,animated};
   return {owner,shape,anchor,blend,width:image.naturalWidth,height:image.naturalHeight,frames:spec.cols*spec.rows};
  },{root,id,spec});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const samples=[];
  for(let i=0;i<16;i++){
   const audit=await page.evaluate(i=>{
    const s=window.__depthScene,r=window.__cxvTextureReview,progress=(i+.5)/16,ms=progress*800;cancelAnimationFrame(s.raf);s.render({...s.view(),frame:null,fixedTime:20+progress,paused:true},0);
    const view={...s.view(),frame:r.sampleActionPlan(r.plan,ms,false),reducedMotion:false};s.effects.render(view,20+progress,s.width,s.height,[],true);
    const recipient=r.anchor==='caster'?r.plan.actorId:r.plan.targetIds[0];
    const point=s.socket(recipient,r.anchor==='ground'?'feet':r.anchor==='caster'?'mainHand':'vfxOrigin')??{x:s.width/2,y:s.height/2};
    const q=r.card.getContext('2d'),size=300,x=Math.max(0,Math.min(s.width-size,point.x-size/2)),y=Math.max(0,Math.min(s.height-size,point.y-size/2));
    q.globalCompositeOperation='source-over';q.globalAlpha=1;q.fillStyle='#21182d';q.fillRect(0,0,760,380);
    q.drawImage(s.renderer.domElement,x,y,size,size,20,48,320,320);
    q.drawImage(s.renderer.domElement,x,y,size,size,420,48,320,320);q.fillStyle='#07091599';q.fillRect(420,48,160,320);
    const frame=Math.min(r.spec.cols*r.spec.rows-1,Math.floor(progress*r.spec.cols*r.spec.rows)),fw=r.image.naturalWidth/r.spec.cols,fh=r.image.naturalHeight/r.spec.rows;
    q.globalCompositeOperation=r.spec.blend==='add'?'lighter':r.spec.blend==='screen'?'screen':'source-over';
    const w=240,h=w*fh/fw;q.drawImage(r.image,frame%r.spec.cols*fw,Math.floor(frame/r.spec.cols)*fh,fw,fh,580-w/2,208-h/2,w,h);
    q.globalCompositeOperation='source-over';q.fillStyle='#fff4d8';q.font='15px monospace';q.fillText(r.id+' | '+(i+1)+'/16 | frame '+frame,12,21);q.font='13px monospace';q.fillText('Runtime at '+r.anchor+' socket',20,42);q.fillText('Fresh composite / full alpha',420,42);
    const bounds=s.renderer.domElement.getBoundingClientRect();r.card.style.visibility='hidden';
    return {ms,frame,textured:s.effects.timeline.audit.textured,timeline:s.effects.timeline.audit.id,phase:s.effects.timeline.audit.phase,point,clip:{x:Math.round(bounds.x+x),y:Math.round(bounds.y+y),width:size,height:size},blends:s.effects.blendLayers.passes.filter(p=>p.active).map(p=>getComputedStyle(p.canvas).mixBlendMode)};
   },i);
   const live=await page.screenshot({clip:audit.clip});
   await page.evaluate(async src=>{const r=window.__cxvTextureReview,im=new Image();im.src=src;await im.decode();r.card.getContext('2d').drawImage(im,20,48,320,320);r.card.style.visibility='visible';},'data:image/png;base64,'+live.toString('base64'));
   await page.locator('[data-cxv-texture-review]').screenshot({path:resolve(dir,'frame-'+String(i).padStart(2,'0')+'.png')});samples.push(audit);
  }
  const sheet=resolve(out,id+'.jpg'),inputs=[1,5,9,13].flatMap(i=>['-i',resolve(dir,'frame-'+String(i).padStart(2,'0')+'.png')]);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...inputs,'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',sheet]);
  report.textures.push({id,spec,...meta,sha256:hashes[id],sheet,samples});await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2));
  if(!samples.some(s=>s.textured>0))throw Error('No runtime texture draws '+id);process.stdout.write(id+' rendered\n');
 }
 report.errors=errors;if(errors.length)throw Error(errors.join('\n'));report.pass=true;
}catch(error){report.pass=false;report.error=String(error);process.exitCode=1;}
finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2));}
