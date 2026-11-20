/** Independent decoded asset mask check for the pending metadata crop. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));const out=resolve(root,'work/v5/CXI/render-review',label);assert(!existsSync(out));await mkdir(out,{recursive:true});sharp.concurrency(2);
const mapping=JSON.parse(await readFile(resolve(root,'apps/web/src/game/cardrpg/spine/pose-manifest-loader.json'),'utf8')),files=execFileSync('rg',['--files','apps/web/public/units','-g','manifest.json'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p=>p.includes('/poses/')).sort(),hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),toolSha256:hash(await readFile(import.meta.filename)),method:'Independent sharp decode of every authored original pose and selected delivery. Verify all alpha>=128 pixels lie within the metadata crop plus2px guard; preserve source coordinates. This is offline asset-mask evidence, not native browser or visual acceptance.',rows:[],complete:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await save();
try{
 for(const file of files){const bytes=await readFile(resolve(root,file)),m=JSON.parse(bytes);for(const[key,frame]of Object.entries(m.poses)){
  const original='/units/'+m.unit+'/poses/'+frame.image,urls={original,delivered:mapping[original]?.avif??original};
  for(const[mode,url]of Object.entries(urls)){
   const bytes=await readFile(resolve(root,'apps/web/public'+url)),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[width,height]=m.canvas;assert.equal(info.width,width);assert.equal(info.height,height);
   const b=frame.opaqueBounds;assert(Array.isArray(b)&&b.length===4&&b.every(Number.isSafeInteger)&&b[0]>=0&&b[1]>=0&&b[2]>b[0]&&b[3]>b[1]&&b[2]<=width&&b[3]<=height);
   const crop=[Math.max(0,b[0]-2),Math.max(0,b[1]-2),Math.min(width,b[2]+2),Math.min(height,b[3]+2)];let outside=0,painted=0;const alpha=Buffer.alloc(width*height);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){const a=data[(y*width+x)*4+3];alpha[y*width+x]=a;if(a<128)continue;painted++;if(x<crop[0]||y<crop[1]||x>=crop[2]||y>=crop[3])outside++;}
   assert.equal(outside,0,m.unit+' '+key+' '+mode);assert(painted>0);report.rows.push({unit:m.unit,key,mode,url,sha256:hash(bytes),width,height,bounds:b,crop,painted,outside,alphaSha256:hash(alpha),fullPixels:width*height,cropPixels:(crop[2]-crop[0])*(crop[3]-crop[1])});
  }
 }}report.complete=true;report.totals={assets:report.rows.length,fullPixels:report.rows.reduce((s,r)=>s+r.fullPixels,0),cropPixels:report.rows.reduce((s,r)=>s+r.cropPixels,0)};
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{report.finishedUtc=new Date().toISOString();await save();console.log(JSON.stringify({out,complete:report.complete,totals:report.totals,failure:report.failure}));}
