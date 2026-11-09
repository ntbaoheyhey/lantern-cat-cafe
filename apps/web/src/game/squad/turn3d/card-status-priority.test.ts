import { describe, expect, it } from 'vitest';
import { showBodyMark } from './card-status-priority';
describe('bounded body vocabulary', () => {
  it('keeps high-stack damage marks ahead of control and buffs without mutating status data', () => {
    const marks = [{id:'cozy',stacks:3},{id:'drowsy',stacks:1},{id:'scald',stacks:5},{id:'scent',stacks:1},{id:'snag',stacks:4}];
    const before = JSON.stringify(marks);
    expect(marks.filter((_,i)=>showBodyMark(marks,i)).map(m=>m.id)).toEqual(['scald','scent','snag']);
    expect(JSON.stringify(marks)).toBe(before);
  });
  it('uses stable ties and retains control before buffs when fewer debuffs are present', () => {
    const marks = ['steep','drowsy','cozy','scald','glaze'];
    expect(marks.filter((_,i)=>showBodyMark(marks,i))).toEqual(['steep','drowsy','scald']);
    expect(['cozy','steep'].every((_,i,a)=>showBodyMark(a,i))).toBe(true);
  });
});
