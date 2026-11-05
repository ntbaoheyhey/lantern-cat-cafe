// Production runtime, normal wall clock. RAF is a frame-cadence proxy, not GPU timing.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const out='reports/turn3d',base=process.env.TURN_PRODUCTION_URL||'http://localhost:5515';
const hardware=process.env.TURN_GPU==='metal';
const output=hardware?'performance-metal.json':'performance.json';
const browser=await chromium.launch({headless:true,...(hardware?{channel:'chromium',args:['--use-angle=metal']}: {})});const rows=[];const errors=[];
const q=(a,n)=>{const s=[...a].sort((a,b)=>a-b);return +(s[Math.floor((s.length-1)*n)]||0).toFixed(3)};
const probe=()=>{
 window.__glProbe={frames:0,calls:0,maxCalls:0,triangles:0,maxTriangles:0,buffers:new Map(),textures:new Set()};
 const p=window.__glProbe;let bound=new Map();const proto=WebGL2RenderingContext.prototype;
 const wrap=(name,fn)=>{const orig=proto[name];proto[name]=function(...args){fn.call(this,...args);return orig.apply(this,args)}};
 wrap('clear',()=>{p.frames++;p.maxCalls=Math.max(p.maxCalls,p.calls);p.maxTriangles=Math.max(p.maxTriangles,p.triangles);p.calls=0;p.triangles=0});
 for(const name of ['drawElements','drawArrays'])wrap(name,(mode,countOrFirst,count)=>{p.calls++;p.triangles+=name==='drawElements'?countOrFirst/3:count/3});
 wrap('drawElementsInstanced',(mode,count,type,offset,instances)=>{p.calls++;p.triangles+=count/3*instances});
 wrap('drawArraysInstanced',(mode,first,count,instances)=>{p.calls++;p.triangles+=count/3*instances});
 wrap('bindBuffer',(target,buffer)=>bound.set(target,buffer));wrap('bufferData',(target,data)=>p.buffers.set(bound.get(target),typeof data==='number'?data:data?.byteLength||0));wrap('deleteBuffer',b=>p.buffers.delete(b));
 wrap('bindTexture',(_,t)=>{if(t)p.textures.add(t)});wrap('deleteTexture',t=>p.textures.delete(t));
};
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await page.addInitScript(probe);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');await page.goto(base+'/?demo&squad=1&squad3d=1');await page.getByRole('button',{name:'Effects',exact:true}).click();await page.getByLabel('Effect action').selectOption('lanternstorm');await page.waitForTimeout(2500);
  for(const mode of ['ultimate-six-enemies','paused','waiting-for-player']){
   if(mode==='paused')await page.getByRole('button',{name:'Pause',exact:true}).click();
   if(mode==='waiting-for-player'){await page.getByRole('button',{name:'Patrol',exact:true}).click();await page.getByText('Mochi — your turn',{exact:true}).waitFor();}
   const a=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
   const duration=mode==='ultimate-six-enemies'?15000:5000;
   const frames=await page.evaluate(async duration=>{const d=[];let last=performance.now(),raf;window.__glProbe.maxCalls=0;window.__glProbe.maxTriangles=0;const tick=now=>{d.push(now-last);last=now;raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);await new Promise(r=>setTimeout(r,duration));cancelAnimationFrame(raf);const p=window.__glProbe,gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {d:d.slice(1),drawCalls:p.maxCalls,triangles:p.maxTriangles,bufferBytes:[...p.buffers.values()].reduce((a,b)=>a+b,0),buffers:p.buffers.size,textures:p.textures.size,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),canvasPixels:gl.canvas.width*gl.canvas.height,framebufferSamples:gl.getParameter(gl.SAMPLES),reviewHook:'__turn3dReview' in window,models:performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.glb')).length}},duration);
   const b=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));const wall=b.Timestamp-a.Timestamp;
   const row={viewport:`${width}x${height}`,mode,durationMs:duration,p50Ms:q(frames.d,.5),p95Ms:q(frames.d,.95),maxMs:Math.max(...frames.d),rendererTaskPercent:+((b.TaskDuration-a.TaskDuration)/wall*100).toFixed(3),heapStartBytes:a.JSHeapUsedSize,heapEndBytes:b.JSHeapUsedSize,...Object.fromEntries(Object.entries(frames).filter(([k])=>k!=='d'))};row.estimatedGpuAssetBytes=row.bufferBytes+64*64*4*4/3;row.estimatedFramebufferBytes=row.canvasPixels*8*(row.framebufferSamples+1);rows.push(row);console.log(JSON.stringify(row));assert.equal(row.reviewHook,false);
  }
  const resource=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/assets/')&&e.name.endsWith('.js')).map(e=>({name:e.name.split('/').at(-1),durationMs:e.duration,bytes:e.decodedBodySize})));
  rows.push({viewport:`${width}x${height}`,mode:'local-load',resources:resource});await page.close();
 }
}finally{await browser.close();await fs.writeFile(out+'/'+output,JSON.stringify({date:new Date().toISOString(),machine:{os:execFileSync('uname',['-sm'],{encoding:'utf8'}).trim(),cpu:execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),node:process.version},backend:hardware?'Metal requested; inspect renderer string':'Default headless SwiftShader',method:'GPU asset estimate is instrumented geometry buffers plus one 64px mipmapped glow texture; framebuffer estimate is RGBA8+depth at reported samples, not driver VRAM. Production Vite build. Headless Chromium; browser RAF intervals and CDP renderer TaskDuration. GL calls/buffer allocations counted through instrumented native methods. Software/hardware identity included. No hardware-GPU or whole-machine CPU claim.',errors,rows},null,2))}
assert.deepEqual(errors,[]);
