/** Measure new failure-injection frames before a once-only visual review. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),film=resolve(root,'work/v5/CXV/films');
const names=(process.env.CXV_FALLBACK_INPUTS??'V7-E-victory-fallback-judge-r2,V7-E-victory-fallback-candidate-baseline,V7-E-victory-fallback-prototype').split(',');
const dest=resolve(process.env.CXV_FALLBACK_REPORT??resolve(root,'reports/v5/CXV/V7-E-victory-fallback-prototype.json'));
assert(dest.startsWith(resolve(root,'reports/v5/CXV')+'/'));assert(!existsSync(dest));
const hash=b=>createHash('sha256').update(b).digest('hex');
const decode=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});
const compare=(a,b)=>{assert.equal(a.length,b.length);let changedPixels=0,maxChannel=0;for(let i=0;i<a.length;i+=3){let changed=false;for(let k=0;k<3;k++){const delta=Math.abs(a[i+k]-b[i+k]);maxChannel=Math.max(maxChannel,delta);changed||=delta>0;}if(changed)changedPixels++;}return{exact:changedPixels===0,changedPixels,maxChannel};};
const report={utc:new Date().toISOString(),method:'All full-frame PNGs measured at1280x720 before sheet review;calm loaded/recovered compositions compared within each run. Local baseline/prototype pairs compare the same current application with only browser-response readiness reset. Judge/Vite frames are not parity pairs.',runs:[],pairs:[],sheets:[],reviewedUtc:null};
const buffers=new Map();
for(const name of names){
 const dir=resolve(film,name);assert(dir.startsWith(film+'/'));const path=resolve(dir,'report.json'),rawBytes=readFileSync(path),raw=JSON.parse(rawBytes);assert(raw.harnessCompleted);
 const captures=[];
 for(const c of raw.captures){const encoded=readFileSync(c.path);assert.equal(encoded.readUInt32BE(16),1280);assert.equal(encoded.readUInt32BE(20),720);const rgb=decode(c.path);assert.equal(rgb.length,1280*720*3);let sum=0,sum2=0;for(const v of rgb){sum+=v;sum2+=v*v;}const mean=sum/rgb.length,stdDev=Math.sqrt(sum2/rgb.length-mean*mean);assert(mean>5&&mean<250&&stdDev>10);captures.push({...c,width:1280,height:720,pngSha256:hash(encoded),rgbSha256:hash(rgb),mean,stdDev});buffers.set(name+'/'+c.name,rgb);}
 const sheet=resolve(dir,'review.jpg');assert(!existsSync(sheet));execFileSync('ffmpeg',['-v','error',...captures.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',sheet]);
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',sheet],{encoding:'utf8'})).streams[0];assert(meta.width<=1024&&meta.height<=1024);
 report.runs.push({...raw,name,captures,raw:{path,sha256:hash(rawBytes)},loadedRecovered:compare(buffers.get(name+'/loaded'),buffers.get(name+'/recovered'))});
 report.sheets.push({name,path:sheet,...meta,sha256:hash(readFileSync(sheet)),frames:captures.map(c=>c.name)});
}
const base=names.find(n=>n.endsWith('candidate-baseline')),proto=names.find(n=>n.endsWith('prototype'));
if(base&&proto)for(const stage of ['loaded','restart-failed','recovered','initial-failed'])report.pairs.push({stage,...compare(buffers.get(base+'/'+stage),buffers.get(proto+'/'+stage))});
writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({dest,runs:report.runs.map(r=>({name:r.name,applicationPass:r.applicationPass,blank:r.reproducedBlankRestart,loadedRecovered:r.loadedRecovered})),pairs:report.pairs,sheets:report.sheets.map(s=>s.path)}));
