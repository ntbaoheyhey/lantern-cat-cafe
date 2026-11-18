/** Hash/geometry/contrast gate before reviewing fresh notice sheets. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const native=process.env.CXV_NOTICE_NATIVE==='1',kind=native?'native':'experiment';
const out=resolve(process.env.CXV_NOTICE_OUT??resolve(root,'work/v5/CXV/films/V7-F-battle-notice-'+kind));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));
const rawPath=resolve(out,'report.json'),rawBytes=await readFile(rawPath),raw=JSON.parse(rawBytes);assert(raw.pass);assert.equal(raw.native,native);
const output=resolve(root,'reports/v5/CXV/V7-F-battle-notice-'+kind+'.json');assert(!existsSync(output));
const rgb=color=>{const n=color.match(/[\d.]+/g).map(Number);return{channels:n.slice(0,3),alpha:n[3]??1};};
const luminance=channels=>channels.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
const compact=state=>({...state,battle:undefined,plan:undefined,battleSha256:hash(JSON.stringify(state.battle)),planSha256:hash(JSON.stringify(state.plan))});
const captures=[];
for(const c of raw.captures){
 const bytes=await readFile(c.path);assert.equal(hash(bytes),c.sha256);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
 const pixels=execFileSync('ffmpeg',['-v','error','-i',c.path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});assert.equal(hash(pixels),c.rgbSha256);
 let contrast=null;
 if(c.after.notice){
  const fg=rgb(c.after.notice.style.color),bg=rgb(c.after.notice.style.background);assert.equal(fg.alpha,1);
  const light=luminance(fg.channels),bounds=[0,255].map(under=>{const dark=luminance(bg.channels.map(n=>bg.alpha*n+(1-bg.alpha)*under));return(Math.max(light,dark)+.05)/(Math.min(light,dark)+.05);});
  contrast={minimum:Math.min(...bounds),bounds,foreground:fg,background:bg};assert(contrast.minimum>=4.5);
 }
 captures.push({...c,before:compact(c.before),after:compact(c.after),contrast});
}
const sheets=[];
for(const mode of ['normal','reduced'])for(const name of [native?'lost':'candidate-lost','long-notice']){
 const selected=captures.find(c=>c.mode===mode&&c.name===name);assert(selected);
 const path=resolve(out,mode+'-'+name+'-review.jpg');assert(!existsSync(path));
 execFileSync('ffmpeg',['-v','error','-i',selected.path,'-vf','scale=1024:576','-frames:v','1','-q:v','3',path]);
 sheets.push({mode,name,path,width:1024,height:576,sha256:hash(await readFile(path))});
}
const report={...raw,captures,sheets,raw:{path:rawPath,sha256:hash(rawBytes)},measurementUtc:new Date().toISOString(),reviewedUtc:null,
 limits:'Native injected loss in a seeded paused boss at desktop1280x720/DPR2. Experiment uses a declared DOM/CSS notice patch; native uses untransformed application. Long resource text is synthetic. Contrast computes conservative black/white backing bounds. No performance or hardware failure-incidence claim.'};
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,pass:true,captures:captures.length,minimumContrast:Math.min(...captures.filter(c=>c.contrast).map(c=>c.contrast.minimum)),sheets}));
