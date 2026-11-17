/** Current production GPU closure ladder; original-pixel control, no development imports. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
import {DRAWING_EYES} from '../../apps/web/src/game/rig/drawing-eye-regions.ts';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/blink-closure',label);try{await access(out);throw Error('Use a fresh label');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Current production GPU,20original drawings. Columns closure0/.5/.883594/1, rowsK0/K1/K2/K5/K4. Palette/alpha/control measured from isolated drawing in same renderer; visible captures from full production stage. Original-pixel control bypasses only expression sample in same compiled color pipeline. Not real gameplay footage.',rows:[],sheets:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));report.url=page.url();
 await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;for(const e of s.actors.values())e.hurtAt=-100;s.render({...s.view(),frame:null,fixedTime:1.003106305,paused:true,galleryPreview:true},0);s.phaseNoticeAt=-100;});
 for(const owner of ['mochi','soot','clover','panko']){
  const tiles=[];
  for(const [row,[key,clip,seconds]]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]].entries()){
   const sample=await page.evaluate(({owner,key,clip,seconds,fits})=>{
    const s=window.__depthScene,e=[...s.actors.values()].find(e=>e.asset===owner),d=e.craftPose.drawing;
    s.render({...s.view(),frame:null,fixedTime:1.003106305,paused:true,galleryPreview:true},0);s.phaseNoticeAt=-100;
    d.sample(clip,seconds,false,undefined,1.003106305);d.updateWorldMatrix(true,false);
    if(d.key!==key)throw Error('Unexpected drawing key '+d.key+' instead of '+key);
    const width=s.renderer.domElement.width,height=s.renderer.domElement.height,scene=new s.scene.constructor(),mesh=new e.shadow.constructor(d.geometry,d.material);
    mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);mesh.frustumCulled=false;scene.add(mesh);
    const neutral=d.material.clone(),compile=d.material.onBeforeCompile;
    neutral.onBeforeCompile=(shader,renderer)=>{compile.call(d.material,shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('cxvExpressionMap(map,vMapUv)','texture2D(map,vMapUv)');};
    neutral.customProgramCacheKey=()=>d.material.customProgramCacheKey()+'-original-control';
    const clear=s.renderer.getClearColor(d.material.color.clone()),alpha=s.renderer.getClearAlpha(),gl=s.renderer.getContext();
    const render=material=>{mesh.material=material;s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(scene,s.camera);const pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
    const reference=render(neutral);d.expression.sample(d.frame.face,d.set.manifest.canvas,0,0,key);const open=render(d.material);d.expression.sample(d.frame.face,d.set.manifest.canvas,1,1,key);const closed=render(d.material);
    const [fx,fy,fw,fh]=d.frame.face,project=(x,y)=>{const p=d.point([x,y]);return s.screen(d.localToWorld(s.scratch.clone().set(p.x,p.y,0)));};
    const eyes=(fits[key]??[]).map(([cx,cy,rx,ry,roll])=>{const points=Array.from({length:32},(_,i)=>{const t=i*Math.PI/16,x=Math.cos(t)*fw*rx*1.3,y=Math.sin(t)*fh*ry*1.3;return project(fx+fw*cx+x*Math.cos(roll)-y*Math.sin(roll),fy+fh*cy+x*Math.sin(roll)+y*Math.cos(roll));});const x=Math.floor(Math.min(...points.map(p=>p.x)))-2,y=Math.floor(Math.min(...points.map(p=>p.y)))-2;return{x,y,right:Math.ceil(Math.max(...points.map(p=>p.x)))+2,bottom:Math.ceil(Math.max(...points.map(p=>p.y)))+2};});
    let openChanged=0,alphaChanged=0,closedChanged=0,outsideEyeBounds=0;
    for(let i=0;i<open.length;i+=4){const x=i/4%width,y=height-1-Math.floor(i/4/width),inside=eyes.some(r=>x>=r.x&&x<=r.right&&y>=r.y&&y<=r.bottom);
     if(open[i]!==reference[i]||open[i+1]!==reference[i+1]||open[i+2]!==reference[i+2]||open[i+3]!==reference[i+3])openChanged++;
     if(open[i+3]!==closed[i+3])alphaChanged++;
     if(open[i]!==closed[i]||open[i+1]!==closed[i+1]||open[i+2]!==closed[i+2]){closedChanged++;if(!inside)outsideEyeBounds++;}
    }
    neutral.dispose();s.renderer.setClearColor(clear,alpha);s.renderer.clear();s.renderer.render(s.scene,s.camera);
    const corners=[[fx,fy],[fx+fw,fy],[fx,fy+fh],[fx+fw,fy+fh]].map(([x,y])=>project(x,y));
    const x=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x))-16)),y=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y))-16)),right=Math.min(1280,Math.ceil(Math.max(...corners.map(p=>p.x))+16)),bottom=Math.min(720,Math.ceil(Math.max(...corners.map(p=>p.y))+16));
    return{owner,key,width,height,openChanged,alphaChanged,closedChanged,outsideEyeBounds,eyes,crop:{x,y,width:right-x,height:bottom-y}};
   },{owner,key,clip,seconds,fits:DRAWING_EYES[owner]});
   report.rows.push(sample);
   for(const [col,closed]of [0,.5,.883594,1].entries()){
    await page.evaluate(({owner,key,closed})=>{const s=window.__depthScene,d=[...s.actors.values()].find(e=>e.asset===owner).craftPose.drawing;d.expression.sample(d.frame.face,d.set.manifest.canvas,closed,closed,key);s.renderer.render(s.scene,s.camera);},{owner,key,closed});
    const file=resolve(out,`${owner}-${key}-${col}.png`);await page.screenshot({path:file,clip:sample.crop});
    tiles.push({input:await sharp(file).resize(256,200,{fit:'contain',background:'#171326'}).toBuffer(),left:col*256,top:row*200});
   }
  }
  const sheet=resolve(out,owner+'-closure-1024.jpg');await sharp({create:{width:1024,height:1000,channels:3,background:'#171326'}}).composite(tiles).jpeg({quality:90}).toFile(sheet);report.sheets.push(sheet);
 }
 report.errors=errors;report.blockedRequests=blockedRequests;
 report.pass=errors.length===0&&blockedRequests.length===0&&report.rows.length===20&&report.rows.every(r=>r.openChanged===0&&r.alphaChanged===0&&r.outsideEyeBounds===0&&(r.key==='K4'?r.closedChanged===0:r.closedChanged>0));
 report.complete=true;assert(report.pass,'GPU closure control failed');
}catch(e){report.failure=String(e.stack);throw e;}finally{await browser.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({complete:report.complete,pass:report.pass,rows:report.rows.length,sheets:report.sheets,report:resolve(out,'report.json')}));
