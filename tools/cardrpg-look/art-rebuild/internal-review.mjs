// Build a local, explicit QA control panel for the Codex in-app browser.
// No browser/profile access; no model calls; the delivered artifact is unchanged.
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {audit} from '../skills-v5/full/harness.mjs';
const [artifact,output]=process.argv.slice(2);
if(!artifact||!output)throw Error('internal-review.mjs artifact output');
const cases=JSON.parse(gunzipSync(await readFile('reports/cardrpg-look/skills-v5/full/m4/live-pilot/live-cases/cases.json.gz')));
function controls(cases,audit) {
  const next=()=>new Promise(requestAnimationFrame);
  const panel=document.createElement('details');panel.id='art-review-controls';panel.open=true;
  panel.style.cssText='position:fixed;z-index:99999;left:8px;top:8px;background:#102129;color:#fff0d2;padding:8px;max-width:95vw;font:12px monospace;';
  panel.innerHTML='<summary>Art review controls</summary><label>Review shot <select id="art-shot"></select></label> <button id="art-apply">Load shot</button> <label>Action phase <select id="art-phase"><option value="-1">Idle</option><option value="0.15">Anticipation</option><option value="0.4">Travel</option><option value="0.55">Impact</option><option value="0.78">Recovery</option></select></label> <button id="art-pose">Show phase</button> <button id="art-play">Play at 1x</button> <button id="art-audit">Audit visible frame</button><pre id="art-result">Waiting for scene</pre>';
  document.body.append(panel);
  const checks=document.createElement('button');checks.textContent='Check four-unit faces';panel.append(checks);
  const film=document.createElement('button');film.textContent='Record 12s motion';panel.append(film);
  const sel=panel.querySelector('#art-shot'),phase=panel.querySelector('#art-phase'),result=panel.querySelector('#art-result');
  const shots=['mochi-1','mochi-4','soot-1','soot-4','enemy:button-guard','enemy:yarn-giant','P15','P16'];
  for(const id of shots){const opt=document.createElement('option');opt.textContent=id;sel.append(opt);}
  async function ready(){
    const started=Date.now();
    while(!window.__depthReview){if(Date.now()-started>120000)throw Error('model timeout');await next();}
    const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false);
    while(!window.__depthScene?.ready){if(Date.now()-started>120000)throw Error('scene timeout');await next();}
  }
  async function render(){
    const m=window.__depthReview,s=window.__depthScene;m.paused=true;m.notify(false);
    const started=Date.now();
    while(!m.battle.actors.every(a=>s.puppets.get(a.id)?.asset===a.catalogId)){if(Date.now()-started>120000)throw Error('assets timeout');await next();}
    await next();s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await next();
  }
  async function load(){
    await ready();const m=window.__depthReview,row=cases.find(r=>r.id===sel.value);
    if(row){m.galleryBattle=structuredClone(row.frame.battle);m.plan=structuredClone(row.frame.plan);m.animationAt=row.frame.at;}
    else {m.inspect(sel.value,Number(phase.value));if(m.plan){const index={'0.15':0,'0.4':1,'0.55':2,'0.78':3}[phase.value],beat=m.plan.beats[index];m.animationAt=beat.start+beat.duration*.55;}}
    await render();report();
  }
  function report(){
    const s=window.__depthScene;
    const actors=[...s.puppets].map(([id,p])=>({id,asset:p.asset,painted:!!p.model.userData.lookPainted,generated:!!p.model.userData.lookGenerated,height:p.height,parts:p.model.userData.lookPainted?p.model.children[0].children.filter(n=>n.name.startsWith('paint_')).map(n=>({name:n.name,angle:n.rotation.z})):undefined}));
    const f=s.view().frame;
    result.textContent=JSON.stringify({shot:sel.value,phase:phase.value,frame:f?{beat:f.beat.kind,progress:f.progress,clip:f.clip,presentationId:f.plan.presentationId}:null,...audit(),actors});
  }
  const safe=fn=>async()=>{try{await fn();}catch(e){result.textContent='ERROR '+e.stack;}};
  panel.querySelector('#art-apply').onclick=safe(load);
  panel.querySelector('#art-pose').onclick=safe(load);
  panel.querySelector('#art-play').onclick=safe(async()=>{await load();const m=window.__depthReview;if(!m.plan)m.inspect(sel.value,0);m.gallerySpeed=1;m.paused=false;m.notify(false);panel.open=false;});
  panel.querySelector('#art-audit').onclick=safe(async()=>{await render();report();});
  checks.onclick=safe(async()=>{
    const rows=[];
    for(const id of ['mochi-4','soot-4','enemy:button-guard','enemy:yarn-giant'])for(const value of ['0.4','0.55','0.78']){
      sel.value=id;phase.value=value;await load();
      const s=window.__depthScene,e=s.cardEffects,canvas=s.renderer.domElement;
      const buffer=document.createElement('canvas');buffer.width=canvas.width;buffer.height=canvas.height;
      const ctx=buffer.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(canvas,0,0);const real=ctx.getImageData(0,0,buffer.width,buffer.height).data;
      e.root.visible=false;e.setLightsEnabled(false);for(const p of s.puppets.values())s.effectRim?.update(p.model,0,'#ffffff');
      s.post.render(s.scene,s.camera,0,0,'#ffffff',true);
      ctx.drawImage(canvas,0,0);const base=ctx.getImageData(0,0,buffer.width,buffer.height).data;
      e.root.visible=true;e.setLightsEnabled(true);
      const faces=[];
      for(let i=0;i<e.material.uniforms.protectedCount.value;i++){
        const [x,y,rx,ry]=e.protectedFaces[i].toArray();if(rx<=0||ry<=0)continue;
        let count=0,above8=0,sum=0;
        for(let py=Math.max(0,Math.floor((1-y-ry)*buffer.height));py<Math.min(buffer.height,(1-y+ry)*buffer.height);py++)for(let px=Math.max(0,Math.floor((x-rx)*buffer.width));px<Math.min(buffer.width,(x+rx)*buffer.width);px++){
          if(((px/buffer.width-x)/rx)**2+((1-py/buffer.height-y)/ry)**2>=.64||1-py/buffer.height>e.protectedHeadTops[i])continue;
          const p=(py*buffer.width+px)*4,d=Math.max(Math.abs(real[p]-base[p]),Math.abs(real[p+1]-base[p+1]),Math.abs(real[p+2]-base[p+2]));count++;sum+=d;if(d>8)above8++;
        }
        if(count)faces.push({above8:above8/count,mean:sum/count,pixels:count});
      }
      await render();rows.push({id,beat:s.view().frame.beat.kind,faces,ui:audit()});
    }
    result.textContent=JSON.stringify({method:'Real minus no-VFX pixels; core .8 ellipse clipped at head-top; offender>1% delta>8',samples:rows.reduce((n,r)=>n+r.faces.length,0),offenders:rows.flatMap(r=>r.faces.filter(f=>f.above8>.01).map(f=>({id:r.id,beat:r.beat,...f}))),rows});
  });
  film.onclick=safe(async()=>{
    await ready();const s=window.__depthScene,stream=s.renderer.domElement.captureStream(30),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2000000});
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const link=document.createElement('a');link.textContent='Download motion film';link.download='q3-articulated-motion.webm';link.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));panel.append(link);panel.open=true;};
    panel.open=false;recorder.start();
    for(const id of ['enemy:button-guard','enemy:yarn-giant']){
      const m=window.__depthReview;m.inspect(id,0,true);m.gallerySpeed=1;m.notify(false);
      await new Promise(resolve=>setTimeout(resolve,6000));
    }
    recorder.stop();
  });
  ready().then(()=>{result.textContent='Ready — choose shot';}).catch(e=>{result.textContent=String(e);});
}
const html=await readFile(artifact,'utf8');
await writeFile(output,html+`\n<script>(${controls.toString()})(${JSON.stringify(cases)},${audit.toString()});</script>`);
console.log(output);
