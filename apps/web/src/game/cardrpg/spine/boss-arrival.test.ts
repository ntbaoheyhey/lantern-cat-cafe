import {expect,it} from 'vitest';
import {bossArrival,BOSS_ARRIVAL_MS,BOSS_LANDING_MS} from './boss-arrival';
import {neutralPose} from '../battle-v3/motion';

it('lands continuously, settles around the foot and releases completely',()=>{
 const start=bossArrival(0,720),near=bossArrival(BOSS_LANDING_MS-1,720),land=bossArrival(BOSS_LANDING_MS,720);
 expect(start.x).toBeGreaterThan(50);expect(start.y).toBeLessThan(-50);
 expect(Math.hypot(near.x,near.y)).toBeLessThan(.01);
 expect(land.x).toBeCloseTo(0);expect(land.y).toBeCloseTo(0);
 for(let t=BOSS_LANDING_MS;t<BOSS_ARRIVAL_MS;t+=5){const p=bossArrival(t,720);expect(p.x).toBeCloseTo(0);expect(p.y).toBeCloseTo(0);expect(p.sy).toBeGreaterThanOrEqual(.945);}
 expect(bossArrival(BOSS_ARRIVAL_MS,720)).toEqual(neutralPose());
 expect(bossArrival(10000,720)).toEqual(neutralPose());
});

it('keeps the first action frame continuous and yields before its strike',()=>{
 expect(bossArrival(80,720,{actionElapsed:0})).toEqual(bossArrival(80,720));
 const first=bossArrival(80,720,{actionElapsed:0}),next=bossArrival(81,720,{actionElapsed:1});
 expect(Math.hypot(next.x-first.x,next.y-first.y)).toBeLessThan(1);
 expect(bossArrival(160,720,{actionElapsed:80})).toEqual(neutralPose());
 expect(bossArrival(430,720,{actionElapsed:350})).toEqual(neutralPose());
});

it('removes approach and squash before incoming contact without restarting',()=>{
 const before=bossArrival(120,720,{hitInMs:150}),near=bossArrival(269,720,{hitInMs:1});
 expect(Math.hypot(before.x,before.y)).toBeGreaterThan(20);
 expect(Math.abs(near.sy-1)).toBeLessThan(.00001);
 for(const hitInMs of [0,-1,-100])expect(bossArrival(270-hitInMs,720,{hitInMs})).toEqual(neutralPose());
});

it('honours reduced motion, interrupted/dead actors and negative stagger ages',()=>{
 for(const age of [-80,0,80,240,430,620])expect(bossArrival(age,720,{disabled:true})).toEqual(neutralPose());
 expect(bossArrival(-1,720)).toEqual(neutralPose());
 const small=bossArrival(80,360),full=bossArrival(80,720);expect(small.x*2).toBe(full.x);expect(small.y*2).toBe(full.y);
});
