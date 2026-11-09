import {emitGameplayEvent} from '../events-v4';
import type { Actor, Battle, Effect, Skill } from '../contract';

export type ShapeV5 = 'single' | 'pierce' | 'row' | 'splash' | 'bounce' | 'all' | 'multi-hit' | 'one' | 'weakest' | 'ally-row' | 'team' | 'self' | 'fallen';
export interface EffectV5 extends Effect {
  recipient?: 'main' | 'weakest' | 'team';
  burnScaling?: number;
  cleanseCount?: number;
}
export interface SkillV5 extends Skill { shape?: ShapeV5; effects: EffectV5[] }
export interface LandingV5 { target: Actor; multiplier: number }
const alive = (b: Battle, side: Actor['side']) => b.actors.filter(a => a.side === side && a.hp > 0);
export const weakestV5 = (actors: Actor[]) => [...actors].sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp || a.id.localeCompare(c.id))[0];
/** Actor order is the stable formation order, including the front/rear boundary. */
export function adjacentV5(b: Battle, target: Actor): Actor[] {
  const formation = b.actors.filter(a => a.side === target.side && (a.hp > 0 || a.id === target.id));
  const i = formation.findIndex(a => a.id === target.id);
  if (i < 0) return [];
  return [formation[i - 1], formation[i + 1]].filter((a): a is Actor => !!a && a.hp > 0);
}
export function shapeV5(skill: SkillV5): ShapeV5 {
  if (skill.shape) return skill.shape;
  return ({foe:'single',pierce:'pierce',row:'row',foes:'all',ally:'one',allies:'team',self:'self',fallen:'fallen'} as const)[skill.target];
}
export function landingsV5(b: Battle, actor: Actor, main: Actor, shape: ShapeV5, roll: (max: number) => number): LandingV5[] {
  const foes = alive(b, actor.side === 'party' ? 'enemy' : 'party'), allies = alive(b, actor.side);
  const one = (target: Actor | undefined, multiplier = 1): LandingV5[] => target ? [{target, multiplier}] : [];
  switch (shape) {
    case 'self': return one(actor);
    case 'weakest': return one(weakestV5(allies));
    case 'team': return allies.map(target => ({target, multiplier:1}));
    case 'ally-row': return allies.filter(t => t.row === main.row).map(target => ({target, multiplier:1}));
    case 'row': return foes.filter(t => t.row === main.row).map(target => ({target, multiplier:.6}));
    case 'all': return foes.map(target => ({target, multiplier:.6}));
    case 'splash': return [...one(main), ...adjacentV5(b, main).map(target => ({target, multiplier:.4}))];
    case 'bounce': return [main, ...foes.filter(t => t.id !== main.id)].slice(0, 3).map((target, i) => ({target, multiplier:[1,.7,.5][i]!}));
    case 'multi-hit': return foes.length ? Array.from({length:3}, () => ({target:foes[roll(foes.length)]!,multiplier:.4})) : [];
    default: return one(main);
  }
}
export interface ShapeRuntimeV5 {
  roll: (b: Battle, max: number) => number;
  effect: (b: Battle, actor: Actor, target: Actor, effect: EffectV5, skill: Skill) => void;
  record: (b: Battle, actor: Actor, target: Actor, kind: string, amount: number, text: string, skillId: string) => void;
}
/** Resolve each landing before the next; a later random hit cannot select a defeated foe. */
export function executeShapeV5(b: Battle, actor: Actor, main: Actor, skill: SkillV5, io: ShapeRuntimeV5): void {
  const shape = shapeV5(skill), rolled = (n: number) => io.roll(b,n);
  const ordinary = shape === 'multi-hit' ? [] : landingsV5(b,actor,main,shape,rolled);
  const once = skill.effects.filter(e => e.self || e.recipient || e.kind === 'energy' || e.kind === 'chain');
  const perTarget = skill.effects.filter(e => !once.includes(e));
  const targets:string[]=[];
  const length = shape === 'multi-hit' ? 3 : ordinary.length;
  for (let i = 0; i < length; i++) {
    if (actor.hp <= 0) break;
    const foes = shape === 'multi-hit' ? alive(b,actor.side === 'party' ? 'enemy' : 'party') : [];
    const landing = shape === 'multi-hit' ? (foes.length ? {target:foes[rolled(foes.length)]!,multiplier:.4} : undefined) : ordinary[i];
    if (!landing) break;
    if (landing.target.hp <= 0 && shape !== 'fallen') continue;
    targets.push(landing.target.id);
    io.record(b,actor,landing.target,'multi-hit',i,shape,skill.id);
    for (const effect of perTarget) {
      const weighted = skill.shape && ['hit','execute'].includes(effect.kind) ? {...effect,power:(effect.power ?? 0)*landing.multiplier} : effect;
      io.effect(b,actor,landing.target,weighted,skill);
    }
  }
  if(targets.length&&['splash','multi-hit','bounce','row','all','team','ally-row'].includes(shape))emitGameplayEvent(b,{kind:'multi-hit',actorId:actor.id,skillId:skill.id,shape,targets,text:`${actor.name}: ${skill.name} reaches ${targets.length} landings.`});
  if (actor.hp <= 0) return;
  for (const effect of once) {
    const recipients = effect.self ? [actor] : effect.recipient === 'weakest' ? [weakestV5(alive(b,actor.side))] : effect.recipient === 'team' ? alive(b,actor.side) : [main];
    for (const target of recipients) if (target) io.effect(b,actor,target,effect,skill);
  }
}
