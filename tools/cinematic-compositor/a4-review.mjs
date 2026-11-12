import {createRequire} from 'node:module';import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),out=resolve(root,'reports/v3-battle/A4');await mkdir(out,{recursive:true});
const ids=(await readdir(resolve(root,'skills'))).sort(),rows=[],errors=[];
for(let start=0;start<ids.length;start+=4){const layers=[];for(const [i,id] of ids.slice(start,start+4).entries()){
 layers.push({input:Buffer.from(`<svg width="1280" height="24"><rect width="1280" height="24" fill="#251d30"/><text x="14" y="17" fill="#ffe3ad" font-size="14">${id} · entrance / charge / signature / impact / release</text></svg>`),left:0,top:i*168});
 layers.push({input:await readFile(resolve(root,`reports/v3-battle/A3/${id}-ult-film.png`)),left:0,top:i*168+24});
}await sharp({create:{width:1280,height:168*Math.min(4,ids.length-start),channels:4,background:'#171221'}}).composite(layers).png().toFile(resolve(out,`ultimates-${1+start/4}.png`));}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 const thumbs=[];
 for(const id of ids)for(const n of (id==='yarn-giant'?[4]:[1,2,3,4])){
  const skill=id==='yarn-giant'?'enemy:yarn-giant':id+'-'+n;
  await page.evaluate(skill=>window.__depthReview.inspect(skill,0),skill);await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:90000});
  const audit=await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene,p=m.plan;m.animationAt=p.sequence.impact+33;s.render({...s.view(),frame:m.frame,fixedTime:m.animationAt/1000},0);return{skill:p.presentationId??p.skillId,tier:p.sequence.tier,impact:m.impactVisible,draws:s.effects.stats.draws,error:m.sceneError};});
  if(audit.error||!audit.impact||audit.draws===0)throw Error(JSON.stringify(audit));rows.push(audit);
  if(n===2||n===3){await page.waitForTimeout(60);thumbs.push({id:skill,buffer:await page.screenshot()});}
 }
 for(let start=0;start<thumbs.length;start+=6){const layers=[];for(const [i,t] of thumbs.slice(start,start+6).entries()){const left=i%2*640,top=Math.floor(i/2)*232;layers.push({input:await sharp(t.buffer).resize(640,208,{fit:'fill'}).toBuffer(),left,top:top+24});layers.push({input:Buffer.from(`<svg width="640" height="24"><rect width="640" height="24" fill="#251d30"/><text x="12" y="17" fill="#ffe3ad" font-size="15">${t.id}</text></svg>`),left,top});}await sharp({create:{width:1280,height:696,channels:4,background:'#171221'}}).composite(layers).png().toFile(resolve(out,`actives-${1+start/6}.png`));}
 const files=await readdir(resolve(root,'apps/web/public/cinematics'));let bytes=0;for(const f of files)bytes+=(await readFile(resolve(root,'apps/web/public/cinematics',f))).length;
 await writeFile(resolve(out,'review.json'),JSON.stringify({errors,bytes,sequences:rows},null,2));console.log(JSON.stringify({errors,bytes,sequences:rows.length}));if(errors.length||bytes>12_000_000)process.exitCode=1;
}finally{await browser.close();}
