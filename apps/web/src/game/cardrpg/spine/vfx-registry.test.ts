import {describe,it,expect} from 'vitest';
import {PAINTED_VFX,PAINTED_STATUSES,FX_COLORS,GLYPHS,paintedCoverage,paintedTargets} from './vfx-registry';
import {SPINE_UNITS} from './config';
import {STATUS_IDENTITIES} from '../../squad/turn3d/card-status-data';
import {galleryFixture} from '../depth/feel-lab';
describe('painted effect contract',()=>{
 it('covers every current cat/enemy action and status with bounded reusable silhouettes',()=>{
  expect(paintedCoverage()).toEqual({skills:74,statuses:18,missing:[]});
  expect(PAINTED_STATUSES.map(s=>s.id).sort()).toEqual(Object.keys(STATUS_IDENTITIES).sort());
  for(const unit of SPINE_UNITS)for(const skill of unit.skills){const recipe=PAINTED_VFX.get(skill.id)!;expect(recipe.owner).toBe(unit.id);expect(FX_COLORS).toContain(recipe.color);expect(recipe.layers.length).toBeGreaterThan(0);for(const layer of recipe.layers){expect(GLYPHS).toContain(layer.glyph);expect(layer.count).toBeLessThanOrEqual(12);expect(layer.life).toBeGreaterThan(0);expect(layer.opacity).toBeLessThanOrEqual(.88);}}
 });
 it('keeps allied support separate from hostile impact flashes',()=>{
  expect(PAINTED_VFX.get('mochi-4')?.friendly).toBe(true);expect(PAINTED_VFX.get('soot-4')?.friendly).toBe(false);expect(PAINTED_VFX.get('soot-4')?.ultimate).toBe(true);
 });
 it('keeps a self-shield at contact instead of spending its whole effect in windup',()=>{
  const oven=PAINTED_VFX.get('panko-4')!;
  expect(oven.layers.filter(layer=>layer.phase==='windup').map(layer=>layer.glyph)).toEqual(['ring']);
  expect(oven.layers.filter(layer=>layer.phase==='contact').map(layer=>layer.glyph)).toEqual(['oven','ring','flame','ring']);
  expect(oven.layers.find(layer=>layer.glyph==='oven')?.socket).toBe('vfxOrigin');
  for(const recipe of PAINTED_VFX.values())expect(recipe.layers.some(layer=>layer.phase==='contact'),recipe.id).toBe(true);
 });
 it('shows the damaging Kettle signature at the victim and keeps true enemy support friendly',()=>{
  const kettle=PAINTED_VFX.get('enemy:kettle-knight')!;
  expect(kettle.friendly).toBe(false);
  expect(kettle.layers.filter(layer=>layer.phase==='contact').every(layer=>layer.anchor==='target')).toBe(true);
  expect(kettle.layers.some(layer=>layer.glyph==='shield')).toBe(false);
  expect(PAINTED_VFX.get('enemy:button-guard')!.friendly).toBe(true);
  expect(PAINTED_VFX.get('enemy:teacup-healer')!.friendly).toBe(true);
 });
 it('routes a mixed opening strike only to damage recipients, excluding its shield and counter damage',()=>{
  const {plan}=galleryFixture('enemy:kettle-knight'),hit=plan.events[1]!,victim=hit.targetIds[0]!,targets=['stale'];
  plan.targetIds.push(plan.actorId);
  plan.events.push({...hit,type:'shield',targetIds:[plan.actorId]},{...hit,actorId:victim,targetIds:[plan.actorId]},{...hit});
  paintedTargets(plan,false,targets);expect(targets).toEqual([victim]);
  paintedTargets(plan,true,targets);expect(targets).toEqual(plan.targetIds);
  plan.events=plan.events.filter(event=>event.type!=='damage');paintedTargets(plan,false,targets);expect(targets).toEqual([]);
 });
});
