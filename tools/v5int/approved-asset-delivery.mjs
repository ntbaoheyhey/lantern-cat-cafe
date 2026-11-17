/** Encode only integrity-approved originals. Study first; publish explicitly after review. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const root=resolve(import.meta.dirname,'../..');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
 const match=/^--([a-z-]+)=(.*)$/.exec(arg);assert(match,'Use --name=value');return [match[1],match[2]];
}));
assert(Object.keys(args).every(k=>['label','publish','vfx-quality','portrait-quality','speed','target-from'].includes(k)));
assert(/^[a-z0-9-]+$/.test(args.label??''),'Choose a fresh evidence label');
const out=resolve(root,'work/v5/CXI/asset-delivery',args.label),reportPath=resolve(out,'report.json');
const hash=b=>createHash('sha256').update(b).digest('hex');
const integrity=b=>'sha256-'+createHash('sha256').update(b).digest('base64');
const approved=JSON.parse(await readFile(resolve(root,'apps/web/src/game/cardrpg/spine/v5-approved-manifest-loader.json')));
assert.equal(Object.keys(approved).length,12);
const stop=async()=>{for(const name of ['STOP-ALL','STOP-CXI']){let exists=true;try{await access('/Users/bao/taskbar-hero-mailbox/'+name);}catch(e){if(e.code==='ENOENT')exists=false;else throw e;}assert(!exists,'STOP: '+name);}};
await stop();

if(args.publish==='yes'){
 const report=JSON.parse(await readFile(reportPath));assert(report.complete&&report.budgetPass);
 const vfx={},portraits={};
 for(const row of report.rows){
  const source=await readFile(resolve(root,row.source)),encoded=await readFile(resolve(out,row.studyFile));
  assert.equal(hash(source),row.sourceSha256,'Original changed');assert.equal(hash(encoded),row.sha256,'Candidate changed');assert.equal(row.alphaMaxError,0);
  if(row.kind==='vfx')assert.equal(integrity(source),approved[row.id].integrity);
  const target=resolve(root,'apps/web/public',row.url.slice(1));await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,encoded);
  if(row.kind==='vfx')vfx[row.id]={file:row.url.replace('/vfx/v5/',''),integrity:row.integrity,sourceIntegrity:integrity(source),width:row.width,height:row.height};
  else portraits[row.id]={src:row.url,width:row.width,height:row.height,sourceSha256:row.sourceSha256,sha256:row.sha256};
 }
 await writeFile(resolve(root,'apps/web/src/game/cardrpg/spine/v5-avif-manifest-loader.json'),JSON.stringify(vfx,null,2)+'\n');
 await writeFile(resolve(root,'apps/web/src/game/cardrpg/ui-v3/home-portrait-manifest-loader.json'),JSON.stringify(portraits,null,2)+'\n');
 console.log(JSON.stringify({published:true,vfx:Object.keys(vfx).length,portraits:Object.keys(portraits).length,totals:report.totals}));
 process.exit(0);
}
try{await access(reportPath);throw Error('Preserve prior evidence; use a fresh label');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});sharp.concurrency(2);
const quality={vfx:Number(args['vfx-quality']??40),portrait:Number(args['portrait-quality']??55)};
const speed=Number(args.speed??4);assert(Number.isInteger(speed)&&speed>=0&&speed<=10);
if(args['target-from'])assert(/^[a-z0-9-]+$/.test(args['target-from']));
const targetBase=args['target-from']?JSON.parse(await readFile(resolve(root,'work/v5/CXI/asset-delivery',args['target-from'],'report.json'))):null;
const targetTotals={vfx:340000,portrait:106000};
for(const q of Object.values(quality))assert(Number.isInteger(q)&&q>0&&q<=100);
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),versions:{sharp:sharp.versions,avifenc:execFileSync('avifenc',['--version'],{encoding:'utf8'}).trim()},method:'Original source SHA256, sRGB, VFX original dimensions, portraits proportional384w Lanczos3; AVIF444/full/CICP1-13-6, qalpha100, recorded speed,2workers. Composite error measured over black and white against original or lossless resized original. Metrics are not visual acceptance.',rows:[],complete:false};
const inputs=[...Object.entries(approved).map(([id,row])=>({id,kind:'vfx',source:'apps/web/public/vfx/v5/'+row.file,approved:row})),...['mochi','soot','clover','panko'].map(id=>({id,kind:'portrait',source:`assets/cardrpg-a6/illustrations/${id}.webp`}))];
for(const item of inputs){
 await stop();const source=await readFile(resolve(root,item.source)),sourceMeta=await sharp(source).metadata();
 if(item.approved)assert.equal(integrity(source),item.approved.integrity,'Unapproved source');
 let input=sharp(source).toColourspace('srgb');if(item.kind==='portrait')input=input.resize({width:384,kernel:'lanczos3'});
 const png=resolve(out,item.id+'.png');await input.clone().png().toFile(png);
 const {data:a,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const studyFile=item.id+'.avif',output=resolve(out,studyFile),start=performance.now();
 const targetBytes=targetBase?Math.floor(targetBase.rows.find(r=>r.kind===item.kind&&r.id===item.id).bytes*targetTotals[item.kind]/targetBase.totals[item.kind]):null;
 const encoderArgs=['--no-overwrite',...(targetBytes?['--target-size',String(targetBytes)]:['--qcolor',String(quality[item.kind])]),'--qalpha','100','--speed',String(speed),'--jobs','2','--yuv','444','--range','full','--cicp','1/13/6',png,output];
 const encoderLog=execFileSync('avifenc',encoderArgs,{encoding:'utf8'});await writeFile(resolve(out,item.id+'-encoder.log'),encoderLog);
 const encodeMs=performance.now()-start,encoded=await readFile(output),meta=await sharp(encoded).metadata();
 assert.equal(meta.width,info.width);assert.equal(meta.height,info.height);assert.equal(meta.hasAlpha,sourceMeta.hasAlpha);
 if(item.kind==='vfx'){assert.equal(meta.width,sourceMeta.width);assert.equal(meta.height,sourceMeta.height);assert.equal(meta.width%item.approved.cols,0);assert.equal(meta.height%item.approved.rows,0);}
 const decodeStart=performance.now(),b=await sharp(encoded).ensureAlpha().raw().toBuffer(),decodeMs=performance.now()-decodeStart;
 let alphaMaxError=0,alphaChangedPixels=0,sum=0,max=0;
 for(let i=0;i<a.length;i+=4){const da=Math.abs(a[i+3]-b[i+3]);alphaMaxError=Math.max(alphaMaxError,da);alphaChangedPixels+=da>0?1:0;
  for(const bg of [0,255])for(let c=0;c<3;c++){const d=(a[i+c]*a[i+3]+bg*(255-a[i+3])-b[i+c]*b[i+3]-bg*(255-b[i+3]))/255;sum+=d*d;max=Math.max(max,Math.abs(d));}}
 assert.equal(alphaMaxError,0,'Alpha must match every source sample');
 const rmse=Math.sqrt(sum/(a.length/4*6)),sha256=hash(encoded),file=`${item.id}-${sha256.slice(0,12)}.avif`;
 const row={id:item.id,kind:item.kind,source:item.source,sourceSha256:hash(source),sourceBytes:source.length,sourceWidth:sourceMeta.width,sourceHeight:sourceMeta.height,width:meta.width,height:meta.height,alpha:meta.hasAlpha,alphaMaxError,alphaChangedPixels,quality:quality[item.kind],chromaSubsampling:'4:4:4',alphaQuality:100,bytes:encoded.length,sha256,integrity:integrity(encoded),url:item.kind==='vfx'?'/vfx/v5/'+file:'/art/v5-delivery/home-portraits/'+file,studyFile,compositeRmse:rmse,compositePsnr:20*Math.log10(255/rmse),compositeMaxError:max,encodeMs,decodeMs};
 row.speed=speed;row.targetBytes=targetBytes;if(targetBytes)row.quality=null;
 report.rows.push(row);console.log(JSON.stringify({id:row.id,kind:row.kind,bytes:row.bytes,alphaMaxError,compositePsnr:row.compositePsnr}));
 await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
}
report.totals=Object.fromEntries(['vfx','portrait'].map(kind=>[kind,report.rows.filter(r=>r.kind===kind).reduce((s,r)=>s+r.bytes,0)]));
report.budgetPass=report.totals.vfx<=350000&&report.totals.portrait<=110000;report.complete=true;
report.encoderSettings={speed,yuv:'444',range:'full',cicp:'1/13/6',alphaQuality:100,targetFrom:args['target-from']??null};
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({complete:true,budgetPass:report.budgetPass,totals:report.totals,reportPath}));
