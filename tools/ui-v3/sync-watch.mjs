// No model calls: poll only published refs; a model resumes only for a changed tip or stop.
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import {publishedArtPass} from './published-art-status.mjs';
const root=process.cwd(),out='reports/ui-v3/sync';mkdirSync(out,{recursive:true});
const deadline=Date.parse('2026-11-20T18:00:00Z'),baseline='1195b13fa';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024}).trim();
const stateFile=out+'/accepted.json';
const accepted=existsSync(stateFile)?JSON.parse(readFileSync(stateFile,'utf8')):{A:baseline,B:'c5712f7c0',art:null};
function stop(){return existsSync('STOP-UI')?'STOP-UI':Date.now()>=deadline?'deadline':accepted.publishedBoth?'both-lane-refresh':null}
function report(ref,path){try{return git('show',`${ref}:${path}`)}catch{return ''}}
function candidates(){
 git('fetch','origin');
 const refs=git('ls-remote','--heads','origin','codex/cardrpg-v5a-*','codex/cardrpg-v5live-*','codex/cardrpg-v5full-*','codex/cardrpg-art-r*').split('\n').filter(Boolean).map(line=>{const [sha,ref]=line.split(/\s+/);return {sha,branch:ref.replace('refs/heads/','')}});
 const found=[];
 for(const ref of refs){
  const kind=ref.branch.includes('-v5a-')?'A':ref.branch.includes('-art-')?'art':'B';
  // Multiple published B branches can diverge while already being merged here.
  // The accepted per-kind tip alone cannot represent that integration history.
  try{git('merge-base','--is-ancestor',ref.sha,'HEAD');continue}catch{/* Not yet integrated. */}
  if(ref.sha.startsWith(accepted[kind]??'INVALID'))continue;
  if(accepted[kind]){try{git('merge-base','--is-ancestor',ref.sha,accepted[kind]);continue}catch{/* A new descendant or divergent tip needs review. */}}
  try{git('merge-base','--is-ancestor',baseline,ref.sha)}catch{if(kind==='A')continue}
  if(kind==='A'&&ref.sha.startsWith(baseline))continue;
  if(kind==='art'){
   const s=report(ref.sha,'reports/cardrpg-look/art-rebuild/STATE.md');
   const r=report(ref.sha,'reports/cardrpg-look/art-rebuild/ART-REPORT.md');
   if(!publishedArtPass(s,r))continue;
  }
  if(kind==='B'){
   const paths=git('ls-tree','-r','--name-only',ref.sha,'reports/cardrpg-look','reports/cardrpg-big2').split('\n').filter(x=>/STATE\.md$/.test(x));
   if(!paths.some(p=>/\b(PASS|DONE)\b/.test(report(ref.sha,p))))continue;
  }
  const prs=JSON.parse(execFileSync('gh',['pr','list','--repo','ntbaoheyhey/taskbar-hero','--head',ref.branch,'--state','open','--json','number,url,headRefOid'],{encoding:'utf8'}));
  if(!prs.some(p=>p.headRefOid===ref.sha))continue;
  found.push({...ref,kind,pr:prs.find(p=>p.headRefOid===ref.sha)});
 }
 return found;
}
async function until(ms){const end=Date.now()+ms;while(Date.now()<end&&!stop())await sleep(Math.min(10000,end-Date.now()))}
while(!stop()){
 try{
  const next=candidates();
  if(next.length){writeFileSync(out+'/pending.json',JSON.stringify({noticed:new Date().toISOString(),tips:next},null,2));await until(15*60*1000);if(stop())break;const settled=candidates();writeFileSync(out+'/ready.json',JSON.stringify({at:new Date().toISOString(),tips:settled},null,2));console.log(JSON.stringify({event:'published-tip',tips:settled}));process.exit(0)}
  writeFileSync(out+'/heartbeat.json',JSON.stringify({at:new Date().toISOString(),accepted,noNewPublishedTip:true}));
 }catch(error){writeFileSync(out+'/last-error.txt',String(error));}
 await until(10*60*1000);
}
console.log(JSON.stringify({event:'stop',reason:stop()}));
