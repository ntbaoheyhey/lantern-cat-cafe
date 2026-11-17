import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),pages=JSON.parse(readFileSync(resolve(root,'apps/web/src/game/cardrpg/spine/lossless-atlases.json')));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage();await page.route('**/__a10_pixels__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Atlas pixel validation</title>'}));
 await page.goto('http://127.0.0.1:5990/__a10_pixels__');
 const result=await page.evaluate(async({pages,root})=>{
  const T=await import('/@fs'+root+'/apps/web/node_modules/three/build/three.module.js');
  const renderer=new T.WebGLRenderer({alpha:true,preserveDrawingBuffer:true});renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=1;
  const geometry=new T.PlaneGeometry(2,2),material=new T.MeshBasicMaterial({transparent:true,toneMapped:false});scene.add(new T.Mesh(geometry,material));
  const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const rows=[];
  for(const asset of pages){
   const pair=[],buffers=[];
   for(const url of ['/@fs'+root+'/'+asset.source,asset.url]){
    const image=new Image();image.src=url;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
    const rgba=ctx.getImageData(0,0,image.width,image.height).data;
    renderer.setSize(image.width,image.height,false);const texture=new T.Texture(image);texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;material.map=texture;material.needsUpdate=true;renderer.render(scene,camera);
    const gl=renderer.getContext(),gpu=new Uint8Array(image.width*image.height*4);gl.readPixels(0,0,image.width,image.height,gl.RGBA,gl.UNSIGNED_BYTE,gpu);
    let covered=0;for(let i=3;i<gpu.length;i+=4)if(gpu[i])covered++;
    pair.push({url,width:image.width,height:image.height,canvasSha256:await hash(rgba),webglSha256:await hash(gpu),webglCoveredPixels:covered,webglError:gl.getError()});texture.dispose();
    buffers.push({rgba,gpu});
   }
   const differences={};for(const key of ['rgba','gpu']){let changed=0,maxDelta=0,opaqueChanged=0,alphaChanged=0;for(let i=0;i<buffers[0][key].length;i++){const delta=Math.abs(buffers[0][key][i]-buffers[1][key][i]);if(delta){changed++;maxDelta=Math.max(maxDelta,delta);if(i%4===3)alphaChanged++;if(buffers[0][key][i-i%4+3]===255)opaqueChanged++;}}differences[key]={changed,maxDelta,opaqueChanged,alphaChanged};}
   rows.push({source:asset.source,pair,differences,canvasEqual:pair[0].canvasSha256===pair[1].canvasSha256,webglEqual:pair[0].webglSha256===pair[1].webglSha256});
  }
  geometry.dispose();material.dispose();renderer.dispose();return{rows,canvasPass:rows.every(r=>r.canvasEqual),runtimePass:rows.every(r=>r.webglEqual&&r.differences.rgba.alphaChanged===0&&r.pair.every(p=>p.webglCoveredPixels>0&&p.webglError===0)),pass:rows.every(r=>r.canvasEqual&&r.webglEqual)};
 },{pages,root});
 writeFileSync(resolve(root,'reports/v4-art/REVIEW/A10/transfer/browser-pixels.json'),JSON.stringify({at:new Date().toISOString(),method:'Chromium native-resolution Canvas2D readback and Three NoColorSpace textured-quad WebGL readback, exact SHA256 comparison',...result},null,2)+'\n');
 console.log(JSON.stringify({pass:result.pass,assets:result.rows.length}));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}
