import {expect,it} from 'vitest';
import {FocusBannerAnchor} from './focus';

it('keeps the title still through breathing, then relayouts for a new action or viewport',()=>{
 const anchor=new FocusBannerAnchor(),plan={},caster={x:500,y:200,width:250,height:300};
 const first=anchor.place(plan,caster,1280,720,[caster]);
 for(const shift of [-8,4,9,-3])expect(anchor.place(plan,{...caster,y:caster.y+shift},1280,720,[{...caster,y:caster.y+shift}])).toEqual(first);
 const resized=anchor.place(plan,caster,390,720,[caster]);
 expect(resized.x).toBeGreaterThanOrEqual(8);expect(resized.x+resized.width).toBeLessThanOrEqual(382);
 const next=anchor.place({}, {...caster,x:50},1280,720,[]);
 expect(next).not.toEqual(first);
});
