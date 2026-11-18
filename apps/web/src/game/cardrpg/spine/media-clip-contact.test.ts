import {expect,it} from 'vitest';
import {animationCues,fixedActionClipTime} from './events';
import {mediaClipContact} from './media-clip-contact';
import type {SpineAnimation} from './config';

function actor(designerIdle=true){return{designerIdle,cues:(name:string)=>animationCues(name as SpineAnimation,name==='ult'?2.2:name==='attack'?.8:1,
 name==='ult'?[{name:'ult_release',time:1.1}]:name==='attack'?[{name:'hit',time:.35}]:[{name:'cast',time:.25},{name:'hit',time:.55}])};}

it.each(['mochi','clover'])('aligns %s media release to rules impact through the real retimer',asset=>{
 const a=actor(),contact=mediaClipContact(asset,a,'ult',2.2);
 expect(contact).toBe(1.1);
 expect(fixedActionClipTime(1100,2.2,contact,1100,2200,600)).toBe(1.1);
 expect(fixedActionClipTime(600,2.2,contact,1100,2200,600)).toBe(0);
 expect(fixedActionClipTime(2200,2.2,contact,1100,2200,600)).toBe(2.2);
});
it.each(['mochi','clover'])('keeps %s media basic and one-second skill contact cues',asset=>{
 expect(mediaClipContact(asset,actor(),'attack',.8)).toBe(.35);
 expect(mediaClipContact(asset,actor(),'skill',1)).toBe(.55);
});
it.each([['mochi',false],['clover',false],['panko',true]] as const)('preserves ordinary %s marker=%s cue fallback', (asset,marker)=>{
 expect(mediaClipContact(asset,actor(marker),'ult',2.2)).toBe(2.2*.55);
});
