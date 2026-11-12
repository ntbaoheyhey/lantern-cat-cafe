import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import registry from '../../../../../../assets/cardrpg-look/spine/slots.json';
import {unitCore} from './core';
import { stageLayoutC2, overlapShareC2, SLOTS_C2, type StageUnitC2 } from './layout-c2';

const units=registry.units.map(u=>{
  const bounds=JSON.parse(readFileSync(resolve(process.cwd(),'../..',u.placeholder.skeleton),'utf8')).skeleton;
  const core=unitCore(u.id,bounds);return {coreHeight:core.world.height/bounds.height,coreRatio:core.ratio,id:u.id,side:u.side as 'party'|'enemy',row:'front' as const,aspect:bounds.width/bounds.height,boss:u.tier==='boss',bossRatio:core.ratio};
});
const unit=(id:string,row:'front'|'rear'):StageUnitC2=>({...units.find(u=>u.id===id)!,row});

it.each([[1280,720],[1440,900],[1024,600]])('keeps dense measured core boxes readable at %ix%i', (width,height)=>{
  // Every cat can occupy every seat. Exercise the widest four and every enemy/boss combination.
  const cats=units.filter(u=>u.side==='party').sort((a,b)=>b.aspect-a.aspect).slice(0,4);
  const party=cats.map((c,i)=>({...c,row:i<2?'front' as const:'rear' as const}));
  const foes=units.filter(u=>u.side==='enemy'&&!u.boss);
  const waves=[...foes.flatMap(a=>foes.map(b=>[a,{...a,id:a.id+'-front-2'},{...b,id:b.id+'-rear-1',row:'rear' as const},{...b,id:b.id+'-rear-2',row:'rear' as const}])) ,
    ...units.filter(u=>u.boss).map(b=>[b,unit('binding-thread','rear'),{...unit('binding-thread','rear'),id:'thread-2'}])];
  for(const wave of waves){
    const boxes=stageLayoutC2([...party,...wave],width,height),all=[...boxes];
    for(const [id,b] of all){
      expect(b.height/height,id).toBeGreaterThanOrEqual(.3);
      expect(b.x,id).toBeGreaterThanOrEqual(0);expect(b.x+b.width,id).toBeLessThanOrEqual(width);
      expect(b.y,id).toBeGreaterThanOrEqual(0);expect(b.y+b.height,id).toBeLessThanOrEqual(height);
    }
    const cores=all.map(([id,b])=>({...b,width:b.coreHeight*.65,x:b.footX-b.coreHeight*.325,y:b.footY-b.coreHeight,height:b.coreHeight}));
    for(let i=0;i<cores.length;i++)for(let j=i+1;j<cores.length;j++)expect(overlapShareC2(cores[i]!,cores[j]!),`${all[i]![0]} / ${all[j]![0]}`).toBeLessThanOrEqual(.4);
  }
});
it('uses the same tuned stagger and mirrored positions in preparation and battle',()=>{
  expect(SLOTS_C2.slots[0]!.y-SLOTS_C2.slots[2]!.y).toBeCloseTo(SLOTS_C2.rowStagger);
  expect(SLOTS_C2.slots[1]!.y-SLOTS_C2.slots[3]!.y).toBeCloseTo(SLOTS_C2.rowStagger);
  const b=stageLayoutC2([unit('mochi','front'),unit('button-guard','front')],1280,720);
  expect(b.get('mochi')!.footX+b.get('button-guard')!.footX).toBeCloseTo(1280);
});
