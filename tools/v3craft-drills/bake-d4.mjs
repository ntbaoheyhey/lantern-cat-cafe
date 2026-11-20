// Original-art offline flipbook recipe. LEARN/Q3.md, experiments X11/X12.
// Canvas only encodes already-rendered GPU pixels; it creates no effect shapes.
import {chromium} from '../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??0),size=revision===0?256:512,fps=30,count=31,padding=2,columns=8;
const out='tools/v3craft-drills/assets';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D1&revision=2');await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async({revision,size,fps,count,padding,columns})=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const p=window.__drill,camera=new T.OrthographicCamera(530,1070,625,85,-100,100);camera.position.z=10;
  const {prepareD4Source}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/d4-source.ts');
  const source=prepareD4Source(T,p.drill,revision);
  const target=new T.WebGLRenderTarget(size,size),pixels=new Uint8Array(size*size*4);
  p.scene.children.forEach(o=>o.visible=o===p.drill.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);
  const stride=size+2*padding,rows=Math.ceil(count/columns),width=columns*stride,height=rows*stride;
  const atlas=new Uint8ClampedArray(width*height*4),stats=[];
  const encode=v=>Math.round(255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055));
  for(let frame=0;frame<count;frame++){
   const ageMs=frame/fps*1000,sourceMs=source.sourceTime(ageMs);source.draw(ageMs);p.renderer.render(p.scene,camera);p.renderer.readRenderTargetPixels(target,0,0,size,size,pixels);
   let support=0,minX=size,minY=size,maxX=-1,maxY=-1;
   for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(pixels[(y*size+x)*4+3]>20){support++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
   stats.push({frame,ageMs,sourceMs,support,bounds:support?[minX,minY,maxX,maxY]:null});
   // Every tile retains the same crop. Extrusion never changes its pivot.
   for(let y=0;y<stride;y++)for(let x=0;x<stride;x++){
    const sx=Math.max(0,Math.min(size-1,x-padding)),sy=size-1-Math.max(0,Math.min(size-1,y-padding));
    const src=(sy*size+sx)*4,dst=((Math.floor(frame/columns)*stride+y)*width+frame%columns*stride+x)*4,a=pixels[src+3]/255;
    for(let c=0;c<3;c++)atlas[dst+c]=a?encode(Math.min(1,pixels[src+c]/255/a)):0;
    atlas[dst+3]=pixels[src+3];
   }
  }
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').putImageData(new ImageData(atlas,width,height),0,0);target.dispose();
  return{png:canvas.toDataURL('image/png'),width,height,rows,stride,stats,sourceRecipe:source.recipe,sourceLamps:source.lamps};
 },{revision,size,fps,count,padding,columns});
 const bytes=Buffer.from(result.png.split(',')[1],'base64');delete result.png;
 const atlas=`d4-r${revision}.png`,metadata={id:'D4',revision,atlas,fps,count,durationMs:1000,sourceDurationMs:2000,cell:size,padding,columns,crop:{left:530,right:1070,bottom:85,top:625},pivot:[800,355],colour:'straight-sRGB from unpremultiplied linear GPU readback',interpolation:'premultiplied-linear',loop:false,...result};
 writeFileSync(`${out}/${atlas}`,bytes);writeFileSync(`${out}/d4-r${revision}.json`,JSON.stringify(metadata,null,2)+'\n');
 const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
 const receipt={at:new Date().toISOString(),revision,errors,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),recipeSha256:hash(import.meta.filename),sourceSha256:hash('tools/v3craft-drills/d4-source.ts'),paintSha256:hash('tools/v3craft-drills/assets/soot-core.png'),...metadata};
 const raw=`tools/v3craft-lab/q3/raw/D4-r${revision}`;mkdirSync(raw,{recursive:true});writeFileSync(`${raw}/bake.json`,JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({revision,errors,bytes:bytes.length,size:[metadata.width,metadata.height],frames:count,firstSupport:metadata.stats[0].support,lastSupport:metadata.stats.at(-1).support}));
 if(errors.length)process.exitCode=1;
}finally{await browser.close();}
