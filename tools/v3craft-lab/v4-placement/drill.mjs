/** Private DOM-only placement drills on naturally advanced fixture states. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {placeLabels} from './layout-candidates.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-art/REVIEW/A11/placement-r1');
const receipt=resolve(out,'drills.json');if(existsSync(receipt))throw Error('Never overwrite a drill');
mkdirSync(resolve(out,'raw'),{recursive:true});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const sourceHashes=JSON.parse(readFileSync(resolve(root,'reports/v4-art/REVIEW/A11/delivery-r1/source-hashes.json'),'utf8'));
const stable=()=>Object.entries(sourceHashes).every(([path,expected])=>hash(resolve(root,path))===expected);
if(!stable())throw Error('Delivery runtime changed before private drill');
const report={started:new Date().toISOString(),pid:process.pid,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceHashes,
 scriptSha256:hash(new URL(import.meta.url)),candidateSha256:hash(resolve(import.meta.dirname,'layout-candidates.mjs')),
 scope:'Two private DOM-only positioning experiments; unchanged live runtime, natural status values, no production installation or temporal/film acceptance.',cases:[],complete:false};
const save=()=>writeFileSync(receipt,JSON.stringify(report,null,2)+'\n');save();
const measure=()=>{
 const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
 const visible=node=>getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&!node.hidden;
 const labels=[...document.querySelectorAll('.b3-world')].filter(visible).map(node=>{
  const boxes=[node,...node.querySelectorAll('*')].filter(visible).map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
  const x=Math.min(...boxes.map(r=>r.left)),y=Math.min(...boxes.map(r=>r.top));
  return{id:node.dataset.actor,text:node.textContent,styleLeft:node.style.left,styleTop:node.style.top,rect:{x,y,width:Math.max(...boxes.map(r=>r.right))-x,height:Math.max(...boxes.map(r=>r.bottom))-y}};
 });
 const obstacles=[...document.querySelectorAll('.b3-top,.b3-boss,.b3-bottom')].filter(visible).map(node=>({...rect(node.getBoundingClientRect()),kind:node.className})).filter(r=>r.width&&r.height);
 const canvas=document.querySelector('.dp-canvas').getBoundingClientRect(),scene=window.__depthScene;
 const faces=scene.anchors.filter(a=>a.visible&&a.face).map(a=>({...a.face,x:a.face.x+canvas.left,y:a.face.y+canvas.top,id:a.id}));
 const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 const clipped=labels.filter(l=>l.rect.x<0||l.rect.y<0||l.rect.x+l.rect.width>innerWidth||l.rect.y+l.rect.height>innerHeight).map(l=>l.id);
 const hud=labels.flatMap(l=>obstacles.filter(o=>overlap(l.rect,o)).map(o=>({id:l.id,obstacle:o.kind})));
 const faceHits=labels.flatMap(l=>faces.filter(f=>overlap(l.rect,f)).map(f=>({id:l.id,face:f.id})));
 const pairs=labels.flatMap((l,i)=>labels.slice(i+1).filter(other=>overlap(l.rect,other.rect)).map(other=>[l.id,other.id]));
 return{width:innerWidth,height:innerHeight,labels,obstacles,faces,clipped,hud,faceHits,pairs,canvas:rect(canvas),action:window.__depthReview.plan?.id??null};
};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  if(!stable())throw Error('Runtime changed during private drill');
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  await page.addScriptTag({content:'window.__artPrivatePlace='+placeLabels.toString()});
  let state=await page.evaluate(measure),ticks=0;
  // Seek a real clipped label. At 33s retain the actual observed state even if none was found.
  while(!state.clipped.length&&ticks<330){
   await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;m.paused=false;if(!m.plan)m.step();m.tick(100);m.paused=true;m.notify(false);cancelAnimationFrame(s.raf);s.render({...s.view(),paused:true},0);});
   await page.clock.runFor(34);state=await page.evaluate(measure);ticks++;
  }
  await page.evaluate(()=>{for(const animation of document.getAnimations())animation.pause();});
  const key=fixture.id+'-'+height,folder=resolve(out,'raw',key);mkdirSync(folder,{recursive:true});
  const entry={fixture:fixture.id,width,height,ticks,baselineTargetFound:!!(state.clipped.length||state.hud.length),errors,variants:[]};
  const take=async(name,geometry,placement=null)=>{const path=resolve(folder,name+'.png');await page.screenshot({path});entry.variants.push({name,geometry,placement,path:path.slice(root.length+1),sha256:hash(path)});};
  await take('baseline',state);
  for(const variant of ['viewport','hud']){
   await page.evaluate(({baseline,variant})=>{
    const byId=new Map([...document.querySelectorAll('.b3-world')].map(n=>[n.dataset.actor,n]));
    for(const label of baseline.labels){const node=byId.get(label.id);node.style.left=label.styleLeft;node.style.top=label.styleTop;}
    const placed=window.__artPrivatePlace(baseline.labels,innerWidth,innerHeight,baseline.obstacles,baseline.faces,variant);
    for(const item of placed){const before=baseline.labels.find(l=>l.id===item.id),node=byId.get(item.id);node.style.left=(parseFloat(before.styleLeft)+item.rect.x-before.rect.x)+'px';node.style.top=(parseFloat(before.styleTop)+item.rect.y-before.rect.y)+'px';}
    window.__artPrivatePlacement=placed;
   },{baseline:state,variant});
   await take(variant,await page.evaluate(measure),await page.evaluate(()=>window.__artPrivatePlacement));
  }
  entry.textPreserved=entry.variants.every(v=>v.geometry.labels.every(l=>state.labels.find(b=>b.id===l.id)?.text===l.text));
  report.cases.push(entry);save();console.log(key,'ticks',ticks,'clipped',entry.variants.map(v=>v.geometry.clipped.length),'HUD',entry.variants.map(v=>v.geometry.hud.length));
  await page.close();
 }
 report.complete=true;report.finished=new Date().toISOString();report.runtimeUnchanged=stable();save();
}finally{await browser.close();}
