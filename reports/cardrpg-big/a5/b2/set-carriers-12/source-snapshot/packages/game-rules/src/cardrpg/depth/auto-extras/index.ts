/** Opt-in, encounter-local experiments. Nothing is added to Battle/Account/save.
 * Disabled calls dispatch directly to the existing deterministic rules. */
import { act, currentActor, enemyAct, stacks } from '../battle';
import { chooseAction } from '../policies';
import { ENEMY_BY_ID, hasAdvantage } from '../catalog';
import type { Actor, Battle, Choice, Flavour } from '../contract';

export interface AutoExtrasOptions {
  autoExtras: boolean;
  teaCloud: boolean;
  frontRelay: boolean;
  intentLens: boolean;
}
export const DEFAULT_AUTO_EXTRAS: Readonly<AutoExtrasOptions> = Object.freeze({
  autoExtras: false, teaCloud: false, frontRelay: false, intentLens: false,
});
export interface AutoExtraCue {
  id: 'tea-cloud' | 'front-relay'; actorId: string; targetId: string;
  round: number; amount: number; label: string;
}
export interface AutoExtrasMemory { rounds: Partial<Record<AutoExtraCue['id'], number>>; cues: AutoExtraCue[] }
export function createAutoExtrasMemory(): AutoExtrasMemory { return { rounds: {}, cues: [] }; }

function addCue(b: Battle, memory: AutoExtrasMemory, cue: AutoExtraCue) {
  memory.rounds[cue.id] = cue.round; memory.cues.push(cue);
  b.log.push({ round: cue.round, actorId: cue.actorId, targetId: cue.targetId,
    skillId: `auto-extra:${cue.id}`, kind: 'auto-extra', amount: cue.amount, text: cue.label });
}

export function actAutoExtras(b: Battle, memory: AutoExtrasMemory,
  options: Readonly<AutoExtrasOptions> = DEFAULT_AUTO_EXTRAS, choice?: Choice): boolean {
  memory.cues = [];
  if (b.result) return false;
  const source = currentActor(b);
  if (!source) return false;
  const selected = source.side === 'party' ? choice ?? chooseAction(b, 'auto') : undefined;
  // This exact path does not inspect, attach fields to, or clone the battle.
  if (!options.autoExtras) return source.side === 'enemy' ? enemyAct(b) : act(b, selected!);
  const round = b.round, logStart = b.log.length;
  const scaldedByAlly = new Set(b.actors.filter(target => target.side === 'enemy'
    && target.statuses.some(status => status.id === 'scald' && status.stacks > 0
      && status.source !== source.id && b.actors.some(a => a.id === status.source && a.side === 'party'))).map(a => a.id));
  const accepted = source.side === 'enemy' ? enemyAct(b) : act(b, selected!);
  if (!accepted || b.result || source.side !== 'party' || source.hp <= 0) return accepted;
  const events = b.log.slice(logStart);
  const boundary = events.findIndex(event => event.kind === 'action');
  const actionEvents = boundary < 0 ? [] : events.slice(0, boundary);
  if (options.teaCloud && memory.rounds['tea-cloud'] !== round
    && (source.flavour === 'tide' || source.flavour === 'garden')
    && actionEvents.some(e => e.actorId === source.id && e.kind === 'damage' && e.amount > 0 && scaldedByAlly.has(e.targetId))) {
    const recipient = b.actors.filter(a => a.side === 'party' && a.hp > 0 && a.shield < Math.floor(a.maxHp * .6))
      .sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp || a.id.localeCompare(c.id))[0];
    if (recipient) {
      const amount = Math.min(18, Math.floor(recipient.maxHp * .6) - recipient.shield);
      recipient.shield += amount;
      b.log.push({ round, actorId: source.id, targetId: recipient.id, skillId: 'auto-extra:tea-cloud', kind: 'shield', amount, text: 'Tea cloud' });
      addCue(b, memory, { id: 'tea-cloud', round, actorId: source.id, targetId: recipient.id,
        amount, label: `${source.name} follows an ally’s Scald · ${recipient.name} +${amount} shield` });
    }
  }
  if (options.frontRelay && source.row === 'rear' && memory.rounds['front-relay'] !== round) {
    const recipients = b.actors.filter(a => a.side === 'party' && a.row === 'front' && a.hp > 0 && a.charge < 100
      && a.id !== source.id && actionEvents.some(e => e.actorId === source.id && e.targetId === a.id
        && (e.kind === 'heal' || e.kind === 'shield') && e.amount > 0)).sort((a, c) => a.id.localeCompare(c.id));
    const recipient = recipients[0];
    if (recipient) {
      const amount = Math.min(6, 100 - recipient.charge); recipient.charge += amount;
      addCue(b, memory, { id: 'front-relay', round, actorId: source.id, targetId: recipient.id,
        amount, label: `Front relay · ${source.name} supports ${recipient.name}, +${amount} charge` });
    }
  }
  return accepted;
}

export function playAutoExtras(b: Battle, memory = createAutoExtrasMemory(),
  options: Readonly<AutoExtrasOptions> = DEFAULT_AUTO_EXTRAS, maxActions = 900): Battle {
  for (let action = 0; action < maxActions && !b.result; action++) {
    if (!actAutoExtras(b, memory, options)) throw Error('Automatic experiment stalled');
  }
  if (!b.result) throw Error('Automatic experiment exceeded its action bound');
  return b;
}

/** Existing public tells and flavour advantage, never a target-selection control. */
export function autoIntentHints(b: Battle, options: Readonly<AutoExtrasOptions> = DEFAULT_AUTO_EXTRAS) {
  if (!options.autoExtras || !options.intentLens) return [];
  const flavours: Flavour[] = ['hearth', 'moon', 'garden', 'tide', 'ember'];
  return b.intents.flatMap(intent => {
    const enemy = b.actors.find(a => a.id === intent.actorId && a.hp > 0);
    if (!enemy) return [];
    const spec = ENEMY_BY_ID[enemy.catalogId];
    const target = b.actors.find(a => a.id === intent.targetId);
    return [{ actorId: enemy.id, name: enemy.name, targetId: target?.id ?? '',
      target: target?.name ?? 'Living companion', row: target?.row ?? 'front',
      softened: intent.interrupted || stacks(enemy, 'drowsy') > 0,
      phase: enemy.phase, signature: intent.signature, counter: spec?.counter ?? '',
      weakTo: flavours.filter(flavour => hasAdvantage(flavour, enemy.flavour)),
      label: intent.label }];
  });
}
export type { Actor };
