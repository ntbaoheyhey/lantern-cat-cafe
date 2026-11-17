/** Browser-only hypothesis: bounded rounded-face projection, never a delivery capture. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const out=resolve('work/v5/CXV/films/V7-A3-prototype');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Browser-only projection hypothesis over unchanged V6 mesh; forced +/-12 degree yaw,8 degree pitch. Not production or idle-quality evidence.',rows:[]};
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 await page.evaluate(()=>{
  const s=window.__depthScene;window.__faceTurn={yaw:0,pitch:0};
  for(const e of s.actors.values()){
   if(!['mochi','soot','clover','panko'].includes(e.asset))continue;
   const d=e.craftPose.drawing,base=d.point;
   d.point=function(p,key,at,out){
    const result=base.call(this,p,key,at,out),[fx,fy,w,h]=this.frame.face,[x,y]=p;
    const dx=x-fx-w*.55,dy=y-fy-h*.52,u=dx/(w*.62),v=dy/(h*.78);
    const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
    const dome=smooth(1-u*u-v*v),nose=smooth(1-((x-fx-w*.60)/(w*.22))**2-((y-fy-h*.64)/(h*.28))**2);
    const z=w*(.28*dome+.10*nose),yaw=window.__faceTurn.yaw*Math.PI/180,pitch=window.__faceTurn.pitch*Math.PI/180;
    result.x+=(dx*(Math.cos(yaw)-1)*dome+z*Math.sin(yaw))*this.pixelScale;
    result.y-=(dy*(Math.cos(pitch)-1)*dome-z*Math.sin(pitch))*this.pixelScale;
    return result;
   };
  }
 });
 for(const [name,yaw,pitch]of [['base',0,0],['left',-12,0],['right',12,0],['up',0,8]]){
  const audit=await page.evaluate(({yaw,pitch})=>{
   const s=window.__depthScene;window.__faceTurn={yaw,pitch};s.render({...s.view(),frame:null,fixedTime:20.2,paused:true,galleryPreview:true},0);
   return [...s.actors].filter(([,e])=>['mochi','soot','clover','panko'].includes(e.asset)).map(([id,e])=>{
    const d=e.craftPose.drawing,[x,y,w,h]=d.frame.face,b=s.anchors.find(a=>a.id===id).body;
    return {id,owner:e.asset,feet:d.contactPoints(),nose:d.point([x+w*.60,y+h*.64]),left:d.point([x+w*.40,y+h*.44]),right:d.point([x+w*.74,y+h*.40]),clip:{x:Math.max(0,Math.floor(b.x-24)),y:Math.max(0,Math.floor(b.y-20)),width:Math.ceil(b.width+48),height:Math.ceil(b.height+40)}};
   });
  },{yaw,pitch});
  await page.screenshot({path:resolve(out,name+'.png')});
  for(const row of audit)await page.screenshot({path:resolve(out,row.owner+'-'+name+'.png'),clip:row.clip});
  report.rows.push({name,yaw,pitch,audit});
 }
 report.errors=errors;
 for(const owner of ['mochi','soot','clover','panko'])execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...['base','left','right','up'].flatMap(name=>['-i',resolve(out,owner+'-'+name+'.png')]),'-filter_complex','[0:v]scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:-1:-1[a];[1:v]scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:-1:-1[b];[2:v]scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:-1:-1[c];[3:v]scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:-1:-1[d];[a][b][c][d]hstack=inputs=4[v]','-map','[v]','-frames:v','1','-q:v','4',resolve(out,owner+'.jpg')]);
}finally{await browser.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,rows:report.rows.length,errors:report.errors}));
