import {expect,it} from 'vitest';
import {badgeEvents} from './number-badges';
it('keeps absorption separate from HP damage and never invents resistance',()=>{
 const log=[{kind:'damage',targetId:'foe',amount:7},{kind:'absorbed',targetId:'foe',amount:13},{kind:'resist',targetId:'cat',amount:0},{kind:'immune',targetId:'boss',amount:0}],before=structuredClone(log);
 expect(badgeEvents(log)).toEqual([{kind:'absorb',targetId:'foe',amount:13},{kind:'resist',targetId:'cat',amount:0},{kind:'immune',targetId:'boss',amount:0}]);
 expect(log).toEqual(before);expect(badgeEvents([{kind:'shield',targetId:'cat',amount:50}])).toEqual([]);
});
