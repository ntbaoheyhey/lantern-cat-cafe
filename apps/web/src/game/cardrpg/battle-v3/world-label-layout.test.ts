import {describe,it,expect} from 'vitest';
import {layoutWorldLabels,type LabelRect,type WorldLabel} from './world-label-layout';
import fixtures from './world-label-layout.fixtures.json';

const overlaps=(a:LabelRect,b:LabelRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

describe('actor-relative world labels',()=>{
 it.each(fixtures)('preserves all labels and avoids occupied bounds in $name',fixture=>{
  const labels=fixture.labels as WorldLabel[],placed=layoutWorldLabels(labels,fixture.width,fixture.height,fixture.obstacles,fixture.faces);
  expect(placed.map(x=>x.id).sort()).toEqual(labels.map(x=>x.id).sort());
  for(const [i,item] of placed.entries()){
   expect(item.feasible).toBe(true);
   expect(item.rect.width).toBe(labels.find(x=>x.id===item.id)!.rect.width);
   expect(item.rect.height).toBe(labels.find(x=>x.id===item.id)!.rect.height);
   expect(item.rect.x).toBeGreaterThanOrEqual(4);expect(item.rect.y).toBeGreaterThanOrEqual(4);
   expect(item.rect.x+item.rect.width).toBeLessThanOrEqual(fixture.width-4);
   expect(item.rect.y+item.rect.height).toBeLessThanOrEqual(fixture.height-4);
   expect([...fixture.faces,...fixture.obstacles,...placed.slice(i+1).map(x=>x.rect)].some(x=>overlaps(item.rect,x))).toBe(false);
  }
 });
 it('does not switch lanes when the narrow space above Soot closes',()=>{
  const pair=fixtures.filter(f=>f.name.startsWith('boss900'));
  const positions=pair.map(f=>{
   const box=layoutWorldLabels(f.labels as WorldLabel[],f.width,f.height,f.obstacles,f.faces).find(l=>l.id==='soot')!.rect;
   const face=f.faces.find(x=>x.id==='soot')!;expect(box.x).toBeGreaterThan(face.x+face.width);return box;
  });
  expect(Math.hypot(positions[1]!.x-positions[0]!.x,positions[1]!.y-positions[0]!.y)).toBeLessThan(10);
 });
 it('is independent of actor input order',()=>{
  const f=fixtures[0]!,labels=f.labels as WorldLabel[];
  expect(layoutWorldLabels([...labels].reverse(),f.width,f.height,f.obstacles,f.faces)).toEqual(layoutWorldLabels(labels,f.width,f.height,f.obstacles,f.faces));
 });
 it('retains information when a viewport has no feasible free rectangle',()=>{
  const labels:WorldLabel[]=[{id:'soot',side:'party',rect:{x:-20,y:-30,width:64,height:34}}];
  const result=layoutWorldLabels(labels,32,32,[],[]);
  expect(result).toHaveLength(1);expect(result[0]!.id).toBe('soot');expect(result[0]!.feasible).toBe(false);
 });
});
