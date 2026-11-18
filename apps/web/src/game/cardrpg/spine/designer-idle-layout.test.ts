import {expect,it} from 'vitest';
import {designerVideoLayout,validateDesignerIdle,type DesignerIdleManifest} from './designer-idle-loader';

const manifest=():DesignerIdleManifest=>({version:1,id:'mochi',format:'h264-ycrcb-alpha-four-plane',video:'/units/mochi/designer-idle-ab.mp4',poster:'/units/mochi/designer-idle-cd.webp',width:312,height:260,opaqueHeight:256,foot:[165,258],duration:10,fps:30,frames:300,sourceSha256:'a'.repeat(64),videoSha256:'b'.repeat(64),posterSha256:'c'.repeat(64),videoBytes:931787,sockets:Object.fromEntries(['root','hip','head','hp-anchor','vfx-origin','main-hand','off-hand'].map(k=>[k,[165,200]]))});

it('accepts a four-plane clip without changing logical geometry or the intake budget',()=>{
 const m=manifest();expect(validateDesignerIdle(m,'mochi')).toBe(m);
 expect(designerVideoLayout(m)).toEqual({width:624,height:520,maskX:312,maskY:260});
 expect([m.width,m.height,m.opaqueHeight,m.foot]).toEqual([312,260,256,[165,258]]);
 m.videoBytes=1_000_001;expect(()=>validateDesignerIdle(m,'mochi')).toThrow('budget');
});

it('preserves the established RGB/mask layout',()=>{
 const m=manifest();m.format='h264-rgb-mask';expect(validateDesignerIdle(m,'mochi')).toBe(m);
 expect(designerVideoLayout(m)).toEqual({width:312,height:520,maskX:0,maskY:260});
});

it('rejects an unrecognized plane ordering and a shortened loop',()=>{
 expect(()=>validateDesignerIdle({...manifest(),format:'h264-rgba-four-plane'},'mochi')).toThrow('identity');
 expect(()=>validateDesignerIdle({...manifest(),duration:3,frames:90},'mochi')).toThrow('300 frames');
 expect(()=>validateDesignerIdle({...manifest(),width:311},'mochi')).toThrow('dimensions');
});
