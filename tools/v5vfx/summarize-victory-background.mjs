/** Measure targeted background probes; never erase the original exact-pixel failures. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-F-victory-background-attribution');
const dest=resolve(out,'measurements.json');assert(!existsSync(dest));
const hash=b=>createHash('sha256').update(b).digest('hex');
const decode=p=>execFileSync('ffmpeg',['-v','error','-i',p,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:20_000_000});
const compare=(a,b)=>{assert.equal(a.length,b.length);let changed=0,max=0,sum=0,minX=1280,minY=720,maxX=-1,maxY=-1;for(let i=0;i<a.length;i+=3){let d=0;for(let k=0;k<3;k++){const v=Math.abs(a[i+k]-b[i+k]);d=Math.max(d,v);max=Math.max(max,v);sum+=v;}if(!d)continue;changed++;const x=(i/3)%1280,y=Math.floor(i/3/1280);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}return{exact:changed===0,changedPixels:changed,maxChannel:max,meanAbsoluteChannel:sum/a.length,bounds:changed?[minX,minY,maxX+1,maxY+1]:null};};
const original=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production/trials'),refA=decode(resolve(original,'0-baseline/1x-reduced.png')),refB=decode(resolve(original,'2-native/4x-reduced.png'));
const trials=JSON.parse(readFileSync(resolve(out,'trials.json')));assert.equal(trials.length,2);const runs=[],buffers=new Map();
for(const t of trials){
 const b=readFileSync(t.path);assert.equal(hash(b),t.sha256);const r=JSON.parse(b);assert(r.pass);assert.deepEqual(r.errors,[]);assert.deepEqual(r.blockedRequests,[]);
 const captures=[];
 for(const c of r.captures){const raw=decode(c.path);assert.equal(raw.length,1280*720*3);assert.equal(hash(raw),c.rgbSha256);let sum=0,sum2=0;for(const v of raw){sum+=v;sum2+=v*v;}const mean=sum/raw.length,stdDev=Math.sqrt(sum2/raw.length-mean*mean);assert(mean>10&&mean<245&&stdDev>5);captures.push({...c,mean,stdDev,againstOriginalBaseline:compare(refA,raw),againstOriginalVariant:compare(refB,raw)});buffers.set(t.mode+'/'+c.name,raw);}
 runs.push({...r,captures});
}
const pairs=runs[0].captures.map(c=>({name:c.name,...compare(buffers.get('baseline/'+c.name),buffers.get('native/'+c.name))}));
const sheets=[];
for(const name of ['ordinary','decoded-png']){
 const frames=runs.flatMap(r=>[name==='ordinary'?'ordinary':'decoded-png',name==='ordinary'?'image-restored':'original-restored'].map(n=>r.captures.find(c=>c.name===n))),path=resolve(out,'review-'+name+'.jpg');assert(!existsSync(path));
 execFileSync('ffmpeg',['-v','error',...frames.flatMap(f=>['-i',f.path]),'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',path]);
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert(meta.width<=1024&&meta.height<=1024);sheets.push({path,...meta,sha256:hash(readFileSync(path)),order:frames.map(f=>f.path)});
}
const report={utc:new Date().toISOString(),provenance:JSON.parse(readFileSync(resolve(out,'provenance.json'))),runs,pairs,sheets,reviewedUtc:null,limits:'Reversible page-only background probes on preserved local artifacts. No performance or independent judge acceptance. Original exact-pixel failures remain retained. A substituted PNG is diagnostic, not permission to change background art or screenshot tolerance.'};writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pairs,references:runs.map(r=>({mode:r.artifactMode,captures:r.captures.map(c=>({name:c.name,reference:c.reference,baseline:c.againstOriginalBaseline,variant:c.againstOriginalVariant}))})),sheets}));
