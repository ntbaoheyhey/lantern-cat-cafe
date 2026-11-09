import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {open,apply,audit} from './harness.mjs';
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});const rows=[],errors=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&/WebGL|Shader|GLSL/.test(m.text()))errors.push(m.text())});await open(page,process.env.V5_ARTIFACT);
for(const id of process.env.V5_IDS.split(',')){
 await apply(page,{gallery:id,progress:0});
 await page.evaluate(()=>{const m=window.__depthReview,b=m.plan.beats[2];m.animationAt=b.start+b.duration*.55;});
 await page.evaluate(()=>{const m=window.__depthReview;for(const a of m.galleryBattle.actors)a.statuses=[{id:'scald',stacks:5,remaining:3},{id:'scent',stacks:1,remaining:2},{id:'cozy',stacks:3,remaining:2}].map(s=>({...s,source:a.id,appliedRound:1}));m.notify(false)});
 const data=await page.evaluate(async()=>{await new Promise(requestAnimationFrame);const s=window.__depthScene,e=s.cardEffects;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;const real=s.renderer.domElement.toDataURL('image/png');e.root.visible=false;e.setLightsEnabled(false);for(const p of s.puppets.values())s.effectRim?.update(p.model,0,'#ffffff');s.post.render(s.scene,s.camera,0,0,'#ffffff',true);const without=s.renderer.domElement.toDataURL('image/png');e.root.visible=true;e.setLightsEnabled(true);return{real,without,masks:e.protectedFaces.slice(0,e.material.uniforms.protectedCount.value).map(v=>v.toArray()),headTops:Array.from(e.protectedHeadTops),stats:{...s.stats}}});
 for(const key of ['real','without']){const path=out+'/'+id.replaceAll(':','-')+'-'+key+'.png';await writeFile(path,Buffer.from(data[key].split(',')[1],'base64'));data[key]=path}rows.push({id,...data,ui:await page.evaluate(audit)});
}}finally{await browser.close();await writeFile(out+'/face-frames.json',JSON.stringify(rows));await writeFile(out+'/errors.json',JSON.stringify(errors))}
