/** Scoped T9 encoding experiment. Writes candidates only; never changes source art or manifests. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root=resolve(import.meta.dirname,'../..'),label=process.argv[2],quality=Number(process.argv[3]??60),speed=Number(process.argv[4]??4);
assert(/^[a-z0-9-]+$/.test(label??''));assert(Number.isInteger(quality)&&quality>=1&&quality<=100);assert(Number.isInteger(speed)&&speed>=0&&speed<=10);
const out=resolve(root,'work/v5/CXI/native-half',label),reportPath=resolve(out,'report.json');
try{await access(out);throw Error('Fresh label required');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});sharp.concurrency(2);sharp.cache(false);
const inputs={
 'kettle-knight':'3b3110cb3728bad05a062f7d3ab9fe1c1558ef88a5f5e49660cbc80bc6ded2e6',
 'crumb-sentinel':'32a284e838ae5ea9ccdbccadbf37feed698dad0632e818f10871c97d88bd6a27',
 'pollen-scout':'c80ee3edf82207697b9f9060927a89ef6a7430eb877d458d9ce0fcf544ca5fbd',
 'spool-ram':'2ed024f8c69dd785994c84f56d916edf61aa07f2944540a44d823b4e802099e8'
};
const targetFrom=process.argv[5],targetTotal=Number(process.argv[6]??145000);
let targets;
if(targetFrom){
 assert(/^[a-z0-9-]+$/.test(targetFrom));assert(Number.isSafeInteger(targetTotal)&&targetTotal>0);
 const basePath=resolve(root,'work/v5/CXI/native-half',targetFrom),base=JSON.parse(await readFile(resolve(basePath,'report.json'),'utf8'));
 assert(base.complete&&base.rows.length===4);
 const parts=await Promise.all(base.rows.map(async row=>{assert.equal(row.sourceSha256,inputs[row.id]);const log=await readFile(resolve(basePath,row.id+'-encoder.log'),'utf8'),color=Number(/Color total size: (\d+)/.exec(log)?.[1]),alpha=Number(/Alpha total size: (\d+)/.exec(log)?.[1]);assert(color>0&&alpha>0);return{id:row.id,color,fixed:row.bytes-color};}));
 const fixed=parts.reduce((s,r)=>s+r.fixed,0),color=parts.reduce((s,r)=>s+r.color,0);assert(targetTotal>fixed);
 targets=Object.fromEntries(parts.map(r=>[r.id,Math.floor(r.fixed+(targetTotal-fixed)*r.color/color)]));
}
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),toolSha256:hash(await readFile(import.meta.filename)),method:'Pinned existing half-WebP decoded to same-size sRGB PNG, AVIF444/full/CICP1-13-6 with lossless alpha; composite errors on black and white. Numeric fidelity and size gates do not establish visual acceptance.',encoder:execFileSync('avifenc',['--version'],{encoding:'utf8'}).trim(),settings:{quality,alphaQuality:100,speed,jobs:2,yuv:'444',range:'full',cicp:'1/13/6'},rows:[],complete:false};
const save=()=>writeFile(reportPath,JSON.stringify(report,null,2)+'\n');await save();
if(targets)Object.assign(report.settings,{quality:null,targetFrom,targetTotal,targets});
for(const [id,pin]of Object.entries(inputs)){
 for(const name of ['STOP-ALL','STOP-CXI']){try{await access('/Users/bao/taskbar-hero-mailbox/'+name);throw Error(name+' exists');}catch(e){if(e.code!=='ENOENT')throw e;}}
 const source=`apps/web/public/units/${id}/rig-depth.half.webp`,bytes=await readFile(resolve(root,source));assert.equal(hash(bytes),pin);
 const sourceMeta=await sharp(bytes).metadata(),png=resolve(out,id+'.png'),avif=resolve(out,id+'.avif');
 await sharp(bytes).toColourspace('srgb').png().toFile(png);
 const {data:a,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const args=['--no-overwrite',...(targets?['--target-size',String(targets[id])]:['--qcolor',String(quality)]),'--qalpha','100','--speed',String(speed),'--jobs','2','--yuv','444','--range','full','--cicp','1/13/6',png,avif];
 const start=performance.now();const log=execFileSync('avifenc',args,{encoding:'utf8'});const encodeMs=performance.now()-start;await writeFile(resolve(out,id+'-encoder.log'),log);
 const encoded=await readFile(avif),meta=await sharp(encoded).metadata();assert.equal(meta.width,sourceMeta.width);assert.equal(meta.height,sourceMeta.height);assert.equal(meta.hasAlpha,sourceMeta.hasAlpha);
 const b=await sharp(encoded).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length);
 let alphaMaxError=0,alphaChangedPixels=0,visiblePixels=0,sum=0,max=0;
 for(let i=0;i<a.length;i+=4){const da=Math.abs(a[i+3]-b[i+3]);alphaMaxError=Math.max(alphaMaxError,da);alphaChangedPixels+=Number(da>0);if(a[i+3])visiblePixels++;
  for(const bg of [0,255])for(let c=0;c<3;c++){const d=(a[i+c]*a[i+3]+bg*(255-a[i+3])-b[i+c]*b[i+3]-bg*(255-b[i+3]))/255;sum+=d*d;max=Math.max(max,Math.abs(d));}
 }
 assert.equal(alphaMaxError,0,'Every source alpha sample must match');
 const compositeRmse=Math.sqrt(sum/(a.length/4*6)),visibleCompositeRmse=Math.sqrt(sum/(visiblePixels*6));
 const row={id,source,sourceSha256:pin,sourceBytes:bytes.length,output:avif,sha256:hash(encoded),bytes:encoded.length,saving:bytes.length-encoded.length,width:info.width,height:info.height,alphaMaxError,alphaChangedPixels,visiblePixels,compositeRmse,visibleCompositeRmse,visibleCompositePsnr:20*Math.log10(255/visibleCompositeRmse),compositeMaxError:max,encodeMs};
 report.rows.push(row);await save();console.log(JSON.stringify(row));
}
report.totals={source:report.rows.reduce((s,r)=>s+r.sourceBytes,0),candidate:report.rows.reduce((s,r)=>s+r.bytes,0)};report.totals.saving=report.totals.source-report.totals.candidate;
report.sizePass=report.totals.saving>=90000&&report.rows.every(r=>r.bytes<r.sourceBytes*.8);report.complete=true;report.finishedUtc=new Date().toISOString();await save();console.log(JSON.stringify({complete:true,sizePass:report.sizePass,totals:report.totals,reportPath}));
