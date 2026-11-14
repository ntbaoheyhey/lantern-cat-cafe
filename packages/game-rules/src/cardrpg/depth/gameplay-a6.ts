import { clone } from '../internal';
import { ENEMY_BY_ID, CAT_BY_ID } from './catalog';
import { emitGameplayEvent } from './events-v4';
import { setSkillsV5 } from './skills-v5';
import type { Actor, Battle, DepthAccount } from './contract';

/** F6: the live kit is always Basic + Ultimate, including migrated accounts. */
export function battleKitA6(id:string) {
  return CAT_BY_ID[id]?.skills.filter(skill=>skill.id.endsWith('-1')||skill.type==='ultimate')??[];
}

/** Preferences affect the next route; a committed route keeps its rules. */
export function gameplayA6(state: DepthAccount): boolean {
  return !!(state.run && !state.run.complete ? state.run.gameplayA6 : state.gameplayA6);
}
export function setGameplayA6(state: DepthAccount, enabled: boolean): DepthAccount {
  const next = enabled ? setSkillsV5(state, true) : clone(state);
  if (enabled) {next.gameplayA6 = true;if(next.settings.speed===4)next.settings.speed=3;}
  else {delete next.gameplayA6;if(!next.run?.gameplayA6&&next.settings.speed===3)next.settings.speed=2;}
  return next;
}
export const RAGE_COST_A6 = 100;
export const RAGE_GAIN_A6: Record<string, number> = {
  mochi: 2, panko: 2, brioche: 2, mallow: 2, soot: 2, cinnamon: 2,
  clover: 2, sorrel: 2, marigold: 2, velvet: 2, biscuit: 2, inkcap: 2,
};
export function gainRageA6(b: Battle, actor: Actor, amount: number): void {
  if (!b.initial.gameplayA6 || actor.hp <= 0) return;
  const before = actor.charge;
  actor.charge = Math.min(RAGE_COST_A6, before + Math.round(amount * (RAGE_GAIN_A6[actor.catalogId] ?? 2)));
  if (before < RAGE_COST_A6 && actor.charge === RAGE_COST_A6)
    emitGameplayEvent(b, { kind: 'rage.full', actorId: actor.id, amount: RAGE_COST_A6, text: `${actor.name}: rage full!` });
}

/** One hit reward per action prevents multi-hit kits from dominating rage gain. */
export function hitRageA6(b: Battle, source: Actor, target: Actor, amount: number): void {
  if (!b.initial.gameplayA6 || amount <= 0) return;
  const action = b.procRounds.v5ActionSequence ?? 0;
  if (source.bonuses.a6HitAction !== action) {
    source.bonuses.a6HitAction = action;
    gainRageA6(b, source, 5);
  }
  gainRageA6(b, target, Math.min(12, Math.max(2, Math.round(amount / target.maxHp * 40))));
}

/** A short shield beat at 66%, then the existing V5 Binding Thread phase at 33%. */
export function phaseBossA6(b: Battle, boss: Actor): void {
  if (!b.initial.gameplayA6 || boss.side !== 'enemy' || ENEMY_BY_ID[boss.catalogId]?.tier !== 'boss' || boss.hp <= 0) return;
  if (boss.hp <= boss.maxHp * .66 && !boss.bonuses.a6FirstPhase) {
    boss.bonuses.a6FirstPhase = 1;
    const amount = Math.round(boss.maxHp * .06);
    boss.shield += amount;
    b.log.push({ round: b.round, actorId: boss.id, targetId: boss.id, kind: 'shield', skillId: '', amount, text: `${boss.name} gathers a woolguard shield.` });
    emitGameplayEvent(b, { kind: 'boss-phase', actorId: boss.id, bossId: boss.catalogId, from: 1, to: 2, threshold: .66, text: `${boss.name}: woolguard shield!` });
  }
  if (boss.hp <= boss.maxHp * .33 && boss.phase === 1) {
    boss.phase = 2;
    emitGameplayEvent(b, { kind: 'boss-phase', actorId: boss.id, bossId: boss.catalogId, from: 2, to: 3, threshold: .33, text: `${boss.name}: Binding Threads! Clear the knots.` });
  }
}

/** An opted-in encounter scales once on actor creation, never the replay setup. */
export function prepareBattleA6(b: Battle): void {
  if (!b.initial.gameplayA6 || b.initial.tutorial) return;
  for (const actor of b.actors) {
    actor.charge = actor.side === 'party' ? 35 : 15;
    if (actor.side !== 'enemy') continue;
    const boss = ENEMY_BY_ID[actor.catalogId]?.tier === 'boss';
    const hpScale = boss ? .82 : 1.95;
    actor.maxHp = Math.round(actor.maxHp * hpScale); actor.hp = actor.maxHp;
    actor.attack = Math.max(1, Math.round(actor.attack * (b.chapter === 1 ? .65 : .85)));
  }
}
