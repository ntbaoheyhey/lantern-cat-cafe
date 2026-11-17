/** Pixel preflight; suspected layout is evidence, never automatic art approval. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const assetRoot=resolve(process.env.CXV_TEXTURE_ROOT??'/Users/bao/th-v5-ag2/apps/web/public/vfx/v5');
const manifestPath=resolve(process.env.CXV_TEXTURE_MANIFEST??assetRoot+'/manifest.json');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const keys=(process.env.CXV_TEXTURE_KEYS??Object.keys(manifest).join(',')).split(',');
const output=resolve(process.env.CXV_TEXTURE_AUDIT??'work/v5/CXV/texture-preflight.json');
const rows=[];
for(const key of keys){
 const spec=manifest[key];if(!spec)throw Error('Unknown texture '+key);
 const file=resolve(assetRoot,spec.file);if(!file.startsWith(assetRoot+'/'))throw Error('Path escapes asset root');
 const bytes=await readFile(file),metadata=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_streams','-of','json',file],{encoding:'utf8'})).streams[0];
 const width=metadata.width,height=metadata.height,cols=spec.cols,gridRows=spec.rows;
 const issues=[];
 if(!Number.isInteger(cols)||cols<1||!Number.isInteger(gridRows)||gridRows<1||width%cols||height%gridRows)issues.push('invalid declared grid');
 const targetWidth=Math.min(256,width),targetHeight=Math.round(height*targetWidth/width);
 const raw=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',file,'-vf',`scale=${targetWidth}:${targetHeight}`,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','-'],{maxBuffer:32*1024*1024});
 const energy=new Float64Array(targetWidth*targetHeight);let transparent=0,opaque=0;
 for(let i=0;i<energy.length;i++){energy[i]=Math.max(raw[i*4],raw[i*4+1],raw[i*4+2])/255*raw[i*4+3]/255;if(raw[i*4+3]<16)transparent++;if(raw[i*4+3]>239)opaque++;}
 function cells(c,r){
  const result=[];
  for(let row=0;row<r;row++)for(let col=0;col<c;col++){
   const x0=Math.floor(col*targetWidth/c),x1=Math.floor((col+1)*targetWidth/c),y0=Math.floor(row*targetHeight/r),y1=Math.floor((row+1)*targetHeight/r);
   let mass=0,mx=0,my=0,border=0,active=0;const signature=[];
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const value=energy[y*targetWidth+x],u=(x-x0)/(x1-x0),v=(y-y0)/(y1-y0);mass+=value;mx+=u*value;my+=v*value;if(value>.08)active++;if(u<.04||u>.96||v<.04||v>.96)border+=value;signature.push(Math.round(value*255));
   }
   result.push({frame:result.length,occupancy:active/((x1-x0)*(y1-y0)),mass:mass/((x1-x0)*(y1-y0)),centroid:mass?[mx/mass,my/mass]:null,borderFraction:mass?border/mass:0,signature:createHash('sha256').update(Buffer.from(signature)).digest('hex')});
  }return result;
 }
 const declared=cells(Math.max(1,cols),Math.max(1,gridRows)),suspected=cells(4,4);
 function gutter(axis){let seam=0,inside=0,seamN=0,insideN=0;for(let y=0;y<targetHeight;y++)for(let x=0;x<targetWidth;x++){
  const at=(axis==='x'?x/targetWidth:y/targetHeight)*4,fraction=at-Math.floor(at),value=energy[y*targetWidth+x];
  if(Math.floor(at)>0&&fraction<.08){seam+=value;seamN++;}if(fraction>.35&&fraction<.65){inside+=value;insideN++;}
 }return (seam/Math.max(1,seamN))/Math.max(.00001,inside/Math.max(1,insideN));}
 const gutters={x:gutter('x'),y:gutter('y')};
 const suspectedGrid=cols===1&&gridRows===1&&suspected.filter(x=>x.occupancy>.02).length>=12&&gutters.x<.25&&gutters.y<.25?'4x4 collection suspected':null;
 if(suspectedGrid)issues.push(suspectedGrid+' under declared1x1; inspect before runtime use');
 if(declared.every(x=>x.occupancy<.001))issues.push('empty visible content');
 if(declared.length>1&&new Set(declared.map(x=>x.signature)).size<=1)issues.push('all declared frames duplicate');
 const row={key,file,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,width,height,declaredGrid:[cols,gridRows],declaredFrames:cols*gridRows,alpha:{transparentFraction:transparent/energy.length,opaqueFraction:opaque/energy.length},gutters,suspectedGrid,issues,frames:declared,requiresVisualProgressionReview:declared.length>1};
 rows.push(row);console.log(JSON.stringify({key,width,height,frames:row.declaredFrames,issues,alpha:row.alpha}));
}
await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify({utc:new Date().toISOString(),assetRoot,manifestPath,method:'256px luminance*alpha preflight. Gutter inference can flag a collection; it cannot establish coherent temporal animation or G1-G5 art quality.',rows},null,2));
