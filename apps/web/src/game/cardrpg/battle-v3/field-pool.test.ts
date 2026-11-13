import {it,expect} from 'vitest';
import {GroundPool,ElementParticlePool} from './field-pool';
it('bounds long fights and expires/reuses residues without replacing objects',()=>{
 const pool=new GroundPool(24),objects=[...pool.items];
 for(let n=0;n<500;n++)pool.emit(n,2,3,n/10,'#fff','leaf',71);
 expect(pool.items).toHaveLength(24);expect(pool.items.every((item,i)=>item===objects[i])).toBe(true);
 expect(pool.expire(50)).toBe(8);expect(pool.expire(51)).toBe(0);
 pool.emit(1,2,3,52,'#fff','leaf',71);pool.clear();expect(pool.expire(52)).toBe(0);
});
it('reuses deterministic particle trajectories across casts without touching combat state',()=>{
 const pool=new ElementParticlePool(),a=pool.get(71),copy=new Float32Array(a);
 for(let i=0;i<100;i++)expect(pool.get(71)).toBe(a);
 expect(pool.get(72)).not.toEqual(a);expect(a).toEqual(copy);expect(pool.allocated).toBe(144);
});
