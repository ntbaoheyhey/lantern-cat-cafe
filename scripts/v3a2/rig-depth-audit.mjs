import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const out=resolve(root,'reports/v3-battle/a2/M2'),all=JSON.parse(await readFile(resolve(out,'face-annotations.json'),'utf8'));
const ids=process.argv.slice(2).filter(a=>!a.startsWith('--'));if(!ids.length)ids.push(...Object.keys(all));
await mkdir(out,{recursive:true});
async function holes(buffer){
 const {data,info:{width:w,height:h}}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true}),solid=new Uint8Array(w*h),outside=new Uint8Array(w*h),q=new Int32Array(w*h);let tail=0,head=0;
 for(let i=0;i<solid.length;i++)solid[i]=data[i*4+3]>=16?1:0;
 const add=i=>{if(i>=0&&i<solid.length&&!solid[i]&&!outside[i]){outside[i]=1;q[tail++]=i;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(head<tail){const i=q[head++],x=i%w,y=Math.floor(i/w);if(x>0)add(i-1);if(x<w-1)add(i+1);if(y>0)add(i-w);if(y<h-1)add(i+w);}
 const points=[];
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=y*w+x;if(solid[i]||outside[i])continue;let interior=true;for(let dy=-2;dy<=2&&interior;dy++)for(let dx=-2;dx<=2;dx++)if(solid[(y+dy)*w+x+dx]||outside[(y+dy)*w+x+dx]){interior=false;break;}if(interior)points.push([x,y]);}
 return {pixels:points.length,points};
}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:640,height:640}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5990/@fs'+resolve(root,'tools/cinematic-compositor/rigs.html'));await page.waitForFunction(()=>window.rigs,null,{timeout:60000});
 for(const id of ids){
  const data=JSON.parse(await readFile(resolve(root,'apps/web/public/units',id,'rig.json'),'utf8')),manifest=JSON.parse(await readFile(resolve(root,'art/units',id,'depth-parts/manifest.json'),'utf8'));
  await page.evaluate(id=>window.rigs.load(id),id);const extremes=[];const frames=[];
  for(const [name,at] of [['attack',.18],['attack',.26],['cast',.35],['ultimate',.55],['hit',.06],['death',.7],['stunned',.9],['enter',0]]){
   await page.evaluate(([n,t])=>window.rigs.pose(n,t,0),[name,at]);const png=await page.locator('canvas').screenshot({omitBackground:true}),metric=await holes(png);
   const maps=await page.evaluate(()=>{const r=window.rigs,m=r.actor.mesh,rest=m.data.nodes.reduce((all,n)=>{const p=all[n.parent]??{x:0,y:0};all.push({x:p.x+n.x,y:p.y+n.y});return all;},[]),result={};
    const names={'body':'torso','head':'head','arm-l':'arm_upper_l','arm-r':'arm_upper_r','foot-l':'leg_l','foot-r':'leg_r','tail':'tail_1','weapon':'weapon','off_weapon':'off_weapon'};
    for(const [partName,boneName] of Object.entries(names)){const part=m.data.parts.find(p=>p.name===partName),index=m.data.nodes.findIndex(n=>n.name===boneName);if(!part||index<0)continue;
     const points=part.vertices.map(v=>v.reduce((q,w)=>({x:q.x+(w.x+rest[w.bone].x)*w.weight,y:q.y+(w.y+rest[w.bone].y)*w.weight}),{x:0,y:0})),box={x:Math.min(...points.map(p=>p.x)),y:Math.min(...points.map(p=>p.y)),right:Math.max(...points.map(p=>p.x)),top:Math.max(...points.map(p=>p.y))},b=m.bones[index],det=b.a*b.d-b.b*b.c;
     const map=(x,y)=>{const v=r.actor.root.position.clone().set(x/320-1,1-y/320,0).unproject(r.camera);m.worldToLocal(v);const dx=v.x-b.worldX,dy=v.y-b.worldY;return {x:((b.d*dx-b.b*dy)/det+rest[index].x-box.x)/(box.right-box.x),y:(box.top-((-b.c*dx+b.a*dy)/det+rest[index].y))/(box.top-box.y)};};
     const zero=map(0,0),x=map(1,0),y=map(0,1);result[partName]={bone:boneName,matrix:[x.x-zero.x,y.x-zero.x,zero.x,x.y-zero.y,y.y-zero.y,zero.y]};
    }return result;});
   extremes.push({name,at,...metric,maps});frames.push(await sharp(png).resize(320,320).toBuffer());
  }
  await sharp({create:{width:1280,height:640,channels:4,background:'#4f4754'}}).composite(frames.map((input,i)=>({input,left:i%4*320,top:Math.floor(i/4)*320}))).png().toFile(resolve(out,`extremes-${id}.png`));
  const blink=await page.evaluate(async root=>{const {blinkAt}=await import('/@fs'+root+'/apps/web/src/game/rig/cutout.ts');let t=0;while(blinkAt(t,window.rigs.actor.mesh.data.face.seed)<.9)t+=1/120;return t;},root);
  const strip=[],events=[];
  for(const [name,at,clock] of [['idle',0,0],['idle',.2,blink-.05],['idle',.2,blink-.025],['idle',.2,blink],['idle',.2,blink+.025],['idle',.2,blink+.08],['attack',.18,0],['attack',.26,0],['cast',.35,0],['ultimate',.55,0],['hit',.06,0],['idle',1,0]]){
   const info=await page.evaluate(([n,t,clock])=>{const r=window.rigs;r.pose(n,t,clock);const mesh=r.actor.mesh,geometry=mesh.children[0].geometry.attributes.position.array;let offset=0;const visible=[];for(const p of mesh.data.parts){if(/eye_|mouth_/.test(p.name)&&geometry.slice(offset*3,(offset+p.vertices.length)*3).some(v=>Math.abs(v)>1))visible.push(p.name);offset+=p.vertices.length;}
    const b=mesh.skeleton.findBone('head'),v=r.actor.root.position.clone().set(b.worldX,b.worldY,0);r.actor.root.localToWorld(v);v.project(r.camera);return {visible,x:(v.x+1)*320,y:(1-v.y)*320};},[name,at,clock]);
   const png=await page.locator('canvas').screenshot({omitBackground:true}),left=Math.max(0,Math.min(360,Math.round(info.x-140))),top=Math.max(0,Math.min(360,Math.round(info.y-205)));
   strip.push(await sharp(png).extract({left,top,width:280,height:280}).resize(212,212).toBuffer());events.push({name,at,clock,visible:info.visible});
  }
  await sharp({create:{width:1272,height:424,channels:4,background:'#4f4754'}}).composite(strip.map((input,i)=>({input,left:i%6*212,top:Math.floor(i/6)*212}))).png().toFile(resolve(out,`face-${id}.png`));
  const separate=['eye_l','eye_r','eye_l_closed','eye_r_closed','mouth_neutral','mouth_open','mouth_shout',...(manifest.weaponRequired?['weapon']:[])].every(n=>data.parts.some(p=>p.name===n)&&data.contract.parts[n]?.embedded===false);
  const report={_meta:evidenceMeta(),id,source:'native rendered atlas; alpha>=16; transparent components eroded 2 pixels',separate,weaponRequired:manifest.weaponRequired,parts:data.parts.map(p=>p.name),extremes,events,blinkVisible:events.some(e=>e.visible.includes('eye_l_closed')&&e.visible.includes('eye_r_closed')),mouthVisible:events.some(e=>e.visible.includes('mouth_open'))&&events.some(e=>e.visible.includes('mouth_shout'))};
  await writeFile(resolve(out,`rig-${id}.json`),JSON.stringify(report,null,2)+'\n');console.log(`${id}: parts=${separate} blink=${report.blinkVisible} mouth=${report.mouthVisible} holes=${extremes.map(p=>p.pixels).join(',')}`);
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
