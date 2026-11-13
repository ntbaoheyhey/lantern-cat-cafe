import {createRequire} from 'node:module';import {readFile,writeFile,mkdir,rm,copyFile} from 'node:fs/promises';import {resolve} from 'node:path';import {spawn} from 'node:child_process';import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),out=resolve(root,'reports/v3-battle/A5'),contract=JSON.parse(await readFile(resolve(root,'art/rig-templates/cat.template.json'),'utf8'));
const args=process.argv.slice(2),pilot=args.includes('--pilot'),ids=args.filter(a=>!a.startsWith('--')),all=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json'),'utf8')).units.map(u=>u.id).filter(id=>!['mochi','soot','clover'].includes(id));await mkdir(out,{recursive:true});
async function pixels(buffer){return sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
async function holes(buffer){
 const {data,info:{width:w,height:h}}=await pixels(buffer),solid=new Uint8Array(w*h),outside=new Uint8Array(w*h),queue=new Int32Array(w*h);let tail=0,head=0;
 for(let i=0;i<solid.length;i++)solid[i]=data[i*4+3]>=16?1:0;
 const add=i=>{if(i>=0&&i<solid.length&&!solid[i]&&!outside[i]){outside[i]=1;queue[tail++]=i;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);if(x>0)add(i-1);if(x<w-1)add(i+1);if(y>0)add(i-w);if(y<h-1)add(i+w);}
 let count=0;const seen=new Uint8Array(w*h),components=[];
 for(let i=0;i<solid.length;i++)if(!solid[i]&&!outside[i]&&!seen[i]){
  const points=[i];seen[i]=1;let sumX=0,sumY=0,area=0;
  for(let j=0;j<points.length;j++){const k=points[j],x=k%w,y=Math.floor(k/w);sumX+=x;sumY+=y;let interior=true;
   // Erode each transparent component by two pixels, excluding anti-alias pinholes.
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const p=(y+dy)*w+x+dx;if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h||solid[p]||outside[p])interior=false;}
   if(interior)area++;for(const p of [k-1,k+1,k-w,k+w])if(p>=0&&p<solid.length&&!solid[p]&&!outside[p]&&!seen[p]){seen[p]=1;points.push(p);}
  }
  if(area){count+=area;components.push({area,x:Math.round(sumX/points.length),y:Math.round(sumY/points.length)});}
 }
 return{pixels:count,components:components.sort((a,b)=>b.area-a.area),opaque:solid.reduce((n,p)=>n+p,0)};
}
async function difference(a,b){const pa=await pixels(a),pb=await pixels(b);let sum=0,n=0;for(let i=0;i<pa.data.length;i+=4)if(pa.data[i+3]>=16||pb.data[i+3]>=16){for(let j=0;j<4;j++)sum+=Math.abs(pa.data[i+j]-pb.data[i+j]);n+=4;}return sum/Math.max(1,n*255);}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:640,height:640}}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
const capture=async(name,at)=>{await page.evaluate(([name,at])=>window.rigs.pose(name,at),[name,at]);return page.locator('canvas').screenshot({omitBackground:true});};
const exec=args=>new Promise((yes,no)=>{const proc=spawn('ffmpeg',args,{stdio:'ignore'});proc.on('exit',code=>code===0?yes():no(Error('ffmpeg '+code)));});
try{
 await page.goto('http://127.0.0.1:5990/@fs'+resolve(root,'tools/cinematic-compositor/rigs.html'));await page.waitForFunction(()=>window.rigs,null,{timeout:60000});
 for(const id of (ids.length?ids:all)){
  await page.evaluate(id=>window.rigs.load(id,true),id);const reference=await capture('idle',0),referenceHoles=await holes(reference);
  const info=await page.evaluate(id=>window.rigs.load(id),id),rest=await capture('idle',0),restDifference=await difference(reference,rest),unitOut=resolve(out,id);await mkdir(unitOut,{recursive:true});
  const report={id,source:info.source,restDifference,referenceHoles,extremes:[],seams:{},events:{},contract:info.source==='template'&&contract.hierarchy.every(([name])=>info.nodes.includes(name))};
  const poses=[['attack',.18],['attack',.26],['cast',.35],['ultimate',.55],['hit',.06],['death',.7],['stunned',.9],['enter',0]];
  const extreme=[];
  for(const [i,[name,at]] of poses.entries()){const image=await capture(name,at),hole=await holes(image);report.extremes.push({name,at,...hole});extreme.push({input:await sharp(image).resize(320,320).toBuffer(),left:i%4*320,top:Math.floor(i/4)*320});}
  await sharp({create:{width:1280,height:640,channels:4,background:'#342a40'}}).composite(extreme).png().toFile(resolve(unitOut,'extremes.png'));
  for(const name of ['idle','victory','stunned','frozen'])report.seams[name]=await difference(await capture(name,0),await capture(name,info.clips[name].duration));
  for(const [name,duration] of Object.entries(contract.clips)){
   if(!info.clips[name]){report.contract=false;continue;}const strip=[],d=info.clips[name].duration;
   for(let i=0;i<12;i++){const shot=await capture(name,d*i/11);strip.push({input:await sharp(shot).resize(212,212).toBuffer(),left:i%6*212,top:Math.floor(i/6)*212});}
   await sharp({create:{width:1272,height:424,channels:4,background:'#342a40'}}).composite(strip).png().toFile(resolve(unitOut,name+'-film.png'));
   report.events[name]=info.clips[name].cues.map(c=>c.name);
   if((contract.events[name]??[]).some(([event,time])=>!info.clips[name].cues.some(c=>c.name===event&&Math.abs(c.time-time)<1/30)))report.contract=false;
  }
  if(pilot){
   const temp=resolve(root,'work/rig-capture',id);await mkdir(temp,{recursive:true});let index=0;
   for(const name of Object.keys(contract.clips)){const d=info.clips[name].duration;for(let f=0;f<Math.ceil(d*30);f++){const shot=await capture(name,f/30);const caption=Buffer.from(`<svg width="640" height="48"><text x="24" y="32" fill="#ffe3ad" font-family="sans-serif" font-size="23">${id} · ${name}</text></svg>`);await sharp({create:{width:640,height:640,channels:4,background:'#342a40'}}).composite([{input:shot},{input:caption,left:0,top:0}]).png().toFile(resolve(temp,String(index++).padStart(5,'0')+'.png'));}}
   const target=resolve(out,'rig-pilot-'+id+'.webm');await exec(['-hide_banner','-loglevel','error','-y','-framerate','30','-i',resolve(temp,'%05d.png'),'-vf','scale=720:720,pad=1280:720:280:0:color=0x342a40','-c:v','libvpx-vp9','-b:v','0','-crf','38','-row-mt','1','-cpu-used','5','-pix_fmt','yuv420p',target]);await copyFile(target,resolve('/Users/bao/Desktop/TaskbarHero-REVIEW','rig-pilot-'+id+'.webm'));await rm(temp,{recursive:true,force:true});
  }
  report.gates={rest:restDifference<.02,holes:report.extremes.every(p=>p.pixels===0),seams:Object.values(report.seams).every(d=>d<.01),contract:report.contract};
  results.push(report);await writeFile(resolve(unitOut,'qa.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id,restDifference,holes:report.extremes.map(p=>p.pixels),reference:referenceHoles.pixels,seams:report.seams,contract:report.contract}));
 }
 await writeFile(resolve(out,pilot?'pilot-qa.json':'qa.json'),JSON.stringify({errors,results},null,2)+'\n');if(errors.length||results.some(r=>Object.values(r.gates).some(passed=>!passed)))process.exitCode=1;
}finally{await browser.close();}
