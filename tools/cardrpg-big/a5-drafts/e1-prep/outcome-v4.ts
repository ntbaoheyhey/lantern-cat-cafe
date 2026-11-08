import type { Battle, Row } from './contract';
import { GEAR_BY_ID, SETS } from './equipment';
import { SKILLS } from './catalog';

export interface OutcomeCauseV4 {
  id: string;
  actorId: string;
  kind: 'damage' | 'healing' | 'absorption' | 'gear' | 'cover' | 'plan';
  amount: number;
  unit: 'damage' | 'HP' | 'shield' | 'actions';
  text: string;
  templateId?: string;
}
const damageKinds = new Set(['damage', 'dot', 'detonate', 'shared', 'reflect']);
const planNames = { finish: 'Finish weak foes', support: 'Stop their support', leader: 'Focus the boss' };

/** Observed effects, not a counterfactual claim that a single contribution caused victory. */
export function outcomeV4(battle: Battle) {
  const party = battle.actors.filter(actor => actor.side === 'party');
  const partyIds = new Set(party.map(actor => actor.id));
  const enemies = new Set(battle.actors.filter(actor => actor.side === 'enemy').map(actor => actor.id));
  const name = (id: string) => battle.actors.find(actor => actor.id === id)?.name ?? id;
  const causes: OutcomeCauseV4[] = [];
  const totalDamage = battle.log.reduce((n, event) => n + (damageKinds.has(event.kind)
    && partyIds.has(event.actorId) && enemies.has(event.targetId) ? event.amount : 0), 0);
  const rows: Record<string, Row> = Object.fromEntries(battle.initial.cats.map(cat => [cat.id, cat.row]));
  const damageByRow = { front: 0, rear: 0 };
  for (const event of battle.log) {
    if (damageKinds.has(event.kind) && partyIds.has(event.targetId)) damageByRow[rows[event.targetId]!] += event.amount;
    if (event.kind === 'action' && SKILLS[event.skillId]?.effects.some(effect => effect.kind === 'swap')
      && partyIds.has(event.actorId) && partyIds.has(event.targetId)) {
      [rows[event.actorId], rows[event.targetId]] = [rows[event.targetId]!, rows[event.actorId]!];
    }
  }
  for (const actor of party) {
    const damage = battle.log.reduce((n, event) => n + (event.actorId === actor.id && enemies.has(event.targetId)
      && damageKinds.has(event.kind) ? event.amount : 0), 0);
    const healing = battle.log.reduce((n, event) => n + (event.actorId === actor.id && partyIds.has(event.targetId)
      && event.kind === 'heal' ? event.amount : 0), 0);
    const absorbed = battle.log.reduce((n, event) => n + (event.targetId === actor.id && event.kind === 'absorbed' ? event.amount : 0), 0);
    if (damage) causes.push({ id: `damage:${actor.id}`, actorId: actor.id, kind: 'damage', amount: damage, unit: 'damage',
      text: `${actor.name} dealt ${damage} damage · ${Math.round(damage * 100 / totalDamage)}% of your total.` });
    if (healing) causes.push({ id: `heal:${actor.id}`, actorId: actor.id, kind: 'healing', amount: healing, unit: 'HP',
      text: `${actor.name} restored ${healing} missing HP.` });
    if (absorbed) causes.push({ id: `absorb:${actor.id}`, actorId: actor.id, kind: 'absorption', amount: absorbed, unit: 'damage',
      text: `${actor.name}’s shields absorbed ${absorbed} damage.` });
  }
  const gearGroups = new Map<string, OutcomeCauseV4>();
  for (const event of battle.v4?.events ?? []) {
    if (event.kind !== 'gear-trigger' || !event.actorId || !partyIds.has(event.actorId) || event.amount <= 0) continue;
    // Version1 gearGrant has these two exact receipt forms. Do not guess a unit for unfamiliar events.
    const unit = event.text.includes(' restored ') && event.text.includes(' HP to ') ? 'HP'
      : event.text.includes(' granted ') && event.text.includes(' shield to ') ? 'shield' : null;
    if (!unit) continue;
    const template = GEAR_BY_ID[event.templateId];
    if (!template) continue;
    const worn = battle.initial.cats.find(cat => cat.id === event.actorId)?.equipment ?? [];
    const set = SETS.find(set => set.id === template.setId);
    const count = worn.filter(id => GEAR_BY_ID[id]?.setId === template.setId).length;
    const unique = event.effect.startsWith('unique:');
    const threshold = set?.twoEffect === event.effect ? 2 : set?.fourEffect === event.effect ? 4 : null;
    // Four equipped pieces do not turn the separate two-piece effect into a four-piece contribution.
    if (unique ? event.effect !== `unique:${template.unique}` || !worn.includes(template.id) : !threshold || count < threshold) continue;
    const key = `${event.actorId}:${unique ? template.id : template.setId}:${event.effect}:${unit}`;
    const prior = gearGroups.get(key), amount = (prior?.amount ?? 0) + event.amount;
    const source = unique ? template.name : `${set!.name} ${threshold}-piece`;
    gearGroups.set(key, { id: `gear:${key}`, kind: 'gear', actorId: event.actorId, amount, unit, templateId: event.templateId,
      text: `${source} on ${name(event.actorId)} ${unit === 'HP' ? 'restored' : 'granted'} ${amount} ${unit}.` });
  }
  const cover = (battle.v4?.events ?? []).filter(event => event.kind === 'formation-cover' && event.targetId && partyIds.has(event.targetId));
  for (const actor of party) {
    const amount = cover.reduce((n, event) => n + (event.kind === 'formation-cover' && event.targetId === actor.id ? event.amount : 0), 0);
    if (amount) causes.push({ id: `cover:${actor.id}`, actorId: actor.id, kind: 'cover', amount, unit: 'damage',
      text: `Front-row cover protected ${actor.name} from ${amount} damage.` });
  }
  const gear = [...gearGroups.values()].sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
  const ranked = causes.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
  // Reserve one place for measured equipment evidence; never invent an item contribution.
  const top = (gear.length ? [gear[0]!, ...ranked] : ranked).slice(0, 3);
  if (top.length < 3 && battle.v4) {
    const actor = party.find(actor => battle.v4!.events.some(event => event.kind === 'plan-target' && event.actorId === actor.id));
    if (actor) {
      const amount = battle.v4.events.filter(event => event.kind === 'plan-target' && event.actorId === actor.id).length;
      top.push({ id: `plan:${actor.id}`, actorId: actor.id, kind: 'plan', amount, unit: 'actions',
        text: `${actor.name} followed “${planNames[battle.v4.plan.focus]}” for ${amount} actions.` });
    }
  }
  const totalTaken = damageByRow.front + damageByRow.rear;
  const firstFall = battle.log.find(event => event.kind === 'defeat' && partyIds.has(event.targetId));
  return { causes: top, allCauses: [...gear, ...ranked], totalDamage, damageByRow,
    rearShare: totalTaken ? Math.round(damageByRow.rear * 100 / totalTaken) : 0,
    firstFallen: firstFall ? { id: firstFall.targetId, name: name(firstFall.targetId), round: firstFall.round } : null,
    reconstructedRows: rows };
}
