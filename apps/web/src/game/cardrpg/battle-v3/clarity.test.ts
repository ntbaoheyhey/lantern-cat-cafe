import {expect,it} from 'vitest';
import {ShieldPulses,bodyTint} from './clarity';
it('ends the apply rim after 0.6 seconds even when shield HP persists',()=>{
 const pulses=new ShieldPulses();
 expect(pulses.sample('mochi',100,true,0).visible).toBe(true);
 expect(pulses.sample('mochi',80,true,.59).visible).toBe(true);
 for(let i=18;i<900;i++)expect(pulses.sample('mochi',80,true,i/30).visible).toBe(false);
 expect(pulses.sample('mochi',120,true,30).visible).toBe(true);
 expect(pulses.sample('mochi',120,true,30.61).visible).toBe(false);
 expect(pulses.sample('mochi',120,true,31,true).visible).toBe(true);
});
it('does not extend a bubble with repeated shield gains during its pulse',()=>{
 const pulses=new ShieldPulses();
 pulses.sample('panko',10,true,0);pulses.sample('panko',20,true,.3);
 expect(pulses.sample('panko',20,true,.61).visible).toBe(false);
 expect(pulses.sample('panko',0,false,.7).visible).toBe(false);
});
it('keeps status tint subtle at all phases and rear shading within six percent',()=>{
 for(const kind of ['poison','freeze','burn'] as const)for(let i=0;i<120;i++){
  const front=bodyTint([kind],i/30,false),rear=bodyTint([kind],i/30,true);
  front.forEach((v,j)=>{expect(v).toBeGreaterThanOrEqual(.76);expect(v).toBeLessThanOrEqual(1);expect(rear[j]!/v).toBeCloseTo(.94);});
 }
 expect(bodyTint([],0,false)).toEqual([1,1,1]);
 expect(bodyTint(['poison'],0,false)).not.toEqual(bodyTint(['poison'],.3,false));
});
