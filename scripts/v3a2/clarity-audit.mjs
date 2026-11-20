import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {compareSheet} from './compare-sheet.mjs';
const args=process.argv.slice(2),arg=(n,f)=>args.includes('--'+n)?args[args.indexOf('--'+n)+1]:f;
const out=resolve(root,'reports/v3-battle/a2/F2');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const fixtures={},framesCount=Number(arg('frames','900'));
const raw=async png=>sharp(Buffer.from(png.split(',')[1],'base64')).removeAlpha().raw().toBuffer();
const luma=(data,i)=>.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
try{
 for(const fixture of config.fixtures.filter(f=>arg('fixture','all')==='all'||f.id===arg('fixture'))){
  const {page,errors}=await openFixture(browser,fixture);
  await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:11,paused:true},0);});
  const shot=await page.screenshot();await writeFile(resolve(out,fixture.id+'.png'),shot);
  const images=await page.evaluate(async root=>{
   const s=window.__depthScene,T=await import('/@fs'+root+'/apps/web/node_modules/three/build/three.module.js'),canvas=s.renderer.domElement;
   const audit=s.sizeAudit(),visibility=s.scene.children.map(c=>[c,c.visible]),clear=s.renderer.getClearColor(new T.Color()).clone(),units=[];
   const full=canvas.toDataURL('image/png');
   for(const [c] of visibility)c.visible=false;s.stage.root.visible=true;
   s.postFx.render(null,0,0,'high',false);const background=canvas.toDataURL('image/png');
   for(const unit of audit.units){
    const actor=s.actors.get(unit.id).actor;actor.root.visible=true;
    s.postFx.render(null,0,0,'high',false);const painted=canvas.toDataURL('image/png');
    s.stage.root.visible=false;s.renderer.setClearColor(0x000000);const originals=[];
    actor.root.traverse(node=>{if(!node.isMesh)return;const material=node.material;originals.push([node,material]);
     node.material=new T.ShaderMaterial({uniforms:{map:{value:material.map}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D map;varying vec2 vUv;void main(){gl_FragColor=vec4(vec3(1.),texture2D(map,vUv).a);}',transparent:true,blending:T.NormalBlending,side:material.side,depthTest:false,depthWrite:false});
    });
    s.renderer.clear(true,true,true);s.renderer.render(s.scene,s.camera);
    units.push({id:unit.id,asset:unit.asset,painted,mask:canvas.toDataURL('image/png')});
    for(const [node,material] of originals){node.material.dispose();node.material=material;}
    actor.root.visible=false;s.stage.root.visible=true;s.renderer.setClearColor(clear);
   }
   for(const [c,v] of visibility)c.visible=v;
   s.render({...s.view(),fixedTime:11,paused:true},0);return {full,background,units,width:audit.width,height:audit.height};
  },root);
  const bg=await raw(images.background),full=await raw(images.full),units=[],histogram=Array(256).fill(0);
  for(let i=0;i<full.length;i+=3)histogram[Math.round(luma(full,i))]++;
  for(const unit of images.units){
   const painted=await raw(unit.painted),mask=await raw(unit.mask);let n=0,total=0,body=0,floor=0;
   for(let i=0;i<mask.length;i+=3)if(mask[i]>=242){n++;const a=luma(painted,i),b=luma(bg,i);total+=Math.abs(a-b);body+=a;floor+=b;}
   units.push({id:unit.id,asset:unit.asset,pixels:n,meanAbsoluteLumaDifference:total/n,unitMeanLuma:body/n,backgroundMeanLuma:floor/n,differenceOfMeans:Math.abs(body-floor)/n});
  }
  const timeline=[];
  // Real combat plans, sampled at 30 fps; no HP, damage, charge or status injection.
  for(let start=0;start<framesCount;start+=60){
   timeline.push(...await page.evaluate(({start,count})=>{
    const m=window.__depthReview,s=window.__depthScene,rows=[];
    for(let i=start;i<Math.min(start+60,count);i++){
     m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(i===0?0:1000/30,1000+i*1000/30);m.paused=true;
     s.render({...s.view(),fixedTime:12+i/30,paused:true},1/30);
     const alpha=[];for(const [id,e] of s.actors)if(m.battle.actors.find(a=>a.id===id)?.hp>0)e.actor.root.traverse(o=>{if(o.isMesh)alpha.push(o.material.opacity);});
     rows.push({t:i/30,alpha:Math.min(...alpha),bubbles:s.bodyFx.audit.bubbles.map(b=>({...b}))});
    }return rows;
   },{start,count:framesCount}));
  }
  const parity=await page.evaluate(()=>{const m=window.__depthReview,c=window.__v3a2,a=structuredClone(c.initial),b=structuredClone(m.battle);c.R.playBattle(a,'auto');c.R.playBattle(b,'auto');return JSON.stringify(a)===JSON.stringify(b);});
  const starts=new Map();let persistentFrames=0;
  for(const row of timeline){const ids=new Set(row.bubbles.filter(b=>b.alpha>0).map(b=>b.id));for(const id of starts.keys())if(!ids.has(id))starts.delete(id);for(const id of ids)if(!starts.has(id))starts.set(id,row.t);if([...starts.values()].filter(t=>row.t-t>.8).length>1)persistentFrames++;}
  fixtures[fixture.id]={unitMeanAlpha:timeline.length?Math.min(...timeline.map(f=>f.alpha)):null,framesWithMultiplePersistentBubbles:persistentFrames,silhouetteContrast:Math.min(...units.map(u=>u.meanAbsoluteLumaDifference)),seconds:framesCount/30,parity,errors,units,histogram,frames:timeline};
  const window=fixture.id==='wave1'?'w01':fixture.id==='wave3'?'w03':'w04',frame=fixture.id==='boss'?1:21;
  await compareSheet(shot,resolve(root,`reports/v3-battle/a2/ref/${window}/frame-${String(frame).padStart(3,'0')}.jpg`),resolve(out,'compare-'+fixture.id+'.png'),{label:fixture.id+' colour and silhouette'});
  console.log(`${fixture.id}: alpha=${fixtures[fixture.id].unitMeanAlpha}, persistent bubbles=${persistentFrames}, min contrast=${fixtures[fixture.id].silhouetteContrast.toFixed(2)}, parity=${parity}, errors=${errors.length}`);
  await page.close();
 }
}finally{await browser.close();}
let suite;try{suite=JSON.parse(await readFile(resolve(out,'suite.json'),'utf8'));}catch{}
await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),method:'Contrast = mean absolute luminance difference inside >95% original alpha, against the same rendered stage without the actor. Minimum unit is the fixture score. Unit opacity excludes original painted alpha and overlay effects.',fixtures,suite},null,2)+'\n');
