import { expect, it } from 'vitest';
import registry from '../../../../../../assets/cardrpg-look/spine/slots.json';
import {UNIT_OPAQUE,unitCore,spriteFacing} from './core';
import { stageLayoutC2, overlapShareC2, SLOTS_C2, type StageUnitC2 } from './layout-c2';

const units=registry.units.map(u=>{
  const bounds=UNIT_OPAQUE.get(u.id)!.world;
  const core=unitCore(u.id,bounds);return {coreHeight:core.world.height/bounds.height,coreRatio:core.ratio,id:u.id,side:u.side as 'party'|'enemy',row:'front' as const,aspect:bounds.width/bounds.height,boss:u.tier==='boss',bossRatio:core.ratio};
});
const unit=(id:string,row:'front'|'rear'):StageUnitC2=>({...units.find(u=>u.id===id)!,row});

it.each([[1280,720],[1440,900]])('keeps dense measured core boxes readable at %ix%i', (width,height)=>{
  // Every cat can occupy every seat. Exercise the widest four and every enemy/boss combination.
  const cats=units.filter(u=>u.side==='party').sort((a,b)=>b.aspect-a.aspect).slice(0,4);
  const party=cats.map((c,i)=>({...c,row:i<2?'front' as const:'rear' as const}));
  const foes=units.filter(u=>u.side==='enemy'&&!u.boss);
  const waves=[...foes.flatMap(a=>foes.map(b=>[a,{...a,id:a.id+'-front-2'},{...b,id:b.id+'-rear-1',row:'rear' as const},{...b,id:b.id+'-rear-2',row:'rear' as const}])) ,
    ...units.filter(u=>u.boss).map(b=>[b,unit('binding-thread','rear'),{...unit('binding-thread','rear'),id:'thread-2'}])];
  for(const wave of waves){
    const fieldHeight=height,boxes=stageLayoutC2([...party,...wave],width,fieldHeight,height),all=[...boxes];
    for(const [id,b] of all){
      const actor=[...party,...wave].find(u=>u.id===id)!;
      const ratio=actor.boss?Math.min(1.6,Math.max(1.5,actor.bossRatio??1.6)):1;
      expect(b.coreHeight/height,id).toBeCloseTo(.315*ratio,5);
      expect(b.x,id).toBeGreaterThanOrEqual(0);expect(b.x+b.width,id).toBeLessThanOrEqual(width);
      expect(b.y,id).toBeGreaterThanOrEqual(0);expect(b.y+b.height,id).toBeLessThanOrEqual(fieldHeight);
    }
    const cores=all.map(([id,b])=>({...b,width:b.coreHeight*.65,x:b.footX-b.coreHeight*.325,y:b.footY-b.coreHeight,height:b.coreHeight}));
    for(let i=0;i<cores.length;i++)for(let j=i+1;j<cores.length;j++)expect(overlapShareC2(cores[i]!,cores[j]!),`${all[i]![0]} / ${all[j]![0]}`).toBeLessThanOrEqual(.4);
  }
});
it('gives six enemies distinct seats and keeps survivors in their seats',()=>{
  const foes=['kettle-knight','spool-ram','pollen-scout','crumb-sentinel','needle-moth','teacup-healer'].map((id,i)=>({...unit(id,i<2?'front':'rear'),seat:i}));
  const before=stageLayoutC2(foes,1280,504,720,6);
  expect(new Set([...before.values()].map(b=>`${b.footX}:${b.footY}`)).size).toBe(6);
  const after=stageLayoutC2(foes.filter((_,i)=>i!==1&&i!==4),1280,504,720,6);
  for(const [id,b] of after)expect(b).toEqual(before.get(id));
});
it('keeps the lower six-foe bodies above the1280x720 portrait strip',()=>{
 const foes=['kettle-knight','spool-ram','pollen-scout','crumb-sentinel','needle-moth','teacup-healer'].map((id,i)=>({...unit(id,i<2?'front':'rear'),asset:id,seat:i}));
 const layout=stageLayoutC2(foes,1280,720,720,6);
 for(const id of ['kettle-knight','spool-ram'])expect(layout.get(id)!.footY).toBeLessThanOrEqual(636.8-16);
 const withoutRam=stageLayoutC2(foes.filter(f=>f.id!=='spool-ram'),1280,720,720,6);
 expect(withoutRam.get('kettle-knight')).toEqual(layout.get('kettle-knight'));
});
it('reserves an asymmetric drawn envelope without changing its shared foot anchor per pose',()=>{
 const actor={...unit('soot','rear'),leftExtent:.9,rightExtent:.65};
 const first=stageLayoutC2([actor],1280,720).get(actor.id)!;
 expect(first.footX-first.coreHeight*actor.leftExtent).toBeCloseTo(1280*.04);
 const later=stageLayoutC2([{...actor}],1280,720).get(actor.id)!;
 expect(later.footX).toBe(first.footX);
});
it('uses the same tuned stagger and mirrored positions in preparation and battle',()=>{
  expect(SLOTS_C2.slots[0]!.y-SLOTS_C2.slots[2]!.y).toBeCloseTo(SLOTS_C2.rowStagger);
  // The lower front seat has extra vertical clearance for Clover's wide cast.
  expect(SLOTS_C2.slots[1]!.y-SLOTS_C2.slots[3]!.y).toBeCloseTo(SLOTS_C2.lowerRowStagger);
  expect(SLOTS_C2.lowerRowStagger).toBeGreaterThanOrEqual(SLOTS_C2.rowStagger);
  const b=stageLayoutC2([unit('mochi','front'),unit('button-guard','front')],1280,720);
  expect(b.get('mochi')!.footX+b.get('button-guard')!.footX).toBeCloseTo(1280);
});

it('faces each delivered sprite toward the other team, including both ram artworks',()=>{
 for(const u of registry.units){
  const native=u.nativeFacing==='right'?1:-1,desired=u.side==='party'?1:-1;
  expect(native*spriteFacing(u.nativeFacing,u.side as 'party'|'enemy'),u.id).toBe(desired);
 }
 expect(spriteFacing('left','enemy')).toBe(1);
 expect(spriteFacing('right','enemy')).toBe(-1);
});
