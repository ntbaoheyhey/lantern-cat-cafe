/** Measure a static particle before visual review; no creative editing. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const input=resolve(process.argv[2]),output=resolve(process.argv[3]);
const bytes=readFileSync(input),meta=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height,pix_fmt','-of','json',input],{encoding:'utf8'})).streams[0];
const {width:w,height:h}=meta;assert(w>0&&h>0&&w*h<=4096*4096);
const rgba=execFileSync('ffmpeg',['-v','error','-i',input,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'],{maxBuffer:80*1024*1024});assert.equal(rgba.length,w*h*4);
let transparent=0,painted=0,opaque=0,white=0,edgeMax=0,minX=w,minY=h,maxX=-1,maxY=-1,alphaSum=0;const rgb=[0,0,0],mask=new Uint8Array(w*h);
for(let i=0;i<w*h;i++){const a=rgba[i*4+3],x=i%w,y=Math.floor(i/w);transparent+=a===0;opaque+=a>=250;alphaSum+=a;
 if(x===0||y===0||x===w-1||y===h-1)edgeMax=Math.max(edgeMax,a);
 if(a>=16){mask[i]=1;painted++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 if(a>=128&&rgba[i*4]>240&&rgba[i*4+1]>240&&rgba[i*4+2]>225)white++;
 for(let c=0;c<3;c++)rgb[c]+=rgba[i*4+c]*a;
}
const queue=new Int32Array(w*h),components=[];
for(let start=0;start<mask.length;start++){if(!mask[start])continue;let first=0,last=1;queue[0]=start;mask[start]=0;
 while(first<last){const i=queue[first++],x=i%w;for(const n of [x?i-1:-1,x<w-1?i+1:-1,i-w,i+w])if(n>=0&&n<mask.length&&mask[n]){mask[n]=0;queue[last++]=n;}}
 components.push(last);
}
components.sort((a,b)=>b-a);
const report={utc:new Date().toISOString(),input,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),width:w,height:h,pixelFormat:meta.pix_fmt,grid:{cols:1,rows:1,frames:1,kind:'single static particle; no temporal progression claim'},transparentFraction:transparent/(w*h),paintedFraction:painted/(w*h),opaqueFraction:opaque/(w*h),alphaBounds:[minX,minY,maxX+1,maxY+1],edgeMaxAlpha:edgeMax,whiteFractionOfPainted:white/Math.max(1,painted),alphaWeightedRgb:rgb.map(v=>v/Math.max(1,alphaSum)),componentCount:components.length,largestComponents:components.slice(0,10),largestComponentFraction:(components[0]??0)/Math.max(1,painted),pass:transparent/(w*h)>.25&&edgeMax===0&&components[0]/Math.max(1,painted)>.95,limits:'Alpha/shape structure only; hero fit, hierarchy and additive contrast require fresh runtime review.'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
