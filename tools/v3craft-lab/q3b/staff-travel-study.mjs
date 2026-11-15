// Q3B-X04: short tip versus finite swept ribbon on actual pilot geometry.
// Learning experiment only; no capture/scheduler or production code changes.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3b/raw/staff-travel';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   m.paused=false;m.sceneReady=true;
   for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='soot'&&!m.plan.ultimate)break;while(m.plan)m.tick(100);}
   if(m.plan?.actorId!=='soot')throw Error('No Soot basic');m.paused=true;m.animationAt=250;s.render({...s.view(),paused:true,fixedTime:10.25},0);
   const source=s.socket('soot','mainHand'),targetId=m.plan.targetIds[0],home=s.homes.get(targetId).point,target={x:home.x,y:home.y-home.core*.42};
   const k=s.width/1280,dx=target.x-source.x,curve=new T.CubicBezierCurve(new T.Vector2(source.x,source.y),new T.Vector2(source.x+dx*.32,source.y-24*k),new T.Vector2(target.x-dx*.26,target.y-18*k),new T.Vector2(target.x,target.y));curve.arcLengthDivisions=512;
   const length=curve.getLength(),root=new T.Group();root.position.set(-s.worldWidth/2,1950,0);root.scale.set(s.worldWidth/s.width,-s.worldWidth/s.width,1);root.renderOrder=Math.max(...[...s.actors.values()].map(e=>e.actor.root.renderOrder))+1;s.scene.add(root);s.effects.canvas.style.visibility='hidden';
   const vertices=new Float32Array(97*6),uv=new Float32Array(97*4),indices=[];
   for(let i=0;i<=96;i++){uv.set([i/96,0,i/96,1],i*4);if(i<96){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.setIndex(indices);
   const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,uniforms:{alpha:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float alpha;void main(){float a=(1.-smoothstep(.65,1.,abs(vUv.y-.5)*2.))*alpha;vec3 c=mix(vec3(.32,.06,.55),vec3(1.,.76,.31),smoothstep(.55,.95,vUv.x));gl_FragColor=vec4(c,a);\n#include <colorspace_fragment>\n}'}),mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;root.add(mesh);
   const images={},rows=[];
   for(const method of ['short-tip','finite-sweep']){
    let previousHead=0,maxGap=0,maxSpan=0;
    for(const ms of [250,266.667,283.333,300,316.667,333.333,350,375,400,425]){
     const head=Math.max(0,Math.min(1,(ms-250)/100)),tail=method==='short-tip'?Math.max(0,head-42*k/length):Math.max(0,Math.min(1,(ms-296)/100));
     const a=ms<250||ms>=425?0:ms<350?Math.min(1,(ms-250)/12):1-Math.min(1,(ms-350)/75);
     for(let i=0;i<=96;i++){
      const u=i/96,t=tail+(head-tail)*u,p=curve.getPointAt(t),v=curve.getTangentAt(t),half=9*k*Math.pow(Math.sin(Math.PI*u),.6);
      for(let side=0;side<2;side++){const sign=side?1:-1,j=(i*2+side)*3;vertices[j]=p.x-v.y*half*sign;vertices[j+1]=p.y+v.x*half*sign;}
     }
     geometry.attributes.position.needsUpdate=true;material.uniforms.alpha.value=a;maxSpan=Math.max(maxSpan,(head-tail)*length);
     s.renderer.setRenderTarget(null);s.renderer.clear();s.renderer.render(s.scene,s.camera);
     if(s.width===1280&&['wave3','boss'].includes(m.view?.fixture??''))void 0;
     images[method+'-'+ms]=s.renderer.domElement.toDataURL();rows.push({method,ms,head,tail,alpha:a,spanPx:(head-tail)*length});
    }
    for(const ms of [250,283.3333333333,316.6666666667,350]){
     const head=Math.min(1,(ms-250)/100),tail=method==='short-tip'?Math.max(0,head-42*k/length):Math.max(0,Math.min(1,(ms-296)/100));maxGap=Math.max(maxGap,(tail-previousHead)*length);previousHead=head;
    }
    rows.push({method,maxGapAt30HzPx:maxGap,maxSpanPx:maxSpan,endpointErrorPx:curve.getPointAt(1).distanceTo(new T.Vector2(target.x,target.y)),clearAt425:material.uniforms.alpha.value===0});
   }
   root.removeFromParent();geometry.dispose();material.dispose();return{source,target,targetId,pathLengthPx:length,rows,images};
  });
  if(width===1280&&fixture.id==='wave3')for(const [name,data]of Object.entries(result.images))writeFileSync(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'));
  delete result.images;results.push({fixture:fixture.id,width,height,errors,...result});console.log(JSON.stringify({fixture:fixture.id,width,pathLengthPx:result.pathLengthPx,methods:result.rows.filter(r=>r.maxGapAt30HzPx!==undefined),errors}));await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/staff-travel-study.json',JSON.stringify({at:new Date().toISOString(),scope:'Geometric continuity, not a complete basic or mask/contrast acceptance.',results},null,2)+'\n');
}finally{await browser.close();}
