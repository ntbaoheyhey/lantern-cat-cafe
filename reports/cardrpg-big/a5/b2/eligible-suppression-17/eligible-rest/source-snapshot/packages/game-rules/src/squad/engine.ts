import { ABILITIES, HEROES, KITS, NAMES, SQUAD_CONFIG as C } from './config';
import { alive, clamp, cooldown, has, inArea, interval, mitigated, random, selectTarget, tickCeil } from './rules';
import type { Ability, Actor, Battle, BattleEvent, Cast, Command, CommandBody, Encounter, Hero, Preset, Role, StatusKind, Totals } from './types';

const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const zero = (): Totals => ({ damage: 0, healing: 0, shielding: 0, kills: 0 });
const hero = (a: Actor): a is Actor & { role: Hero } => a.side === 'party';
export function emit(b: Battle, event: Omit<BattleEvent, 'version' | 'seq' | 'tick' | 'time'>): void {
  b.events.push(copy({ version: 1, seq: b.events.length, tick: b.tick, time: b.time, ...event }));
}
export function makeActor(role: Role, slot: number, id: string, preset: Preset = 'hearthkeepers'): Actor {
  const side = HEROES.includes(role as Hero) ? 'party' : 'enemy';
  const p = C.presets[preset], base = C.stats[role];
  const stats = { ...base, hp: Math.round(base.hp * (side === 'party' ? p.hp : 1)),
    attack: Math.round(base.attack * (side === 'party' ? p.attack : 1)),
    speed: side === 'party' ? p.speed : 0, cdr: side === 'party' ? p.cdr : 0 };
  const point = role === 'yarn' ? C.formation.boss : role === 'healer' ? C.formation.healer : (side === 'party' ? C.formation.party : C.formation.enemy)[slot]!;
  return { ...point, id, role, name: NAMES[role], side, slot, row: side === 'party' ? (slot ? 'rear' : 'front')
    : ['healer', 'ranger'].includes(role) ? 'rear' : 'front', hp: stats.hp, maxHp: stats.hp, shield: 0,
    stats, statuses: [], cooldowns: {}, charge: C.ultimate.initial, auto: true, castId: null,
    nextBasic: side === 'enemy' ? C.initialEnemyMs + slot * C.enemyOffsetMs : C.tickMs,
    controlCount: 0, controlUntil: 0, immuneUntil: 0, passiveAt: 0, break: 0 };
}
export function createBattle(options: { seed?: number; preset?: Preset; encounter?: Encounter; wave?: number } = {}): Battle {
  const seed = (options.seed ?? C.defaultSeed) >>> 0;
  const b: Battle = { version: 1, seed, rng: seed || 1, tick: 0, time: 0, carry: 0,
    encounter: options.encounter ?? 'patrol', preset: options.preset ?? 'hearthkeepers',
    actors: [], casts: [], events: [], commands: [], commandSeq: 0, nextCastId: 1, priority: null,
    tactic: C.presets[options.preset ?? 'hearthkeepers'].tactic, wave: clamp(Math.floor(options.wave ?? 0), 0, C.waves.length - 1),
    transitionAt: null, phase: 1, enraged: false, nextAddAt: C.boss.firstAddMs,
    nextThreadAt: C.boss.firstThreadMs, nextChargeAt: C.burn.tickMs, settled: false,
    fishFound: 0, deaths: [], totals: {}, result: null };
  b.actors = HEROES.map((r, i) => makeActor(r, i, r, b.preset));
  // Author the opening: intercept, snare, orb, then a healing flask.
  b.actors.forEach(a => {
    const kit = KITS[a.role as Hero];
    kit.forEach((id, i) => { a.cooldowns[id] = C.opening[a.role as Hero][i]!; });
    b.totals[a.id] = zero();
  });
  spawnWave(b);
  return b;
}
function spawnWave(b: Battle): void {
  b.actors = b.actors.filter(a => a.side === 'party');
  b.casts = []; b.priority = null; b.transitionAt = null;
  const roles: readonly Role[] = b.encounter === 'boss' ? ['yarn'] : b.encounter === 'dummy' ? ['dummy']
    : b.encounter === 'group' ? C.trainingRoles : C.waves[b.wave]!.roles;
  roles.forEach((r, i) => {
    const a = makeActor(r, i, `w${b.wave}-${r}-${i}`, b.preset);
    a.nextBasic += b.time; b.actors.push(a); b.totals[a.id] = zero();
  });
  b.actors.forEach(a => { a.castId = null; });
  emit(b, { type: 'wave_transition', wave: b.wave, actors: b.actors });
}
export function queueCommand(b: Battle, body: CommandBody, tick = b.tick + 1): Command {
  const command: Command = { ...body, version: 1, tick: Math.max(b.tick + 1, Math.floor(tick)), seq: b.commandSeq++ };
  b.commands.push(command); b.commands.sort((a, z) => a.tick - z.tick || a.seq - z.seq);
  return command;
}
function commands(b: Battle): void {
  for (const c of b.commands.filter(c => c.tick === b.tick)) {
    const a = 'hero' in c ? b.actors.find(a => a.id === c.hero) : undefined;
    if (c.type === 'priority') b.priority = b.actors.some(a => a.id === c.target && a.side === 'enemy' && alive(a)) ? c.target : null;
    if (c.type === 'auto' && a) a.auto = c.enabled;
    if (c.type === 'tactic') b.tactic = c.value;
    if (c.type === 'ultimate' && a && hero(a)) beginCast(b, a, KITS[a.role][2]!);
    emit(b, { type: 'command', source: a?.id, actor: a, target: b.priority ?? undefined, note: c.type });
  }
}
export function shield(b: Battle, source: Actor, target: Actor, amount: number, skill: string): void {
  if (!alive(target)) return;
  const before = target.shield;
  target.shield = Math.min(Math.round(target.maxHp * C.caps.shieldFraction), target.shield + Math.round(amount * (source.side === 'party' ? C.presets[b.preset].shield : 1)));
  const added = target.shield - before;
  b.totals[source.id]!.shielding += added;
  emit(b, { type: 'shield', source: source.id, target: target.id, skill, amount: added, actor: target });
}
export function heal(b: Battle, source: Actor, target: Actor, amount: number, skill: string): void {
  if (!alive(target)) return;
  const injured = target.hp / target.maxHp < C.passive.injuredFraction;
  const added = Math.min(target.maxHp - target.hp, Math.round(amount * (source.side === 'party' ? C.presets[b.preset].healing : 1)));
  target.hp += added; b.totals[source.id]!.healing += added;
  emit(b, { type: 'heal', source: source.id, target: target.id, amount: added, skill, actor: target });
  if (source.role === 'alchemist' && injured && added && b.time >= source.passiveAt) {
    source.passiveAt = b.time + C.passive.cooldownMs;
    emit(b, { type: 'passive', source: source.id, target: target.id, skill: 'lastSip', actor: source });
    shield(b, source, target, C.passive.alchemistShield, 'lastSip');
  }
  if (source.role === 'alchemist' && b.preset === 'hearthkeepers' && skill === 'milkFlask' && added)
    shield(b, source, target, C.gear.afterhealShield, 'lastLight');
}
export function interrupt(b: Battle, a: Actor, source: Actor): boolean {
  const cast = b.casts.find(c => c.id === a.castId && !c.released && !c.canceled);
  if (!cast) return false;
  cast.canceled = true; a.castId = null;
  emit(b, { type: 'interrupt', source: source.id, target: a.id, cast, actor: a });
  if (source.role === 'guardian' && b.time >= source.passiveAt) {
    source.passiveAt = b.time + C.passive.cooldownMs;
    emit(b, { type: 'passive', source: source.id, skill: 'steadfast', actor: source });
    shield(b, source, source, C.passive.guardianShield, 'steadfast');
  }
  return true;
}
export function applyStatus(b: Battle, source: Actor, a: Actor, kind: StatusKind, duration: number, strength = 1): boolean {
  if (!alive(a)) return false;
  if (kind === 'stun' || kind === 'snare') {
    if (b.time < a.immuneUntil) return false;
    const initial = b.time >= a.controlUntil;
    if (initial) a.controlUntil = b.time + C.control.continuousMs;
    duration = tickCeil(Math.max(C.control.minDurationMs, duration * C.control.diminishing ** a.controlCount * (a.role === 'yarn' ? C.control.bossMultiplier : 1)));
    duration = Math.min(duration, a.controlUntil - b.time);
    if (duration <= 0) return false;
    a.controlCount++;
    a.immuneUntil = a.controlUntil + C.control.immuneMs;
    // Existing control may finish; immunity prevents any overlapping chain extension.
    if (kind === 'stun') interrupt(b, a, source);
  }
  const existing = a.statuses.find(s => s.kind === kind);
  if (existing) {
    existing.until = b.time + duration;
    existing.strength = kind === 'burn' ? Math.min(C.caps.burn, existing.strength + strength) : Math.max(existing.strength, strength);
    existing.source = source.id;
  } else a.statuses.push({ kind, source: source.id, until: b.time + duration, strength, nextTick: b.time + C.burn.tickMs });
  emit(b, { type: 'status_applied', source: source.id, target: a.id, note: kind, actor: a });
  return true;
}
export function cleanse(b: Battle, source: Actor, a: Actor): void {
  for (const s of [...a.statuses]) if (!['guard', 'exposed'].includes(s.kind)) {
    a.statuses = a.statuses.filter(x => x !== s);
    emit(b, { type: 'status_expired', source: source.id, target: a.id, note: `cleanse:${s.kind}`, actor: a });
  }
}
function death(b: Battle, source: Actor, a: Actor): void {
  interrupt(b, a, source); a.castId = null;
  b.deaths.push(a.id); b.totals[source.id]!.kills++;
  emit(b, { type: 'death', source: source.id, target: a.id, actor: a });
  if (a.boundAlly) {
    const ally = b.actors.find(x => x.id === a.boundAlly);
    if (ally) cleanse(b, source, ally);
    const boss = b.actors.find(x => x.role === 'yarn' && alive(x));
    if (boss) applyStatus(b, source, boss, 'exposed', C.boss.exposedMs);
  }
}
export function damage(b: Battle, source: Actor, target: Actor, raw: number, skill: string, roll = true): void {
  if (!alive(target)) return;
  const critical = roll && random(b) < clamp(source.stats.crit, 0, C.caps.crit);
  const variance = roll ? 1 + (random(b) * 2 - 1) * C.variance : 1;
  const guard = target.statuses.filter(s => s.kind === 'guard').reduce((n, s) => n + s.strength, 0);
  const amount = raw <= 0 ? 0 : mitigated(raw * variance * (critical ? C.critMultiplier : 1)
    * (b.enraged && source.side === 'enemy' ? C.boss.enrageMultiplier : 1)
    * (has(target, 'exposed') ? C.boss.exposedMultiplier : 1), target.stats.defense, guard);
  const absorbed = Math.min(target.shield, amount); target.shield -= absorbed;
  const lost = Math.min(target.hp, amount - absorbed); target.hp -= lost;
  b.totals[source.id]!.damage += lost + absorbed;
  source.charge = Math.min(C.ultimate.max, source.charge + C.ultimate.perHit);
  emit(b, { type: 'impact', source: source.id, target: target.id, amount, skill, critical, actor: target, note: absorbed ? `${absorbed} blocked` : undefined });
  if (!alive(target)) death(b, source, target);
  if (source.role === 'witch' && has(target, 'burn') && b.time >= source.passiveAt) {
    source.passiveAt = b.time + C.passive.cooldownMs; source.charge = Math.min(C.ultimate.max, source.charge + C.passive.witchCharge);
    emit(b, { type: 'passive', source: source.id, skill: 'warmWick', actor: source });
  }
  const boss = target.role === 'yarn' ? target : b.actors.find(a => a.role === 'yarn' && alive(a));
  if (boss && alive(boss) && !has(boss, 'stun') && !has(boss, 'exposed')) {
    if (target === boss) boss.break += skill === 'shieldBash' ? C.boss.bashBreak : C.boss.ordinaryBreak;
    else if (target.role === 'guardian' && guard) boss.break += C.gear.guardedBreak;
    if (boss.break >= C.boss.breakMax) {
      boss.break = 0; applyStatus(b, source, boss, 'stun', C.boss.breakMs);
      applyStatus(b, source, boss, 'exposed', C.boss.exposedMs);
      emit(b, { type: 'break', source: source.id, target: boss.id, actor: boss });
    }
  }
}
function targetsFor(b: Battle, source: Actor, ability: Ability, target: Actor): Actor[] {
  const friends = ['injured', 'team', 'self'].includes(ability.target);
  const all = b.actors.filter(a => alive(a) && (friends ? a.side === source.side : a.side !== source.side));
  if (ability.target === 'team') return all;
  if (ability.shape === 'cross') return all;
  if (ability.shape === 'sweep') return all.filter(a => Math.abs(a.y - target.y) <= C.boss.laneHalfWidth);
  if (ability.radius) return all.filter(a => inArea(a, target, ability.radius!));
  return [target];
}
export function beginCast(b: Battle, a: Actor, skill: string): boolean {
  const ability = ABILITIES[skill];
  if (!ability || !alive(a) || a.castId !== null || ['stun', 'snare', 'restrain'].some(s => has(a, s))) return false;
  if ((a.cooldowns[skill] ?? 0) > b.time || (ability.ultimate && a.charge < C.ultimate.max)) return false;
  if (ability.heavy && b.casts.filter(c => !c.released && !c.canceled && ABILITIES[c.skill]?.heavy).length >= C.maxHeavyWindups) return false;
  const target = selectTarget(b, a, ability.target);
  if (!target) return false;
  const cast: Cast = { id: b.nextCastId++, source: a.id, skill, targets: targetsFor(b, a, ability, target).map(t => t.id),
    start: b.time, release: b.time + ability.windupMs, impact: b.time + ability.windupMs + ability.travelMs,
    origin: { x: a.x, y: a.y }, zone: { x: target.x, y: target.y }, released: false, canceled: false, hit: 0 };
  if (ability.ultimate) a.charge = 0;
  a.cooldowns[skill] = b.time + cooldown(ability.cooldownMs, a.stats);
  a.castId = cast.id; a.nextBasic = b.time + interval(a.stats);
  b.casts.push(cast); emit(b, { type: 'cast_start', source: a.id, target: target.id, skill, cast, actor: a });
  return true;
}
function resolveCast(b: Battle, cast: Cast): void {
  const source = b.actors.find(a => a.id === cast.source);
  if (!source) return;
  const ability = ABILITIES[cast.skill]!;
  let targets = cast.targets.map(id => b.actors.find(a => a.id === id)).filter((a): a is Actor => !!a && alive(a));
  if (!targets.length && ability.retarget) {
    const next = selectTarget(b, source, ability.target);
    if (next) { targets = [next]; cast.targets = [next.id]; cast.zone = { x: next.x, y: next.y };
      emit(b, { type: 'retarget', source: source.id, target: next.id, skill: cast.skill, cast }); }
  }
  if (!targets.length) emit(b, { type: 'fizzle', source: source.id, skill: cast.skill, cast });
  for (const target of targets) {
    if (ability.cleanse) cleanse(b, source, target);
    if (ability.power) damage(b, source, target, source.stats.attack * ability.power, cast.skill);
    if (ability.heal) heal(b, source, target, ability.heal, cast.skill);
    if (ability.shield) shield(b, source, target, ability.shield, cast.skill);
    if (ability.status) applyStatus(b, source, target, ability.status, ability.durationMs!, ability.status === 'guard' ? C.guardFraction : 1);
    if (cast.skill === 'rally') for (const enemy of b.actors.filter(a => a.side !== source.side && alive(a))) {
      applyStatus(b, source, enemy, 'taunt', ability.durationMs!);
      // Interception redirects unreleased targeted attacks, including the visible charge lane.
      for (const pending of b.casts.filter(c => c.source === enemy.id && !c.released && !c.canceled)) {
        const tell = ABILITIES[pending.skill]!;
        if (['front', 'rear', 'caster'].includes(tell.target) && !tell.radius && !['cross', 'sweep'].includes(tell.shape)) {
          pending.targets = [source.id]; pending.zone = { x: source.x, y: source.y };
          emit(b, { type: 'retarget', source: enemy.id, target: source.id, skill: pending.skill, cast: pending });
        }
      }
    }
    if (cast.skill === 'bindThread' && alive(target)) spawnThread(b, source, target);
  }
  if (cast.skill === 'witchBasic' && b.preset === 'lanternbreakers' && targets[0]) {
    const t = targets[0], next = b.actors.find(a => a.side !== source.side && a.id !== t.id && alive(a) && inArea(a, t, C.gear.pierceRadius));
    if (next) damage(b, source, next, source.stats.attack * C.gear.pierceMultiplier, 'needleLantern');
  }
}
function spawnThread(b: Battle, boss: Actor, target: Actor): void {
  const enemies = b.actors.filter(a => a.side === 'enemy' && alive(a));
  if (enemies.length >= C.maxEnemies || has(target, 'restrain')) return;
  const slot = [C.threadSlot, ...C.formation.enemy.map((_, i) => i)].find(i => !enemies.some(a => a.slot === i));
  if (slot === undefined) return;
  const thread = makeActor('thread', slot, `thread-${b.nextCastId++}`, b.preset);
  Object.assign(thread, C.formation.bossAdds[slot]);
  thread.boundAlly = target.id; thread.nextBasic += b.time; b.actors.push(thread); b.totals[thread.id] = zero();
  applyStatus(b, boss, target, 'restrain', C.boss.threadDurationMs);
  applyStatus(b, target, boss, 'exposed', C.boss.exposedMs);
  emit(b, { type: 'spawn', source: boss.id, actor: thread, note: 'Destroy the binding thread to free your ally.' });
}
function bossRules(b: Battle): void {
  const boss = b.actors.find(a => a.role === 'yarn' && alive(a));
  if (!boss) return;
  if (b.phase === 1 && boss.hp <= boss.maxHp * C.boss.phaseFraction) {
    b.phase = 2; emit(b, { type: 'boss_phase', source: boss.id, phase: 2, actor: boss, note: 'Cross Stitch: two lanes, both rows.' });
  }
  if (!b.enraged && b.time >= C.boss.enrageMs) {
    b.enraged = true; emit(b, { type: 'enrage', source: boss.id, actor: boss });
  }
  if (b.time >= b.nextAddAt) {
    const count = b.actors.filter(a => a.side === 'enemy' && alive(a)).length;
    for (let i = 0; i < Math.min(C.boss.addsPerPhase, C.maxEnemies - count); i++) {
      const slot = [...C.addSlots, ...C.formation.enemy.map((_, j) => j)].find(j => !b.actors.some(a => a.side === 'enemy' && alive(a) && a.slot === j));
      if (slot === undefined) break;
      const a = makeActor('flanker', slot, `add-${b.nextCastId++}`, b.preset);
      Object.assign(a, C.formation.bossAdds[slot]);
      a.nextBasic += b.time; b.actors.push(a); b.totals[a.id] = zero();
      emit(b, { type: 'spawn', source: boss.id, actor: a, note: 'Loose threads join the fight.' });
    }
    b.nextAddAt += C.boss.addEveryMs;
  }
}
function autoCast(b: Battle, a: Actor): void {
  if (hero(a)) {
    const kit = KITS[a.role];
    const boss = b.actors.find(a => a.role === 'yarn' && alive(a));
    const opening = !boss || has(boss, 'exposed');
    if (a.auto && (b.tactic !== 'opening' || opening || a.role !== 'witch') && beginCast(b, a, kit[2]!)) return;
    for (const skill of kit.slice(0, 2)) {
      if (skill === 'milkFlask') {
        const injured = selectTarget(b, a, 'injured');
        if (!injured || injured.hp / injured.maxHp > C.healThreshold) continue;
      }
      if (beginCast(b, a, skill)) return;
    }
    if (b.time >= a.nextBasic) beginCast(b, a, `${a.role}Basic`);
  } else if (b.time >= a.nextBasic) {
    if (a.role === 'yarn' && b.time >= b.nextThreadAt && beginCast(b, a, 'bindThread')) {
      b.nextThreadAt += C.boss.threadEveryMs; return;
    }
    beginCast(b, a, a.role === 'yarn' && b.phase === 2 ? 'crossSweep' : `${a.role}Attack`);
  }
}
function finish(b: Battle, winner: 'party' | 'enemy'): void {
  if (b.result) return;
  if (winner === 'party' && !b.settled) {
    b.settled = true; b.fishFound = b.encounter === 'patrol' ? C.waveFish : b.encounter === 'boss' ? C.bossFish : 0;
    emit(b, { type: 'reward', amount: b.fishFound, note: 'Cosmetic fish found; no save or server grant.' });
  }
  const heroesLost = b.deaths.filter(id => HEROES.includes(id as Hero));
  const rearFirst = heroesLost[0] === 'witch' || heroesLost[0] === 'alchemist';
  b.result = { winner, durationMs: b.time, deaths: heroesLost, firstDeath: heroesLost[0] ?? null,
    fishFound: b.fishFound, totals: copy(b.totals),
    cause: winner === 'party' ? 'The cafe is safe for tonight.' : b.enraged || b.time >= C.maxDurationMs ? 'Not enough damage before enrage.'
      : rearFirst ? 'Rear cats fell under ranged and flanking pressure.' : 'Front-line healing was exhausted.',
    suggestion: winner === 'party' ? 'Try the other squad or mark a different opening.' : b.enraged ? 'Try Lanternbreakers and spend Lanternstorm on the exposed knot.'
      : rearFirst ? 'Use Protect allies and mark the Needle Moth first.' : 'Use Hearthkeepers; hold Nine-Lives Shelter for the heavy windup.' };
  emit(b, { type: 'fight_end', result: b.result, actors: b.actors });
}
export function step(b: Battle): void {
  if (b.result) return;
  b.tick++; b.time = b.tick * C.tickMs;
  commands(b);
  if (b.transitionAt !== null) { if (b.time >= b.transitionAt) { b.wave++; spawnWave(b); } else return; }
  for (const a of b.actors.filter(alive)) for (const s of [...a.statuses]) {
    if (b.time >= s.until) { a.statuses = a.statuses.filter(x => x !== s); emit(b, { type: 'status_expired', target: a.id, note: s.kind, actor: a }); }
    else if (s.kind === 'burn' && b.time >= s.nextTick) {
      s.nextTick += C.burn.tickMs; const src = b.actors.find(x => x.id === s.source);
      if (src) damage(b, src, a, C.burn.damage * s.strength, 'burn', false);
    }
  }
  // Cast insertion order is the deterministic tie-breaker. Released shots survive the caster.
  for (const cast of b.casts) {
    if (cast.canceled) continue;
    if (!cast.released && b.time >= cast.release) {
      cast.released = true; emit(b, { type: 'projectile_release', source: cast.source, skill: cast.skill, cast });
    }
    if (cast.released && b.time >= cast.impact) {
      resolveCast(b, cast); cast.hit++;
      if (cast.hit < (ABILITIES[cast.skill]!.hits ?? 1)) cast.impact += C.stormSpacingMs;
      else { cast.canceled = true; const source = b.actors.find(a => a.id === cast.source); if (source?.castId === cast.id) source.castId = null; }
    }
  }
  b.casts = b.casts.filter(c => !c.canceled);
  const party = b.actors.filter(a => a.side === 'party' && alive(a));
  if (!party.length || b.time >= C.maxDurationMs) { finish(b, 'enemy'); return; }
  const enemies = b.actors.filter(a => a.side === 'enemy' && alive(a));
  if (!enemies.length || (b.encounter === 'boss' && !enemies.some(a => a.role === 'yarn'))) {
    if (b.encounter === 'patrol' && b.wave < C.waves.length - 1) { b.transitionAt = b.time + C.wavePauseMs; b.casts = []; }
    else finish(b, 'party');
    return;
  }
  bossRules(b);
  if (b.time >= b.nextChargeAt) {
    b.nextChargeAt += C.burn.tickMs;
    for (const a of party) { a.charge = Math.min(C.ultimate.max, a.charge + C.ultimate.perSecond); emit(b, { type: 'charge', actor: a }); }
  }
  for (const a of b.actors.filter(alive)) autoCast(b, a);
}
/** Keep fractional wall-time, never truncate a hitch. Visibility pauses call this with no delta. */
export function advance(b: Battle, deltaMs: number): BattleEvent[] {
  const start = b.events.length;
  if (!Number.isFinite(deltaMs) || deltaMs < 0 || b.result) return [];
  b.carry += deltaMs;
  while (b.carry + Number.EPSILON * C.clockTolerance >= C.tickMs && !b.result) {
    b.carry -= C.tickMs; step(b);
  }
  return b.events.slice(start);
}
export function run(b: Battle): Battle { while (!b.result) step(b); return b; }
