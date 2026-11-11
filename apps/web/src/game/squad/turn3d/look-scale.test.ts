import {expect,it} from 'vitest';
import {CATS,ENEMIES} from '../../../../../../packages/game-rules/src/cardrpg/depth/catalog';
import {UNIT_SCALE,MODEL_TO_STAGE,fallbackScale} from './look-scale';
import {parsePuppetRig} from './look-puppet-rig';
import {cardFormation} from './card-staging';
const rigs=Object.values(import.meta.glob('../../../../../../assets/cardrpg-look/v3-puppets/*.rig.json',{eager:true,import:'default'})).map(parsePuppetRig);
it('covers the rules roster exactly and uses rules boss tiers, including the solo elite Kettle',()=>{
  expect(Object.keys(UNIT_SCALE).sort()).toEqual([...CATS,...ENEMIES].map(u=>u.id).sort());
  for(const cat of CATS){expect(UNIT_SCALE[cat.id]!.kind).toBe('cat');expect(UNIT_SCALE[cat.id]!.height).toBe(1);}
  for(const enemy of ENEMIES){expect(UNIT_SCALE[enemy.id]!.rulesTier).toBe(enemy.tier);expect(UNIT_SCALE[enemy.id]!.kind==='boss').toBe(enemy.tier==='boss');}
  expect(UNIT_SCALE['kettle-knight']!.height).toBe(1.2);
});
it('normalizes measured bodies rather than padded image/hat/weapon extents',()=>{
  for(const rig of rigs){const u=UNIT_SCALE[rig.id]!,m=fallbackScale(rig);expect((m.max[1]!-m.min[1]!)*m.scale/MODEL_TO_STAGE).toBeCloseTo(u.height,10);expect(m.feet).toBeLessThan(1);if(u.kind==='boss')expect((m.max[0]!-m.min[0]!)*m.scale*m.widthScale/MODEL_TO_STAGE).toBeLessThanOrEqual(2.2);}
});
it('keeps all three party slots at the same depth regardless of gameplay row',()=>{
  const old={look:window.__LOOK_V2__,readable:window.__LOOK_B2__,art:window.__LOOK_ART__,pipeline:window.__LOOK_ART_PIPELINE__};
  try{window.__LOOK_V2__=true;window.__LOOK_B2__=true;window.__LOOK_ART__='v3';window.__LOOK_ART_PIPELINE__='puppet';
    const depths=[0,1,2].flatMap(slot=>['front','rear'].map(row=>cardFormation({slot,side:'party',role:'guardian'},row).z));
    expect(new Set(depths).size).toBe(1);
  }finally{window.__LOOK_V2__=old.look;window.__LOOK_B2__=old.readable;window.__LOOK_ART__=old.art;window.__LOOK_ART_PIPELINE__=old.pipeline;}
});
