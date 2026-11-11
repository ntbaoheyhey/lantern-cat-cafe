/** Live battle framing: inspect animated Spine geometry, not only setup rectangles. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-framing-'+(baseline?'before':'after');
if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid tag');
const out=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const scenes=[['button-guard','binding-thread','needle-moth'],['kettle-knight','spool-ram','needle-moth'],['yarn-giant'],['rain-spool'],['pantry-crown']];
const report={method:'Isolated seed71 real A6/V5 ultimates; animated skeleton bounds sampled at30fps, both sizes/motion modes. No progression or timing benchmark.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
 for(const[width,height]of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  const ids=await page.evaluate(async pilot=>{const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');return pilot?['inkcap-4']:R.CATS.map(c=>c.id+'-4');},baseline||process.argv.includes('--pilot'));
  for(const id of ids)for(const enemies of scenes)for(const reduced of [false,true]){
   await page.evaluate(async({id,enemies,reduced})=>{
    const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts'),G=await import('/src/game/cardrpg/depth/feel-lab.ts');
    const b=R.createBattle({...G.galleryFixture(id).battle.initial,enemies}),a=b.actors.find(a=>a.catalogId===id.split('-')[0]);
    a.skills=R.CAT_BY_ID[a.catalogId].skills.map(s=>s.id);a.charge=100;a.turns=3;
    const patient=b.actors.find(x=>x.side==='party'&&x.id!==a.id);patient.hp=id==='cinnamon-4'?0:Math.floor(patient.maxHp*.2);
    b.queue=[a.id,...b.queue.filter(x=>x!==a.id)];b.v4.committed=true;
    const m=window.__depthReview;m.galleryBattle=null;m.replay=null;m.tutorialBattle=b;m.plan=null;m.animationAt=0;m.watching=true;m.paused=false;m.screen='map';m.sceneStarted=true;m.sceneReady=true;m.sceneError='';m.state.settings.reducedMotion=reduced;m.state.settings.speed=1;
    m.act(R.legalChoices(b).find(c=>c.skillId===id));if(!m.plan)throw Error('No plan '+id);m.impactApplied=true;m.paused=true;m.notify(false);
   },{id,enemies,reduced});
   await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&s.audit().stage.source==='painted'&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
   const result=await page.evaluate(async()=>{
    const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),m=window.__depthReview,s=window.__depthScene;
    if(!window.framingView){window.framingView=s.view.bind(s);s.view=()=>({...window.framingView(),fixedTime:window.framingTime});}
    window.framingTime=3;s.prepare(s.view());s.effects.clear();s.eventAudit.length=0;
    const vec=new T.Vector3(),before=JSON.stringify(m.battle);let worst=null,min=Infinity,overlaps=0,draws=0,maxZoom=1,minCat=Infinity,maxCat=0,maxBoss=0,maxCameraX=0,maxCatSpread=1;
    for(let at=0;at<=m.plan.duration+300;at+=1000/30){
     m.animationAt=at;window.framingTime=3+at/1000;s.render(s.view(),0);
     const size=s.sizeAudit();maxZoom=Math.max(maxZoom,s.camera.zoom);maxCameraX=Math.max(maxCameraX,Math.abs(s.camera.position.x));overlaps=Math.max(overlaps,s.labelAudit.overlaps);draws=Math.max(draws,s.stats.calls+s.effects.stats.draws);
     const cats=size.units.filter(u=>u.side==='party').map(u=>u.ratio);maxCatSpread=Math.max(maxCatSpread,Math.max(...cats)/Math.min(...cats));
     for(const unit of size.units){if(unit.side==='party'){minCat=Math.min(minCat,unit.ratio);maxCat=Math.max(maxCat,unit.ratio);}if(unit.kind==='boss')maxBoss=Math.max(maxBoss,unit.ratio);}
     for(const [unit,e]of s.actors){
      const b=e.actor.mesh?.skeleton.getBoundsRect()??e.actor.bounds;
      const a=e.actor.root.localToWorld(vec.set(b.x,b.y,0)).project(s.camera),left=(a.x*.5+.5)*size.width,bottom=(.5-a.y*.5)*size.height;
      const c=e.actor.root.localToWorld(vec.set(b.x+b.width,b.y+b.height,0)).project(s.camera),right=(c.x*.5+.5)*size.width,top=(.5-c.y*.5)*size.height;
      const box={x:Math.min(left,right),y:Math.min(top,bottom),width:Math.abs(left-right),height:Math.abs(top-bottom)};
      const margin=Math.min(box.x,box.y,size.width-box.x-box.width,size.height-box.y-box.height);
      if(margin<min){min=margin;worst={at,unit,asset:e.asset,box,zoom:s.camera.zoom,stage:{width:size.width,height:size.height}};}
     }
    }
    const result={min,worst,maxZoom,minCat,maxCat,maxBoss,maxCameraX,maxCatSpread,overlaps,draws,unchanged:before===JSON.stringify(m.battle),hits:s.eventAudit.filter(e=>e.name==='hit').length};
    // Return to the worst pose sequentially so the captured frame has valid event state.
    const p=m.plan;m.plan={...p};s.prepare(s.view());for(let at=0;at<=worst.at+.01;at+=1000/30){m.animationAt=at;window.framingTime=6+at/1000;s.render(s.view(),0);}m.notify(false);
    return result;
   });
   report.cases.push({width,height,id,enemies,reduced,...result});
   if(id==='inkcap-4'&&!reduced){const file=`${enemies[0]}-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});}
   if(!baseline&&(result.min<3||result.overlaps||result.minCat<.22||result.maxCatSpread>1.08||result.maxBoss>.55||result.draws>150||!result.unchanged||result.hits!==1||reduced&&(result.maxCameraX||result.maxZoom!==1)))throw Error('Framing gate '+JSON.stringify(report.cases.at(-1)));
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,worst:Math.min(...report.cases.map(c=>c.min)),draws:Math.max(...report.cases.map(c=>c.draws)),errors:report.errors}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
