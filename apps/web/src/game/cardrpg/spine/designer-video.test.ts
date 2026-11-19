import {describe,expect,it} from 'vitest';
import {designerBodyRect,designerVideoSource,validateDesignerVideoMeta,DESIGNER_BODY_UNITS} from './designer-video';
import {hasDesignerIdleBody} from './designer-idle-body';

const mochi={fps:30,frames:300,width:922,height:778,feetY:749,heightPx:720,anchor:[.5,.9627] as [number,number],marginPx:29,alpha:'straight' as const};
const chrome='Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Safari/537.36';
const safari='Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15';

describe('V9 designer video idles',()=>{
 it('accepts the converter meta and rejects broken feet lines',()=>{
  expect(validateDesignerVideoMeta(mochi).heightPx).toBe(720);
  expect(()=>validateDesignerVideoMeta({...mochi,feetY:900})).toThrow();
  expect(()=>validateDesignerVideoMeta({...mochi,anchor:[.5]})).toThrow();
 });
 it('plants the opaque body on the feet line at the shared body height',()=>{
  const body=designerBodyRect(mochi);
  expect(body.y).toBe(0);expect(body.height).toBe(DESIGNER_BODY_UNITS);
  expect(body.x).toBeCloseTo(-body.width/2,5);
  expect(body.width/body.height).toBeCloseTo((922-58)/720,3);
 });
 it('gives Safari the HEVC-alpha MOV and everyone else the VP9 WebM',()=>{
  const hevc={canPlayType:(t:string)=>t.includes('hvc1')?'probably':''};
  expect(designerVideoSource('/units/soot/designer/',hevc,safari)).toBe('/units/soot/designer/idle.mov');
  expect(designerVideoSource('/units/soot/designer/',hevc,chrome)).toBe('/units/soot/designer/idle.webm');
  expect(designerVideoSource('/units/soot/designer/',{canPlayType:()=>''},safari)).toBe('/units/soot/designer/idle.webm');
 });
 it('treats all three MVP cats as media bodies only once prepared',()=>{
  for(const id of ['mochi','clover','soot'])expect(hasDesignerIdleBody(id,{designerIdle:true})).toBe(true);
  expect(hasDesignerIdleBody('soot',{})).toBe(false);
  expect(hasDesignerIdleBody('panko',{designerIdle:true})).toBe(false);
 });
});
