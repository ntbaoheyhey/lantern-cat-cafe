/** GPU round trip through the production atlas shader: encoded paint stays encoded paint. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from './browser-fixture.mjs';
import {root,evidenceMeta} from './check-gates.mjs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5990/');
 const result=await page.evaluate(async root=>{
  const T=await import('/@fs'+root+'/apps/web/node_modules/three/build/three.module.js');
  const {usePaintedAtlasColor}=await import('/src/game/rig/atlas-color.ts');
  const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true,alpha:false});renderer.setSize(16,16);renderer.setClearColor(0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=1;
  const values=[];
  for(const pma of [false,true])for(const rgb of [[128,128,128],[70,120,190],[215,140,60]]){
   const alpha=pma?128:255,texture=new T.DataTexture(new Uint8Array([...rgb.map(v=>Math.round(v*alpha/255)),alpha]),1,1);texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;
   const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false});usePaintedAtlasColor(material,pma);
   const mesh=new T.Mesh(new T.PlaneGeometry(2,2),material);scene.add(mesh);renderer.render(scene,camera);
   const gl=renderer.getContext(),pixel=new Uint8Array(4);gl.readPixels(8,8,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   // Default framebuffer blending is encoded-space. Alpha is 1 for the opaque fixture.
   const expected=rgb.map(v=>Math.round(v*alpha/255)),difference=expected.map((v,i)=>Math.abs(v-pixel[i]));
   values.push({pma,rgb,alpha,expected,actual:[...pixel],maxError:Math.max(...difference)});
   mesh.removeFromParent();mesh.geometry.dispose();material.dispose();texture.dispose();
  }
  renderer.dispose();return values;
 },root);
 const out=resolve(root,'reports/v3-battle/a2/F2');await mkdir(out,{recursive:true});
 const error=Math.max(...result.map(r=>r.maxError));await writeFile(resolve(out,'atlas-color.json'),JSON.stringify({_meta:evidenceMeta(),maxError:error,tolerance:2,samples:result},null,2)+'\n');
 console.log(`${error<=2?'PASS':'FAIL'} atlas sRGB/PMA round trip: max channel error ${error}/255; tolerance 2/255`);if(error>2)process.exitCode=1;
}finally{await browser.close();}
