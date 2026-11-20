import {expect,it} from 'vitest';
import {ALTERNATE_CAMERAS,alternatePlateCamera} from './plate-camera';
it('keeps all twelve alternate takes inside their overscan and restores neutral framing',()=>{
 for(const owner of Object.keys(ALTERNATE_CAMERAS)){
  expect(alternatePlateCamera(owner,0)).toMatchObject({x:0,y:0,zoom:1});
  const end=alternatePlateCamera(owner,1);expect(end.x).toBeCloseTo(0);expect(end.y).toBeCloseTo(0);expect(end.zoom).toBeCloseTo(1);
  for(let i=0;i<=67;i++){
   const {x,y,angle,zoom}=alternatePlateCamera(owner,i/67);
   // Inverse-transform all host corners: every pixel has source image behind it.
   for(const px of [-640,640])for(const py of [-360,360]){
    const dx=px-x*12.8,dy=py-y*7.2;
    expect(Math.abs((dx*Math.cos(angle)+dy*Math.sin(angle))/zoom)).toBeLessThanOrEqual(640.0001);
    expect(Math.abs((-dx*Math.sin(angle)+dy*Math.cos(angle))/zoom)).toBeLessThanOrEqual(360.0001);
   }
  }
 }
});
