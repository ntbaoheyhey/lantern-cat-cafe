import {chromium} from '../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),pilot=process.argv[2]??'QR-P1',out=resolve(root,'reports/v3-feel/REVIEW',pilot);
if(!/^QR-P[123]$/.test(pilot))throw Error('Invalid pilot');
mkdirSync(out+'/raw',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs'+root+'/tools/v3feel-pilot/index.html');
 await page.waitForFunction(()=>window.__pilot?.ready,null,{timeout:60000});
 const data=await page.evaluate(async()=>{
  const p=window.__pilot;await p.prepare();
  const bounds=c=>{const d=c.getContext('2d').getImageData(0,0,1280,720).data;let x0=1280,y0=720,x1=0,y1=0,area=0,sat=0;const lum=[];
   for(let y=0;y<720;y+=2)for(let x=0;x<1280;x+=2){const n=(y*1280+x)*4;if(d[n+3]<21)continue;area+=4;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);const rgb=[d[n],d[n+1],d[n+2]].map(v=>v/255),hi=Math.max(...rgb),lo=Math.min(...rgb);sat+=(hi-lo)/(hi||1);const l=rgb.map(v=>v<.04045?v/12.92:((v+.055)/1.055)**2.4);lum.push(l[0]*.2126+l[1]*.7152+l[2]*.0722);}
   lum.sort((a,b)=>a-b);return {area,areaFraction:area/(1280*720),x:x0,y:y0,width:Math.max(0,x1-x0+2),height:Math.max(0,y1-y0+2),saturation:sat/(area/4||1),p95Luminance:lum[Math.floor(lum.length*.95)]??0};
  };
  const rows=[];
  for(let frame=0;frame<=390;frame++){
   const t=frame*1000/30,state=p.draw(t),row={frame,t,state,actors:p.canvases.map(bounds),effect:bounds(p.effect.union)};
   if(frame%3===0||state.kind&&Math.abs(state.elapsed-p.recipe[state.kind].impact)<150)row.layers=Object.fromEntries([...p.effect.layers].map(([name,c])=>[name,bounds(c)]));
   rows.push(row);
  }
  return {at:new Date().toISOString(),rows,errors:[],recipe:p.recipe,actions:p.actions,cues:p.cues,audioBuffers:[...p.sound.buffers].map(([k,b])=>({type:k,duration:b.duration})),method:'Deterministic seek through production cut-out renderer, two-pixel grid alpha >= 21/255. Not real-time FPS or listening evidence.'};
 });
 data.errors=errors;
 const best={};for(const kind of ['basic','ultimate'])best[kind]=data.rows.filter(r=>r.state.kind===kind).sort((a,b)=>b.effect.area-a.effect.area)[0];
 for(const [kind,row] of Object.entries(best)){
  const result=await page.evaluate(t=>{const p=window.__pilot;p.draw(t);return {image:p.frame(),mask:p.effect.union.toDataURL('image/png')};},row.t);
  for(const type of ['image','mask'])writeFileSync(`${out}/${kind}-peak-${type}.png`,Buffer.from(result[type].split(',')[1],'base64'));
 }
 writeFileSync(out+'/measurements.json',JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify({errors,peak:Object.fromEntries(Object.entries(best).map(([k,r])=>[k,{frame:r.frame,...r.effect}]))}));
 // Every key-state sheet; these are seeking evidence, not a replacement for the recording.
 for(let frame=0;frame<=390;frame+=3){
  const png=await page.evaluate(t=>{window.__pilot.draw(t);return window.__pilot.frame();},frame*1000/30);
  writeFileSync(`${out}/raw/seek-${String(frame).padStart(4,'0')}.png`,Buffer.from(png.split(',')[1],'base64'));
 }
}finally{await browser.close();}
