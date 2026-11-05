import { HEROES, NAMES, TURN_CONFIG as C, TURN_SKILLS } from './config';
import { getTimeline, insertSlot, interval, moveSlot } from './initiative';
import { affected, getLegalActions, getLegalTargets, hasStatus, living, taunter } from './targeting';
import type { Hero, Role, Side, StatusKind, TurnActor, TurnBattle, TurnChoice, TurnEvent, TurnEventKind,
  TurnIntent, TurnOptions, TurnSkill } from './types';

export { getTimeline, getLegalActions, getLegalTargets };
export { getAutoAction } from './policy';
const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const find = (b: TurnBattle, id: string): TurnActor | undefined => b.actors.find(a => a.id === id);
const aliveSide = (b: TurnBattle, side: Side): TurnActor[] => b.actors.filter(a => living(a) && a.side === side);
const has = hasStatus;
const zero = () => ({ damage: 0, healing: 0, shielding: 0 });
interface Plan { from: number; id: number; actorId: string; skillId: string }
function plan(b: TurnBattle, actorId = '', skillId = ''): Plan {
  return { from: b.events.length, id: (b.events.at(-1)?.actionId ?? -1) + 1, actorId, skillId };
}
function emit(b: TurnBattle, p: Plan, type: TurnEventKind, beat: number,
  data: Partial<Omit<TurnEvent, 'version' | 'seq' | 'turn' | 'actionId' | 'type' | 'beat'>> = {}): void {
  const actorId = data.actorId ?? p.actorId, targetIds = data.targetIds ?? [];
  // Outcome snapshots contain only affected actors. Including an unrelated source here
  // could rewind its later charge/status snapshot when reactions are sorted after hits.
  const actors = data.actors ?? b.actors.filter(a => targetIds.length ? targetIds.includes(a.id) : a.id === actorId);
  b.events.push(copy({ version: 2, seq: b.events.length, turn: b.turn, actionId: p.id, beat,
    type, actorId, skillId: p.skillId, targetIds, amount: 0, ...data, actors }));
}
/** Batch consequences by presentation beat. Stable sorting preserves same-beat causality. */
function closePlan(b: TurnBattle, p: Plan): TurnEvent[] {
  emit(b, p, 'snapshot', 4, { actors: b.actors, intents: b.intents, wave: b.wave, bossPhase: b.bossPhase,
    ...(b.result ? { result: b.result } : {}) });
  const events = b.events.splice(p.from).sort((a, z) => a.beat - z.beat);
  for (const event of events) { event.seq = b.events.length; b.events.push(event); }
  return events;
}
function random(b: TurnBattle): number {
  let n = b.rng; n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  b.rng = n >>> 0; return b.rng / 0x100000000;
}
function makeActor(role: Role, slot: number, id: string, b: TurnBattle): TurnActor {
  const side: Side = HEROES.includes(role as Hero) ? 'party' : 'enemy', base = C.stats[role], preset = C.presets[b.preset];
  const hp = Math.round(base.hp * (side === 'party' ? preset.hp : 1));
  return { id, role, name: NAMES[role], side, slot, row: side === 'party' ? (slot === 0 ? 'front' : 'rear')
    : ['ranger', 'healer', 'thread'].includes(role) ? 'rear' : 'front',
    hp, maxHp: hp, shield: 0, shieldTurns: 0, charge: side === 'party' ? C.charge.initial : 0,
    attack: Math.round(base.attack * (side === 'party' ? preset.attack : 1)), defense: base.defense,
    speed: base.speed * (side === 'party' ? preset.speed : 1), crit: base.crit, auto: false,
    statuses: [], cooldowns: {}, turnsTaken: 0, break: 0, controlCount: 0, passiveReady: 0 };
}
function enemySkill(b: TurnBattle, a: TurnActor): string {
  if (a.role !== 'yarn') return `${a.role}Attack`;
  const cycle = b.bossPhase >= 2 ? C.boss.cycleTwo : C.boss.cycleOne;
  return cycle[b.bossTurns % cycle.length]!;
}
function chooseEnemyTarget(b: TurnBattle, source: TurnActor, skill: TurnSkill): TurnActor | undefined {
  const friendly = ['ally', 'allAllies', 'self'].includes(skill.target);
  const candidates = b.actors.filter(a => living(a) && (friendly ? a.side === source.side : a.side !== source.side));
  if (skill.target === 'self') return source;
  if (friendly) return candidates.sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp || a.slot - z.slot || a.id.localeCompare(z.id))[0];
  const forced = skill.target === 'enemy' ? taunter(b, source) : undefined;
  if (forced) return forced;
  if (source.boundAlly) {
    const captive = candidates.find(a => a.id === source.boundAlly);
    if (captive) return captive;
  }
  const rear = ['flanker', 'ranger'].includes(source.role) || skill.id === 'bindThread';
  return candidates.sort((a, z) => {
    if (skill.id === 'bindThread' && has(a, 'restrain') !== has(z, 'restrain')) return Number(has(a, 'restrain')) - Number(has(z, 'restrain'));
    const row = rear ? 'rear' : 'front';
    return Number(z.row === row) - Number(a.row === row) || a.hp / a.maxHp - z.hp / z.maxHp || a.slot - z.slot || a.id.localeCompare(z.id);
  })[0];
}
function commitIntent(b: TurnBattle, p: Plan, a: TurnActor, note = 'Committed next action.'): void {
  if (!living(a) || a.side !== 'enemy') return;
  const skill = TURN_SKILLS[enemySkill(b, a)]!, target = chooseEnemyTarget(b, a, skill);
  if (!target) { delete b.intents[a.id]; return; }
  b.intents[a.id] = { actorId: a.id, skillId: skill.id, targetId: target.id,
    targetIds: affected(b, a, skill, target).map(t => t.id), icon: skill.icon, label: skill.name,
    countdown: a.id === b.activeId ? 0 : 1, interrupted: false };
  emit(b, p, 'intent', 4, { actorId: a.id, skillId: skill.id, targetIds: b.intents[a.id]!.targetIds, note, intents: b.intents });
}
function refreshIntents(b: TurnBattle, p: Plan, beat = 4): void {
  for (const a of aliveSide(b, 'enemy')) {
    const intent = b.intents[a.id];
    if (!intent) { commitIntent(b, p, a); continue; }
    const skill = TURN_SKILLS[intent.skillId]!, old = find(b, intent.targetId);
    const forced = skill.target === 'enemy' ? taunter(b, a) : undefined;
    const target = forced ?? (old && living(old) ? old : chooseEnemyTarget(b, a, skill));
    if (!target) { delete b.intents[a.id]; continue; }
    const ids = affected(b, a, skill, target).map(t => t.id);
    const changed = intent.targetId !== target.id || ids.join('|') !== intent.targetIds.join('|');
    intent.countdown = a.id === b.activeId ? 0 : a.role === 'yarn' ? 1 : b.queue.findIndex(s => s.actorId === a.id) + 1;
    if (changed) {
      intent.targetId = target.id; intent.targetIds = ids;
      emit(b, p, 'intent', beat, { actorId: a.id, skillId: skill.id, targetIds: ids,
        note: forced ? 'Taunt redirects the committed target.' : 'Target defeated; intent retargets.', intents: b.intents });
    }
  }
  b.bossCountdown = b.activeId && find(b, b.activeId)?.role === 'yarn' ? 0 : 1;
}
function spawnWave(b: TurnBattle, p: Plan): void {
  b.actors = b.actors.filter(a => a.side === 'party');
  b.queue = b.queue.filter(s => find(b, s.actorId)?.side === 'party'); b.intents = {};
  const boss = b.encounter === 'boss' || (b.encounter === 'campaign' && b.wave === C.waves.length);
  const roles: readonly Role[] = boss ? ['yarn'] : b.encounter === 'dummy' ? ['dummy']
    : b.encounter === 'group' ? C.trainingRoles : C.waves[b.wave]!.roles;
  if (boss) { b.bossPhase = 1; b.bossTurns = 0; b.bossCountdown = 1; }
  for (const [slot, role] of roles.entries()) {
    const a = makeActor(role, slot, `w${b.wave}-${role}-${slot}`, b);
    b.actors.push(a); b.totals[a.id] = zero();
    insertSlot(b, b.queue, { actorId: a.id, at: b.clock + interval(a) });
  }
  emit(b, p, 'wave_start', 4, { actors: b.actors, wave: b.wave, bossPhase: b.bossPhase });
  for (const a of aliveSide(b, 'enemy')) commitIntent(b, p, a);
  refreshIntents(b, p);
}
export function createTurnBattle(options: TurnOptions = {}): TurnBattle {
  const seed = (options.seed ?? C.defaultSeed) >>> 0;
  const encounter = options.encounter ?? 'campaign';
  const initialWave = Number.isFinite(options.wave) ? Math.floor(options.wave!) : 0;
  const b: TurnBattle = { version: 2, seed, rng: seed || 1, encounter, preset: options.preset ?? 'hearthkeepers',
    actors: [], queue: [], clock: 0, turn: 0, activeId: null, phase: 'ready', selected: null,
    events: [], history: [], intents: {}, wave: encounter === 'boss' ? C.waves.length : Math.max(0, Math.min(C.waves.length - 1, initialWave)),
    bossPhase: 0, bossTurns: 0, bossCountdown: 1, settledWaves: [], fishFound: 0, deaths: [], result: null, totals: {} };
  b.actors = HEROES.map((role, slot) => makeActor(role, slot, role, b));
  for (const a of b.actors) { b.totals[a.id] = zero(); insertSlot(b, b.queue, { actorId: a.id, at: interval(a) }); }
  const p = plan(b); spawnWave(b, p); closePlan(b, p);
  return b;
}
function charge(b: TurnBattle, p: Plan, a: TurnActor, amount: number, note: string): void {
  if (!living(a) || a.side !== 'party') return;
  const before = a.charge; a.charge = Math.max(0, Math.min(C.charge.max, a.charge + amount));
  if (before !== a.charge) emit(b, p, 'charge', 2, { targetIds: [a.id], amount: a.charge - before, note });
}
function shield(b: TurnBattle, p: Plan, source: TurnActor, target: TurnActor, raw: number, skillId = p.skillId): void {
  if (!living(target)) return;
  const before = target.shield;
  target.shield = Math.min(Math.round(target.maxHp * C.caps.shieldFraction), target.shield + Math.round(raw * (source.side === 'party' ? C.presets[b.preset].shield : 1)));
  const added = target.shield - before;
  if (added <= 0) return;
  target.shieldTurns = C.shieldTurns;
  (b.totals[source.id] ??= zero()).shielding += added;
  emit(b, p, 'shield', 2, { actorId: source.id, skillId, targetIds: [target.id], amount: added });
}
function passive(b: TurnBattle, p: Plan, source: TurnActor, skillId: string, targets: string[]): boolean {
  if (source.turnsTaken < source.passiveReady || !living(source)) return false;
  source.passiveReady = source.turnsTaken + C.passive.cooldown;
  emit(b, p, 'passive', 2, { actorId: source.id, skillId, targetIds: targets });
  return true;
}
function heal(b: TurnBattle, p: Plan, source: TurnActor, target: TurnActor, raw: number): void {
  if (!living(target)) return;
  const injured = target.hp / target.maxHp < C.passive.injuredFraction;
  const added = Math.min(target.maxHp - target.hp, Math.round(raw * (source.side === 'party' ? C.presets[b.preset].healing : 1)));
  target.hp += added; (b.totals[source.id] ??= zero()).healing += added;
  emit(b, p, 'heal', 2, { actorId: source.id, targetIds: [target.id], amount: added });
  if (source.role === 'alchemist' && injured && added > 0 && passive(b, p, source, 'lastSip', [target.id]))
    shield(b, p, source, target, C.passive.alchemistShield, 'lastSip');
  if (source.role === 'alchemist' && b.preset === 'hearthkeepers' && p.skillId === 'milkFlask' && added > 0)
    shield(b, p, source, target, C.gear.afterhealShield, 'lastLight');
}
function expireStatus(b: TurnBattle, p: Plan, target: TurnActor, kind: StatusKind, note: string): void {
  for (const s of target.statuses.filter(s => s.kind === kind)) {
    target.statuses = target.statuses.filter(other => other !== s);
    if (kind === 'restrain') {
      const thread = find(b, s.source);
      if (thread?.role === 'thread') delete thread.boundAlly;
    }
    emit(b, p, 'status_expire', 2, { targetIds: [target.id], status: kind, note });
  }
}
function cleanse(b: TurnBattle, p: Plan, target: TurnActor): void {
  for (const s of [...target.statuses]) if (s.kind !== 'guard') expireStatus(b, p, target, s.kind, `Cleanse: ${s.kind}.`);
}
function status(b: TurnBattle, p: Plan, source: TurnActor, target: TurnActor, kind: StatusKind, turns: number, strength = 1): boolean {
  if (!living(target)) return false;
  if (kind === 'stun' || kind === 'snare') {
    if (target.controlCount > 0) {
      emit(b, p, 'fizzle', 2, { targetIds: [target.id], status: kind, note: 'Control resisted during recovery.' }); return false;
    }
    turns = Math.min(turns, target.role === 'yarn' ? C.control.bossTurns : C.control.normalTurns);
    target.controlCount = turns + (target.role === 'yarn' ? C.control.bossRecoveryTurns : C.control.recoveryTurns);
  }
  const existing = target.statuses.find(s => s.kind === kind);
  if (existing) {
    existing.turns = Math.max(existing.turns, turns); existing.appliedTurn = b.turn; existing.source = source.id;
    existing.strength = kind === 'burn' ? Math.min(C.caps.burn, existing.strength + strength) : Math.max(existing.strength, strength);
  } else target.statuses.push({ kind, source: source.id, turns, strength, appliedTurn: b.turn });
  emit(b, p, 'status_apply', 2, { actorId: source.id, targetIds: [target.id], status: kind, amount: turns });
  return true;
}
function interrupt(b: TurnBattle, p: Plan, source: TurnActor, target: TurnActor): void {
  const intent = b.intents[target.id];
  if (!intent || intent.interrupted || !living(target)) return;
  intent.interrupted = true;
  emit(b, p, 'interrupt', 2, { actorId: source.id, targetIds: [target.id], note: `Canceled ${intent.label}.`, intents: b.intents });
  emit(b, p, 'intent', 2, { actorId: target.id, skillId: intent.skillId, targetIds: intent.targetIds, note: 'Interrupted; next slot is lost.', intents: b.intents });
  if (source.role === 'guardian' && passive(b, p, source, 'steadfast', [source.id])) shield(b, p, source, source, C.passive.guardianShield, 'steadfast');
}
function death(b: TurnBattle, p: Plan, source: TurnActor, target: TurnActor): void {
  if (b.deaths.includes(target.id)) return;
  b.deaths.push(target.id); b.queue = b.queue.filter(s => s.actorId !== target.id); delete b.intents[target.id];
  target.shield = 0; target.shieldTurns = 0;
  emit(b, p, 'death', 3, { actorId: source.id, targetIds: [target.id] });
  if (target.role === 'thread') {
    const captive = target.boundAlly ? find(b, target.boundAlly) : undefined;
    if (captive) {
      const bound = captive.statuses.some(s => s.kind === 'restrain' && s.source === target.id);
      if (bound) expireStatus(b, p, captive, 'restrain', 'Binding Thread destroyed; captive released.');
    }
    const boss = b.actors.find(a => a.role === 'yarn' && living(a));
    if (boss) status(b, p, source, boss, 'exposed', C.boss.exposedTurns);
  }
  if (target.side === 'party') {
    for (const thread of b.actors.filter(a => a.role === 'thread' && a.boundAlly === target.id && living(a))) {
      thread.hp = 0; death(b, p, source, thread);
    }
  }
  if (target.role === 'yarn') {
    for (const add of aliveSide(b, 'enemy')) { add.hp = 0; death(b, p, source, add); }
  }
}
function stagger(b: TurnBattle, p: Plan, source: TurnActor, boss: TurnActor, amount: number): void {
  if (!living(boss) || has(boss, 'exposed')) return;
  boss.break = Math.min(C.boss.breakMax, boss.break + amount);
  if (boss.break < C.boss.breakMax) return;
  boss.break = 0; status(b, p, source, boss, 'exposed', C.boss.exposedTurns);
  // Opening is guaranteed; loss of a boss action still respects its recovery window.
  if (status(b, p, source, boss, 'stun', C.control.bossTurns)) interrupt(b, p, source, boss);
  emit(b, p, 'boss_phase', 4, { targetIds: [boss.id], bossPhase: b.bossPhase, note: 'Staggered: the knot is exposed.' });
}
function damage(b: TurnBattle, p: Plan, source: TurnActor, target: TurnActor, raw: number, roll = true, skillId = p.skillId): void {
  if (!living(target) || raw <= 0) return;
  const critical = roll && random(b) < Math.min(C.caps.crit, source.crit);
  const variance = roll ? 1 + (random(b) * 2 - 1) * C.variance : 1;
  const guard = Math.min(C.caps.guard, target.statuses.filter(s => s.kind === 'guard' && s.turns > 0).reduce((n, s) => n + s.strength, 0));
  const enrage = source.role === 'yarn' && b.bossTurns >= C.boss.enrageTurns
    ? C.boss.enrageMultiplier + (b.bossTurns - C.boss.enrageTurns) * C.boss.enrageGrowth : 1;
  const amount = Math.max(C.minDamage, Math.round(raw * variance * (critical ? C.critMultiplier : 1) * enrage *
    (has(target, 'exposed') ? C.boss.exposedMultiplier : 1) * C.defenseScale / (C.defenseScale + Math.max(0, target.defense)) * (1 - guard)));
  const absorbed = Math.min(target.shield, amount), lost = Math.min(target.hp, amount - absorbed);
  target.shield -= absorbed; target.hp -= lost;
  (b.totals[source.id] ??= zero()).damage += lost + absorbed;
  emit(b, p, 'damage', 2, { actorId: source.id, skillId, targetIds: [target.id], amount: lost + absorbed, critical,
    note: absorbed ? `${absorbed} absorbed by shield; ${lost} HP lost.` : `${lost} HP lost.` });
  charge(b, p, target, C.charge.received, 'Charge from damage received.');
  if (source.role === 'witch' && has(target, 'burn') && passive(b, p, source, 'warmWick', [target.id]))
    charge(b, p, source, C.passive.witchCharge, 'Warm Wick.');
  if (!living(target)) death(b, p, source, target);
  const boss = b.actors.find(a => a.role === 'yarn' && living(a));
  if (boss) {
    if (target === boss) stagger(b, p, source, boss, skillId === 'shieldBash' ? C.boss.bashBreak : C.boss.ordinaryBreak);
    else if (source === boss && guard > 0) stagger(b, p, target, boss, C.boss.guardedBreak);
  }
}
function spawnThread(b: TurnBattle, p: Plan, source: TurnActor, target: TurnActor): void {
  if (!living(target) || has(target, 'restrain') || aliveSide(b, 'enemy').length >= C.boss.maxEnemies) return;
  const used = new Set(aliveSide(b, 'enemy').map(a => a.slot));
  const slot = [C.boss.threadSlot, ...C.boss.addSlots].find(s => !used.has(s));
  if (slot === undefined) return;
  const thread = makeActor('thread', slot, `w${b.wave}-thread-${b.turn}`, b);
  thread.boundAlly = target.id; b.actors.push(thread); b.totals[thread.id] = zero();
  insertSlot(b, b.queue, { actorId: thread.id, at: b.clock + interval(thread) });
  status(b, p, thread, target, 'restrain', C.boss.bindTurns);
  emit(b, p, 'spawn', 4, { actorId: source.id, targetIds: [thread.id], note: 'Destroy Binding Thread to release the captive and expose the knot.' });
  commitIntent(b, p, thread);
}
function bossRules(b: TurnBattle, p: Plan, afterBossTurn = false): void {
  const boss = b.actors.find(a => a.role === 'yarn' && living(a));
  if (!boss) return;
  if (b.bossPhase === 1 && boss.hp <= boss.maxHp * C.boss.phaseFraction) {
    b.bossPhase = 2;
    emit(b, p, 'boss_phase', 4, { actorId: boss.id, bossPhase: 2, note: 'Cross Stitch joins the boss cycle.' });
    // Already committed intent remains visible and unchanged; phase applies to the next commitment.
  }
  if (!afterBossTurn) return;
  if (b.bossTurns === C.boss.enrageTurns) emit(b, p, 'boss_phase', 4, { actorId: boss.id, bossPhase: b.bossPhase,
    note: 'Enrage: each following boss turn increases damage.' });
  if (b.bossTurns % C.boss.addsEvery !== 0) return;
  for (let i = 0; i < C.boss.addsPerWave; i++) {
    const enemies = aliveSide(b, 'enemy');
    if (enemies.length >= C.boss.maxEnemies) break;
    const slot = C.boss.addSlots.find(s => !enemies.some(a => a.slot === s));
    if (slot === undefined) break;
    const add = makeActor('flanker', slot, `w${b.wave}-add-${b.turn}-${i}`, b);
    b.actors.push(add); b.totals[add.id] = zero(); insertSlot(b, b.queue, { actorId: add.id, at: b.clock + interval(add) });
    emit(b, p, 'spawn', 4, { actorId: boss.id, targetIds: [add.id], note: 'Loose threads join the fight.' });
    commitIntent(b, p, add);
  }
}
function finish(b: TurnBattle, p: Plan, winner: Side, cause: string): void {
  if (b.result) return;
  const lost = b.deaths.filter(id => HEROES.includes(id as Hero));
  b.result = { winner, turns: b.turn, deaths: lost, firstDeath: (lost[0] as Hero | undefined) ?? null,
    wavesCleared: b.settledWaves.filter(w => w < C.waves.length).length, fishFound: b.fishFound, cause };
  b.phase = 'finished'; b.queue = [];
  emit(b, p, winner === 'party' ? 'victory' : 'defeat', 4, { actors: b.actors, result: b.result, amount: b.fishFound, note: cause });
}
function settle(b: TurnBattle, p: Plan): void {
  if (b.result) return;
  if (!aliveSide(b, 'party').length) { finish(b, p, 'enemy', 'The party fell under enemy pressure.'); return; }
  if (!aliveSide(b, 'enemy').length) {
    if (!b.settledWaves.includes(b.wave)) {
      b.settledWaves.push(b.wave);
      const fish = b.encounter === 'group' || b.encounter === 'dummy' ? 0 : b.wave === C.waves.length ? C.localFish.boss : C.localFish.wave;
      b.fishFound += fish;
      emit(b, p, 'wave_clear', 4, { wave: b.wave, amount: fish, note: 'Local cosmetic settlement; no save or server grant.' });
    }
    const last = b.encounter === 'campaign' ? C.waves.length : C.waves.length - 1;
    if (['campaign', 'patrol'].includes(b.encounter) && b.wave < last) { b.wave++; spawnWave(b, p); }
    else { finish(b, p, 'party', 'The cafe is safe for tonight.'); return; }
  }
  if (b.turn >= C.maxTurns) finish(b, p, 'enemy', 'The turn limit was reached.');
}
/** Open one slot, then wait indefinitely. Forced lost turns resolve without an invented choice. */
export function startTurn(b: TurnBattle): TurnActor | null {
  if (b.result) return null;
  if (b.phase !== 'ready') return b.activeId ? find(b, b.activeId) ?? null : null;
  b.queue = b.queue.filter(s => find(b, s.actorId)?.hp! > 0);
  const slot = b.queue.shift();
  if (!slot) return null;
  const a = find(b, slot.actorId)!;
  b.activeId = a.id; b.clock = Math.max(b.clock, slot.at); b.turn++; b.selected = null; b.phase = 'choose';
  const p = plan(b, a.id);
  emit(b, p, 'turn_start', 0, { targetIds: [a.id], actors: b.actors });
  for (const burn of a.statuses.filter(s => s.kind === 'burn' && s.turns > 0 && s.appliedTurn < b.turn)) {
    const source = find(b, burn.source) ?? a;
    damage(b, p, source, a, C.burnDamage * burn.strength, false, 'burn');
  }
  refreshIntents(b, p);
  if (!living(a) || has(a, 'stun') || has(a, 'restrain') || b.intents[a.id]?.interrupted) {
    b.phase = 'resolved';
    emit(b, p, 'fizzle', 3, { targetIds: [a.id], note: !living(a) ? 'Defeated at turn start.' : has(a, 'restrain') ? 'Restrained; this turn is lost.' : 'Interrupted or stunned; this turn is lost.' });
  }
  closePlan(b, p);
  return a;
}
/** Locks a copied choice exactly once. Failed calls do not change RNG, log, or turn. */
export function chooseAction(b: TurnBattle, choice: TurnChoice): boolean {
  if (b.phase !== 'choose' || b.result || choice.actorId !== b.activeId) return false;
  if (!getLegalActions(b).some(a => a.legal && a.skill.id === choice.skillId)) return false;
  if (!getLegalTargets(b, choice.skillId).some(t => t.legal && t.actorId === choice.targetId)) return false;
  const intent = b.intents[choice.actorId];
  if (intent && (choice.skillId !== intent.skillId || choice.targetId !== intent.targetId)) return false;
  b.selected = { ...choice }; b.history.push({ ...choice }); b.phase = 'chosen';
  return true;
}
export function resolveAction(b: TurnBattle): TurnEvent[] {
  if (b.phase !== 'chosen' || !b.selected || b.result) return [];
  const choice = b.selected, source = find(b, choice.actorId), skill = TURN_SKILLS[choice.skillId];
  b.phase = 'resolved';
  const p = plan(b, choice.actorId, choice.skillId);
  const target = find(b, choice.targetId);
  const targets = source && skill && target ? affected(b, source, skill, target) : [];
  emit(b, p, 'action_start', 0, { targetIds: targets.map(a => a.id) });
  emit(b, p, 'travel', 1, { targetIds: targets.map(a => a.id) });
  if (!source || !living(source) || !skill || !target || !living(target)) {
    emit(b, p, 'fizzle', 2, { note: 'Locked source or target is no longer living.' });
    return closePlan(b, p);
  }
  source.cooldowns[skill.id] = skill.cooldown;
  charge(b, p, source, -skill.chargeCost, 'Ultimate cost.');
  charge(b, p, source, C.charge.action, 'Charge from taking an action.');
  for (const t of targets) {
    if (skill.cleanse) cleanse(b, p, t);
    for (let hit = 0; hit < (skill.hits ?? 1); hit++) if (skill.power > 0) damage(b, p, source, t, source.attack * skill.power);
    if (skill.heal) heal(b, p, source, t, skill.heal);
    if (skill.shield) shield(b, p, source, t, skill.shield);
    const applied = skill.status && status(b, p, source, t, skill.status, skill.duration ?? 1, skill.status === 'guard' ? C.guardFraction : 1);
    if (applied && skill.status === 'stun') interrupt(b, p, source, t);
    if (applied && skill.delay) {
      const slots = t.role === 'yarn' ? C.control.bossDelay : skill.delay;
      if (moveSlot(b, t.id, slots)) emit(b, p, 'delay', 2, { targetIds: [t.id], amount: slots, note: 'Existing slot delayed.' });
    }
    if (skill.id === 'bindThread') spawnThread(b, p, source, t);
  }
  if (skill.id === 'rally') {
    for (const enemy of b.actors.filter(a => living(a) && a.side !== source.side)) status(b, p, source, enemy, 'taunt', skill.duration!);
    refreshIntents(b, p, 2);
  }
  if (skill.id === 'witchBasic' && b.preset === 'lanternbreakers') {
    const next = b.actors.find(a => living(a) && a.side !== source.side && a.row === target.row && a.id !== target.id);
    if (next) damage(b, p, source, next, source.attack * C.gear.pierceMultiplier, true, 'needleLantern');
  }
  bossRules(b, p); refreshIntents(b, p);
  return closePlan(b, p);
}
export function endTurn(b: TurnBattle): void {
  if (b.phase !== 'resolved' || !b.activeId || b.result) return;
  const a = find(b, b.activeId)!;
  const p = plan(b, a.id, b.selected?.skillId ?? '');
  for (const [id, remaining] of Object.entries(a.cooldowns)) {
    if (id !== b.selected?.skillId) a.cooldowns[id] = Math.max(0, remaining - 1);
  }
  for (const s of [...a.statuses]) if (s.appliedTurn < b.turn) {
    s.turns--; if (s.turns <= 0) expireStatus(b, p, a, s.kind, 'Duration completed on the affected actor’s turn.');
  }
  const freshlyShielded = b.events.some(e => e.turn === b.turn && e.type === 'shield' && e.targetIds.includes(a.id) && e.amount > 0);
  if (a.shieldTurns > 0 && !freshlyShielded) {
    a.shieldTurns--;
    if (a.shieldTurns === 0) { const expired = a.shield; a.shield = 0; emit(b, p, 'shield', 2, { targetIds: [a.id], amount: -expired, note: 'Shield expired after two owner turns.' }); }
  }
  if (!a.statuses.some(s => ['stun', 'snare'].includes(s.kind) && s.appliedTurn === b.turn)) a.controlCount = Math.max(0, a.controlCount - 1);
  a.turnsTaken++;
  b.activeId = null; b.phase = 'ready'; b.selected = null;
  if (living(a)) insertSlot(b, b.queue, { actorId: a.id, at: b.clock + interval(a) });
  if (a.role === 'yarn') { b.bossTurns++; bossRules(b, p, true); }
  if (a.side === 'enemy' && living(a)) commitIntent(b, p, a);
  settle(b, p); if (!b.result) refreshIntents(b, p);
  emit(b, p, 'turn_end', 4, { targetIds: [a.id] });
  closePlan(b, p);
}
function moveActor(b: TurnBattle, id: string, slots: number): void {
  if (!Number.isFinite(slots) || slots === 0) return;
  const amount = Math.sign(slots) * Math.min(C.initiative.maxMove, Math.abs(Math.trunc(slots)));
  if (!moveSlot(b, id, amount)) return;
  const p = plan(b, b.activeId ?? id);
  emit(b, p, 'delay', 2, { targetIds: [id], amount, note: amount > 0 ? 'Existing slot delayed.' : 'Existing slot advanced.' });
  refreshIntents(b, p); closePlan(b, p);
}
export function delayActor(b: TurnBattle, id: string, slots: number): void { if (slots > 0) moveActor(b, id, slots); }
export function advanceActor(b: TurnBattle, id: string, slots: number): void { if (slots > 0) moveActor(b, id, -slots); }
/** Replay accepted choices, including enemies. Never invent a policy decision. */
export function replayTurns(options: TurnOptions, choices: readonly TurnChoice[]): TurnBattle {
  let b = createTurnBattle(options);
  for (const [index, choice] of choices.entries()) {
    while (!b.result) {
      startTurn(b);
      if (b.phase !== 'resolved') break;
      endTurn(b);
    }
    if (!chooseAction(b, choice)) throw new Error(`Invalid replay choice ${index}: ${choice.actorId}/${choice.skillId}/${choice.targetId}`);
    resolveAction(b); endTurn(b);
  }
  // A final forced burn/skip can finish a recording without a final decision. Probe without
  // committing the next open choice, so empty histories retain the pristine initial log.
  while (choices.length && !b.result) {
    const candidate = copy(b); startTurn(candidate);
    if (candidate.phase !== 'resolved') break;
    endTurn(candidate); b = candidate;
  }
  return b;
}
