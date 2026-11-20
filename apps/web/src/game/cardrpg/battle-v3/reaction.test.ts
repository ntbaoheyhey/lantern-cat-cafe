import {expect,it} from 'vitest';
import {sampleReaction,reactionSample} from './reaction';
it('orders contact flash, squash, recovery, then neutral with exact boundaries',()=>{
 const times=[-1,0,59.999,60,119.999,120,299.999,300];
 expect(times.map(t=>sampleReaction(t).phase)).toEqual(['none','flash','flash','squash','squash','recover','recover','none']);
 expect(sampleReaction(59).flash).toBe(1);expect(sampleReaction(60).flash).toBe(0);
 expect(sampleReaction(90).recoil).toBe(1);expect(sampleReaction(120).squash).toBe(1);
 expect(sampleReaction(210).recoil).toBeGreaterThan(0);expect(sampleReaction(210).squash).toBeLessThan(1);
 expect(sampleReaction(300)).toEqual(reactionSample());
});
it('gives death priority and never revives after a 600ms dissolve',()=>{
 expect(sampleReaction(0,0)).toMatchObject({phase:'dissolve',flash:0,opacity:1,dissolve:0});
 expect(sampleReaction(0,300)).toMatchObject({phase:'dissolve',opacity:.5,dissolve:.5});
 for(const t of [600,601,10000])expect(sampleReaction(0,t)).toMatchObject({phase:'gone',opacity:0,dissolve:1});
});
it('is seekable, reuses caller storage, and keeps reduced motion free of recoil',()=>{
 const out=reactionSample(),first={...sampleReaction(160,-1,false,out)};
 expect(sampleReaction(160,-1,false,out)).toBe(out);sampleReaction(-1,400,false,out);
 expect(sampleReaction(160,-1,false,out)).toEqual(first);
 for(const t of [0,33,60,120,240])expect(sampleReaction(t,-1,true)).toMatchObject({recoil:0,squash:0});
 expect(sampleReaction(0,-1,true).flash).toBe(.3);expect(sampleReaction(Number.NaN)).toEqual(reactionSample());
});
