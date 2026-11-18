/** Read actual native dimensions outside timed play; do not change renderer quality. */
import assert from 'node:assert/strict';
export async function desktopDensity(page, expectedRatio) {
 const result=await page.evaluate(()=>{
  const s=window.__depthScene,r=s.renderer,c=r.domElement,g=r.getContext(),rect=c.getBoundingClientRect();
  return{devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},rendererRatio:r.getPixelRatio(),
   sceneSize:{width:s.width,height:s.height},canvas:{width:c.width,height:c.height,clientWidth:c.clientWidth,clientHeight:c.clientHeight,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}},
   drawingBuffer:{width:g.drawingBufferWidth,height:g.drawingBufferHeight},contextLost:g.isContextLost(),checksEnabled:r.debug.checkShaderErrors,
   composer:{input:{width:s.postFx.composer.inputBuffer.width,height:s.postFx.composer.inputBuffer.height},output:{width:s.postFx.composer.outputBuffer.width,height:s.postFx.composer.outputBuffer.height}},
   actors:s.actors.size,ready:s.ready,sceneError:window.__depthReview.sceneError??null};
 });
 assert.deepEqual(result.viewport,{width:1280,height:720});assert.equal(result.devicePixelRatio,expectedRatio);assert.equal(result.rendererRatio,Math.min(expectedRatio,2));
 assert(result.ready&&!result.contextLost&&result.checksEnabled);
 for(const key of ['width','height']){assert.equal(result.canvas[key],Math.floor(result.sceneSize[key]*result.rendererRatio));assert.equal(result.drawingBuffer[key],result.canvas[key]);}
 return result;
}
