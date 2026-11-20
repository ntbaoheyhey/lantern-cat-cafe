import {describe,it,expect} from 'vitest';
import {stagePosition} from './layout';
import {PAINT} from './style';
describe('orthographic side-view contract',()=>{
 it('keeps the full cat crew left, facing the enemy area, with equal semantic sizes',()=>{const slots=[0,1,2].map(i=>stagePosition('party',i,false,true,4000));expect(slots.every(s=>s.x<0)).toBe(true);expect(Math.max(...slots.map(s=>s.scale))/Math.min(...slots.map(s=>s.scale))).toBeLessThanOrEqual(1.06);expect(PAINT.catHeight/PAINT.worldHeight).toBeGreaterThanOrEqual(.22);});
 it('fits the largest boss below 55 percent and keeps its left edge out of party faces',()=>{const party=stagePosition('party',2,false,true,4000),boss=stagePosition('enemy',0,true,true,4000),zoom=Math.min(PAINT.maxZoom,.55*PAINT.worldHeight/998);expect(998/PAINT.worldHeight*zoom).toBeLessThanOrEqual(.55);expect(boss.x-1126.4/2).toBeGreaterThan(party.x+256);});
});
