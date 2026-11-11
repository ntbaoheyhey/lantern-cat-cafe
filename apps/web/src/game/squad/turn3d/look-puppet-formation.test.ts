import {describe,it,expect} from 'vitest';
import {updatePuppetBossAddLanes} from './look-puppet-formation';
describe('illustrated boss helper visibility',()=>{
  it('gives late summoned actors separate lanes without moving the initial pair',()=>{
    const lanes=new Map<string,number>();
    updatePuppetBossAddLanes(['foe-1-thread','foe-2-thread'],lanes);
    const initial=[...lanes];
    updatePuppetBossAddLanes(['foe-1-thread','foe-2-thread','foe-6-thread','foe-7-thread'],lanes);
    expect([...lanes].slice(0,2)).toEqual(initial);
    expect(new Set(lanes.values()).size).toBe(4);
    updatePuppetBossAddLanes(['foe-7-thread','foe-2-thread','foe-6-thread','foe-1-thread'],lanes);
    expect([...lanes].slice(0,2)).toEqual(initial);
  });
  it('reuses a defeated helper lane while surviving helpers keep their places',()=>{
    const lanes=new Map<string,number>();
    updatePuppetBossAddLanes(['a','b','c','d'],lanes);const old=new Map(lanes);
    updatePuppetBossAddLanes(['a','c','d','reinforcement'],lanes);
    expect(lanes.has('b')).toBe(false);
    for(const id of ['a','c','d'])expect(lanes.get(id)).toBe(old.get(id));
    expect(lanes.get('reinforcement')).toBe(old.get('b'));
    updatePuppetBossAddLanes([],lanes);expect(lanes.size).toBe(0);
  });
});
