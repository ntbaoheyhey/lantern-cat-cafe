import type { Actor, Battle, BattleEvent } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import type { TurnEvent, TurnEventKind } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { createActionPlan, EFFECT_REGISTRY } from '../../squad/turn3d/effects';

const damageKinds = new Set(['reaction-damage','damage', 'dot', 'detonate', 'shared', 'reflect']);
const eventTypes: Record<string, TurnEventKind> = {
  'reaction-damage':'damage', damage: 'damage', dot: 'damage', detonate: 'damage', shared: 'damage', reflect: 'damage',
  heal: 'heal', revive: 'heal', survive: 'heal', shield: 'shield', defeat: 'death',
  status: 'status_apply', expire: 'status_expire', phase: 'boss_phase', summon: 'spawn',
};

/** A6's first threshold is a shield flag; the legacy phase field advances at the final threshold. */
export function displayedBossPhase(battle: Battle, actor: Actor): number {
  return battle.initial.gameplayA6 && actor.bonuses.a6FirstPhase ? actor.phase + 1 : actor.phase;
}

/** Copy only presentation-owned mutable fields. Rules keep their authoritative battle. */
export function snapshotBattle(battle: Battle): Battle {
  return { ...battle, ...(battle.initial.skillsV5&&battle.v4?{v4:{...battle.v4,events:[...battle.v4.events]}}:{}), actors: structuredClone(battle.actors), intents: structuredClone(battle.intents),
    queue: [...battle.queue], acted: [...battle.acted], log: [...battle.log] };
}

export function presentationEvents(log: BattleEvent[], battle: Battle, skillId: string): TurnEvent[] {
  return log.flatMap((event, index) => {
    const type = eventTypes[event.kind];
    if (!type) return [];
    return [{ version: 3, seq: index + 1, turn: 0, round: event.round,
      actionId: battle.log.length, beat: 2, type, actorId: event.actorId, skillId,
      targetIds: [event.targetId], amount: event.amount, note: event.text }];
  });
}

/** The action marker precedes round ticks in the existing rules log. */
export function splitPresentation(before: Battle, after: Battle, skillId: string) {
  const log = after.log.slice(before.log.length);
  const boundary = log.findIndex(event => event.kind === 'action' || event.kind === 'enemy-action') + 1;
  const actionLog = log.slice(0, boundary);
  const roundLog = log.slice(boundary);
  const impact = snapshotBattle(after);
  impact.round = before.round;
  impact.queue = [...before.queue];
  impact.intents = structuredClone(before.intents);
  impact.log = [...before.log, ...actionLog];
  if(after.initial.skillsV5&&impact.v4)impact.v4.events=impact.v4.events.filter(e=>e.version===1||e.logIndex<=before.log.length||e.logIndex<=impact.log.length&&e.stage!=='round-end');
  for (const actor of impact.actors) {
    const previous = before.actors.find(candidate => candidate.id === actor.id);
    if (!previous) continue;
    actor.hp = previous.hp;
    for (const event of actionLog) {
      if (event.targetId !== actor.id) continue;
      if (damageKinds.has(event.kind)) actor.hp -= event.amount;
      if (event.kind === 'heal') actor.hp += event.amount;
      if (event.kind === 'revive' || event.kind === 'survive') actor.hp = event.amount;
    }
    // Round-start shield grants stay with the grouped round beat.
    actor.shield -= roundLog.filter(event => event.kind === 'shield' && event.targetId === actor.id)
      .reduce((sum, event) => sum + event.amount, 0);
  }
  const roundEvents = presentationEvents(roundLog, after, 'round-status');
  const roundPlan = roundLog.length || after.round !== before.round
    ? createActionPlan(roundEvents, { ...EFFECT_REGISTRY.status_apply!, name: `Round ${after.round}`,
      duration: [0, 0, 70, 100, 130], ultimate: false, shake: 0 }) : null;
  if (roundPlan) {
    roundPlan.actorId = '';
    roundPlan.skillId = 'round-status';
    roundPlan.name = roundLog.find(event => event.kind === 'phase')?.text || `Round ${after.round} · recovery and status`;
    // One grouped 300 ms beat, including all status numbers and phase announcements.
    let start = 0;
    for (const [index, beat] of roundPlan.beats.entries()) {
      beat.start = start;
      beat.duration = [0, 0, 70, 100, 130][index]!;
      start += beat.duration;
    }
    roundPlan.duration = start;
  }
  return { impact, events: presentationEvents(actionLog, after, skillId), roundPlan };
}
