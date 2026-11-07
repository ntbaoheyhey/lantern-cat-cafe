import { defaultLoadout, PRESETS, validLoadout } from './gear';
import * as legacy from './legacy/battle';
import type { Battle as LegacyBattle } from './legacy/types';
import { ENEMIES, HERO_KITS, HERO_NAMES, SKILLS, WAVES } from './content';
import { SQUAD_VERSION, STEP_MS, type Actor, type Battle, type BattleEvent, type BattleOptions, type Command, type EnemyRole, type HeroRole, type Point, type RecordedCommand, type ResolvedOptions, type SkillId, type StatusKind } from './types';

const bossRole = (a: Actor) => a.role === 'yarn' || a.role === 'vacuum';
const equipped = (a: Actor, id: string) => a.gear.includes(id);
const alive = (a: Actor) => a.hp > 0;
const heroes = (s: Battle) => s.actors.filter(a => a.side === 'hero' && alive(a));
const enemies = (s: Battle) => s.actors.filter(a => a.side === 'enemy' && alive(a));
export const hasStatus = (a: Actor, kind: StatusKind) => a.statuses.some(x => x.kind === kind);
export const shieldOf = (a: Actor) => a.statuses.filter(x => x.kind === 'shield').reduce((n, x) => n + x.value, 0);
export const inRadius = (a: Point, b: Point, radius: number) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= radius ** 2;
const injured = (list: Actor[]) => [...list].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id))[0];
const byId = (s: Battle, id: string) => s.actors.find(a => a.id === id);
function emit(s: Battle, event: Omit<BattleEvent, 'id' | 'tick'>) { s.events.push({ id: s.events.length, tick: s.tick, ...event }); }
function random(s: Battle) {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function clone(s: Battle): Battle {
  return { ...s, actors: s.actors.map(a => ({ ...a, statuses: a.statuses.map(x => ({ ...x })), cooldowns: { ...a.cooldowns }, cast: a.cast ? { ...a.cast, targets: [...a.cast.targets], point: { ...a.cast.point } } : null })), events: [...s.events], commands: [...s.commands], settlements: [...s.settlements], patches: s.patches.map(p => ({ ...p })) };
}
function baseActor(id: string, name: string, role: Actor['role'], side: Actor['side'], hp: number, attack: number, defense: number, interval: number, x: number, y: number): Actor {
  return { id, name, role, side, hp, maxHp: hp, attack, defense, interval, x, y, home: { x, y }, target: null, cooldowns: {}, statuses: [], cast: null, requestedUlt: false, break: 0, controlImmuneUntil: 0, gear: [], crit: 0, cdr: 0, charges: 0, damage: 0, healing: 0, shielding: 0, received: 0, deaths: 0 };
}
function spawnEnemy(s: Battle, role: EnemyRole, index: number, linkedTo?: string) {
  if (enemies(s).length >= 8) return;
  const def = ENEMIES[role];
  const a = baseActor(`w${s.wave}-e${s.nextId++}`, def.name, role, 'enemy', def.hp, def.attack, def.defense, def.interval,
    (role === 'yarn' || role === 'vacuum') ? 650 : 470 + Math.floor(index / 2) * 85, (role === 'yarn' || role === 'vacuum') ? 245 : 165 + (index % 2) * 135);
  if (role === 'knot' && linkedTo) { a.linkedTo = linkedTo; a.x = 455; a.y = byId(s, linkedTo)?.y ?? 210; }
  a.home = { x: a.x, y: a.y };
  a.cooldowns.basic = s.tick + 18 + index * 11;
  a.cooldowns.sweep = s.tick + 35; a.cooldowns.thread = s.tick + 115;
  a.cooldowns.suction = s.tick + 35; a.cooldowns.motor = s.tick + 120; a.cooldowns.debris = s.tick + 210;
  if (s.options.scenario === 'dummy') { a.name = 'Training cushion'; a.hp = a.maxHp = 2400; a.attack = 0; a.defense = 0; a.cooldowns.basic = 99999; }
  s.actors.push(a); emit(s, { type: 'spawn', source: a.id, targets: [a.id], role });
}
function beginWave(s: Battle) {
  s.phase = 'fighting'; s.focus = null; s.patches = []; s.heavyReadyAt = s.tick; s.bossAdds = false;
  // Dead enemies leave only after their defeat animation / intermission. The log retains their IDs.
  s.actors = s.actors.filter(a => a.side === 'hero');
  for (const a of s.actors) { a.cast = null; a.target = null; a.x = a.home.x; a.y = a.home.y; a.statuses = a.statuses.filter(x => x.kind !== 'bound'); }
  const roles = s.options.scenario === 'crowd' ? ['guard', 'flanker', 'charger', 'slinger', 'mender', 'flanker', 'slinger', 'guard'] as EnemyRole[] : s.options.scenario === 'vacuum' ? ['vacuum'] : s.options.scenario === 'dummy' ? ['guard'] : [...WAVES[s.wave]!.roles];
  if (s.options.scenario === 'patrol' && s.wave === 1 && s.options.route === 'supplies') roles.splice(0, 1, 'mender');
  if (s.options.scenario === 'patrol' && s.wave === 2 && s.options.route === 'challenge') roles.push('charger');
  if (s.options.scenario === 'patrol' && s.wave === 3 && s.options.route === 'safe') for (const a of heroes(s)) heal(s, a, a, Math.round(a.maxHp * 0.2), 'moss');
  roles.forEach((role, i) => spawnEnemy(s, role as EnemyRole, i));
  emit(s, { type: 'wave', targets: [], text: s.options.scenario === 'crowd' ? 'Eight-enemy training' : s.options.scenario === 'vacuum' ? 'Trouble in the kitchen' : s.options.scenario === 'dummy' ? 'Training cushion' : WAVES[s.wave]!.name });
}
export function createBattle(options: BattleOptions = {}): Battle {
  const preset = options.preset ?? 'hearth';
  if (!Object.hasOwn(PRESETS, preset)) throw new Error('Unknown squad');
  const opts: ResolvedOptions = { seed: options.seed ?? 1105, preset, scenario: options.scenario ?? 'patrol', team: options.team?.map(x => ({ ...x })) ?? PRESETS[preset].map(defaultLoadout), level: options.level ?? 1, route: options.route ?? 'safe' };
  if (!Number.isInteger(opts.seed) || opts.seed < 0 || opts.seed > 2147483647 || !Number.isInteger(opts.level) || opts.level < 1 || opts.level > 10 || !['patrol', 'crowd', 'boss', 'vacuum', 'dummy'].includes(opts.scenario) || !['safe', 'supplies', 'challenge'].includes(opts.route) || opts.team.length !== 3 || !opts.team.every(validLoadout)) throw new Error('Invalid squad options');
  const roles = opts.team.map(x => x.role);
  const s: Battle = { version: SQUAD_VERSION, options: opts, tick: 0, remainder: 0, rng: opts.seed | 0, phase: 'fighting', wave: opts.scenario === 'boss' || opts.scenario === 'vacuum' ? 3 : 0, nextWaveAt: 0, actors: [], events: [], commands: [], settlements: [], focus: null, auto: true, tactic: 'protect', patches: [], heavyReadyAt: 0, bossAdds: false, nextId: 0, diagnosis: '' };
  roles.forEach((role, i) => {
    const a = baseActor(`cat-${i}`, roles.indexOf(role) !== i ? `${HERO_NAMES[role]} II` : HERO_NAMES[role], role, 'hero', role === 'guardian' ? 520 : role === 'witch' ? 340 : 380, role === 'witch' || role === 'rogue' || role === 'archer' ? 25 : 20, role === 'guardian' ? 38 : 12, role === 'guardian' ? 34 : 40, i === 0 ? 315 : 180, i === 0 ? 208 : i === 1 ? 130 : 282);
    const gear = opts.team[i]!; a.gear = [gear.weapon, gear.charm];
    const growth = 1 + (opts.level - 1) * 0.06;
    a.hp = a.maxHp = Math.round(a.maxHp * growth * (equipped(a, 'hearth') ? 1.12 : 1));
    a.attack = Math.round(a.attack * growth); a.crit = equipped(a, 'hunt') ? 0.1 : 0; a.cdr = equipped(a, 'ember') ? 0.1 : 0;
    const kit = HERO_KITS[role];
    a.cooldowns.basic = 8 + i * 5;
    kit.abilities.forEach((skill, j) => { a.cooldowns[skill] = 25 + i * 9 + j * 20; });
    a.cooldowns[kit.ultimate] = 180 + i * 20;
    s.actors.push(a);
  });
  beginWave(s); return s;
}
function status(s: Battle, source: Actor, target: Actor, kind: StatusKind, duration: number, value = 0) {
  if (!alive(target)) return;
  const old = target.statuses.find(x => x.kind === kind);
  if (old) { old.until = s.tick + duration; old.value = Math.max(old.value, value); old.source = source.id; }
  else target.statuses.push({ kind, until: s.tick + duration, source: source.id, value, next: s.tick + 20 });
  emit(s, { type: 'status', source: source.id, targets: [target.id], status: kind, duration });
}
function shield(s: Battle, source: Actor, target: Actor, amount: number, skill?: SkillId) {
  const old = shieldOf(target), next = Math.min(Math.round(target.maxHp * 0.35), old + amount);
  if (next <= old) return;
  source.shielding += next - old;
  status(s, source, target, 'shield', 120, next);
  emit(s, { type: 'shield', source: source.id, targets: [target.id], amount: next - old, skill });
}
function heal(s: Battle, source: Actor, target: Actor, amount: number, skill: SkillId) {
  if (!alive(target)) return;
  const boost = equipped(source, 'hearth') && (equipped(source, 'overflow') || equipped(source, 'counter')) ? 1.15 : 1;
  const n = Math.min(target.maxHp - target.hp, Math.round(amount * boost));
  if (!n) return;
  target.hp += n; source.healing += n;
  emit(s, { type: 'heal', source: source.id, targets: [target.id], amount: n, skill });
  if (equipped(source, 'overflow')) shield(s, source, target, Math.round(n * 0.3), skill);
  if (skill === 'milk') {
    shield(s, source, target, 18, skill);
    emit(s, { type: 'passive', source: source.id, targets: [target.id], text: 'Soft landing' });
  }
}
function unbind(s: Battle, target: Actor) {
  if (hasStatus(target, 'bound')) {
    target.statuses = target.statuses.filter(x => x.kind !== 'bound');
    emit(s, { type: 'expire', targets: [target.id], status: 'bound' });
  }
}
function hurt(s: Battle, source: Actor, target: Actor, raw: number, skill?: SkillId) {
  if (!alive(target)) return;
  // Skill × defense × guard × opening × mark/set × crit; round once, then absorb with shield.
  let n = Math.max(1, Math.round(raw * 100 / (100 + target.defense) * (hasStatus(target, 'guard') ? 0.6 : 1) * (hasStatus(target, 'exposed') ? 1.5 : 1) * (hasStatus(target, 'marked') ? 1.15 + (equipped(source, 'hunt') && (equipped(source, 'ambush') || equipped(source, 'needle')) ? 0.1 : 0) : 1) * (source.crit > 0 && random(s) < Math.min(0.35, source.crit) ? 1.5 : 1)));
  if (hasStatus(target, 'guard') && equipped(target, 'counter') && target.charges < 3) { target.charges = Math.min(3, target.charges + 1); if (target.charges === 3) emit(s, { type: 'passive', source: target.id, targets: [target.id], text: 'Counter ready' }); }
  const protection = target.statuses.find(x => x.kind === 'shield');
  if (protection) { const blocked = Math.min(n, protection.value); n -= blocked; protection.value -= blocked; if (!protection.value) emit(s, { type: 'expire', targets: [target.id], status: 'shield' }); }
  target.statuses = target.statuses.filter(x => x.kind !== 'shield' || x.value > 0);
  n = Math.min(n, target.hp); target.hp -= n; source.damage += n; target.received += n;
  emit(s, { type: 'impact', source: source.id, targets: [target.id], amount: n, skill, point: { x: target.x, y: target.y } });
  if (!alive(target)) {
    const burning = target.statuses.find(x => x.kind === 'burn');
    target.deaths++; target.cast = null;
    emit(s, { type: 'death', source: source.id, targets: [target.id] });
    if (target.linkedTo) { const linked = byId(s, target.linkedTo); if (linked) unbind(s, linked); }
    if (burning) {
      const witch = byId(s, burning.source);
      if (witch && alive(witch)) { witch.cooldowns.lanternstorm = Math.max(s.tick, (witch.cooldowns.lanternstorm ?? s.tick) - 40); emit(s, { type: 'passive', source: witch.id, targets: [witch.id], text: 'Kindling · −2s' }); }
    }
    if (source.role === 'rogue') { source.cooldowns.nightfall = Math.max(s.tick, (source.cooldowns.nightfall ?? s.tick) - 40); emit(s, { type: 'passive', source: source.id, targets: [source.id], text: 'Second chance · −2s' }); }
    target.statuses = [];
    if (s.focus === target.id) s.focus = null;
  }
}
function interrupt(s: Battle, source: Actor, target: Actor, strength: number) {
  if (!alive(target) || s.tick < target.controlImmuneUntil) return;
  if (bossRole(target)) {
    target.break = Math.min(100, target.break + (target.role === 'vacuum' && target.cast?.skill === 'motor' ? 100 : strength));
    if (target.break < 100) return;
    target.break = 0; target.controlImmuneUntil = s.tick + 140;
    status(s, source, target, 'exposed', target.role === 'vacuum' ? 120 : 70);
  } else target.controlImmuneUntil = s.tick + 70;
  const interrupted = target.cast !== null;
  target.cast = null;
  status(s, source, target, 'snare', bossRole(target) ? 20 : 40);
  if (interrupted) {
    emit(s, { type: 'interrupt', source: source.id, targets: [target.id], text: 'Interrupted' });
    if (source.role === 'guardian') { shield(s, source, source, 35); emit(s, { type: 'passive', source: source.id, targets: [source.id], text: 'Steadfast' }); }
  }
}
export function selectTarget(s: Battle, a: Actor): Actor | undefined {
  if (a.side === 'hero') {
    const list = enemies(s);
    const focus = list.find(x => x.id === s.focus);
    if (focus) return focus;
    const knot = list.find(x => x.role === 'knot');
    if (knot) return knot;
    if (s.tactic === 'backline') { const support = list.find(x => x.role === 'mender') ?? list.find(x => x.role === 'slinger'); if (support) return support; }
    return [...list].sort((x, y) => x.x - y.x || x.hp - y.hp || x.id.localeCompare(y.id))[0];
  }
  const list = heroes(s), taunter = list.find(x => hasStatus(x, 'taunt'));
  if (taunter) return taunter;
  if (a.role === 'flanker') return injured(list);
  if (a.role === 'slinger' || a.role === 'charger') return list.filter(x => x.role !== 'guardian')[0] ?? list[0];
  return list.find(x => x.role === 'guardian') ?? list[0];
}
function startCast(s: Battle, a: Actor, skill: SkillId, target: Actor) {
  const def = SKILLS[skill];
  let targets = [target.id];
  const point = { x: target.x, y: target.y };
  if (['hearthwall', 'shelter'].includes(skill)) targets = heroes(s).map(x => x.id);
  if (skill === 'rally') targets = [a.id];
  if (skill === 'lanternstorm' || skill === 'rain') targets = enemies(s).map(x => x.id);
  if (skill === 'motor' || skill === 'debris') targets = heroes(s).map(x => x.id);
  if (skill === 'sweep') targets = heroes(s).filter(x => Math.abs(x.y - target.y) <= SKILLS.sweep.radius).map(x => x.id);
  const travel = skill === 'basic' && (a.role === 'guardian' || a.role === 'rogue' || a.role === 'guard' || a.role === 'flanker') ? 0 : def.travel;
  a.cast = { skill, start: s.tick, release: s.tick + def.windup, impact: s.tick + def.windup + travel, end: s.tick + def.windup + travel + 7, targets, point, released: false };
  a.target = target.id; a.cooldowns[skill] = s.tick + (skill === 'basic' ? Math.max(16, a.interval) : Math.round(def.cooldown * (1 - Math.min(0.3, a.cdr))));
  emit(s, { type: 'cast', source: a.id, targets, skill, point, duration: def.windup + travel });
}
function resolveCast(s: Battle, a: Actor) {
  const c = a.cast!;
  let targets = c.targets.map(id => byId(s, id)).filter((x): x is Actor => !!x && alive(x));
  if (c.skill === 'orb' || c.skill === 'snare') targets = enemies(s).filter(x => inRadius(x, c.point, SKILLS[c.skill].radius + (c.skill === 'orb' && equipped(a, 'cinder') ? 35 : 0)));
  if (c.skill === 'sweep') targets = heroes(s).filter(x => Math.abs(x.y - c.point.y) <= SKILLS.sweep.radius);
  if (c.skill === 'suction') targets = heroes(s).filter(x => Math.abs(x.y - c.point.y) <= SKILLS.suction.radius);
  if (c.skill === 'pierce') targets = enemies(s).filter(x => Math.abs(x.y - c.point.y) <= SKILLS.pierce.radius);
  if (c.skill === 'basic' && equipped(a, 'needle') && targets.length) { const extra = enemies(s).find(x => x.id !== targets[0]!.id && Math.abs(x.y - targets[0]!.y) <= 65); if (extra) targets.push(extra); }
  const charged = c.skill === 'bash' && a.charges >= 3;
  switch (c.skill) {
    case 'mark': targets.forEach(t => status(s, a, t, 'marked', 120)); break;
    case 'feint': status(s, a, a, 'guard', 80); targets.forEach(t => status(s, a, t, 'exposed', 50)); break;
    case 'rally': status(s, a, a, 'taunt', 100); status(s, a, a, 'guard', 100); break;
    case 'hearthwall': targets.forEach(t => { shield(s, a, t, 100, c.skill); status(s, a, t, 'guard', 100); }); break;
    case 'shelter': targets.forEach(t => { unbind(s, t); t.statuses.filter(x => ['burn', 'snare'].includes(x.kind)).forEach(x => emit(s, { type: 'expire', targets: [t.id], status: x.kind })); t.statuses = t.statuses.filter(x => !['burn', 'snare'].includes(x.kind)); shield(s, a, t, 95, c.skill); }); break;
    case 'milk': targets.forEach(t => heal(s, a, t, 100, c.skill)); break;
    case 'mend': targets.forEach(t => heal(s, a, t, 48, c.skill)); break;
    case 'moss': s.patches.push({ ...c.point, source: a.id, until: s.tick + 100, next: s.tick, radius: SKILLS.moss.radius }); break;
    case 'thread': targets.forEach(t => { status(s, a, t, 'bound', 120); spawnEnemy(s, 'knot', 1, t.id); }); break;
    default:
      targets.forEach(t => {
        const factor = c.skill === 'nightfall' ? (t.hp < t.maxHp / 2 ? 6 : 3) : c.skill === 'pounce' ? 2 : c.skill === 'rain' ? 2.4 : c.skill === 'pierce' ? 1.6 : c.skill === 'motor' ? 2.8 : c.skill === 'debris' ? 1.3 : c.skill === 'suction' ? 1.5 : c.skill === 'orb' ? 2 * (equipped(a, 'cinder') && equipped(a, 'ember') ? 1.2 : 1) : c.skill === 'lanternstorm' ? 3.2 : c.skill === 'bash' ? (charged ? 2.4 : 1.5) : c.skill === 'snare' ? 0.5 : c.skill === 'charge' ? 1.6 : c.skill === 'sweep' ? 1.8 : 1;
        hurt(s, a, t, a.attack * factor * (0.95 + random(s) * 0.1), c.skill);
        if (c.skill === 'orb') status(s, a, t, 'burn', equipped(a, 'cinder') ? 120 : 80, 7);
        if (c.skill === 'snare' || c.skill === 'bash') interrupt(s, a, t, c.skill === 'bash' ? (charged ? 80 : 45) : 25);
        if (c.skill === 'pounce') { status(s, a, t, 'marked', 100); if (equipped(a, 'ambush')) interrupt(s, a, t, 35); }
        if (c.skill === 'basic' && a.role === 'archer' && hasStatus(t, 'marked') && alive(t)) { hurt(s, a, t, a.attack * 0.35, c.skill); emit(s, { type: 'passive', source: a.id, targets: [t.id], text: 'Keen eye' }); }
        if (c.skill === 'suction' && alive(t)) { t.x = Math.min(510, t.x + 100); status(s, a, t, 'snare', 24); }
      });
      if (charged) a.charges = 0;
      if (c.skill === 'motor') status(s, a, a, 'exposed', 45);
      if (c.skill === 'sweep') status(s, a, a, 'exposed', 55);
  }
  // A locked projectile never silently transfers its damage to a different target.
  if (!targets.length) emit(s, { type: 'impact', source: a.id, targets: [], skill: c.skill, amount: 0, point: c.point, text: 'Miss' });
}
function decide(s: Battle, a: Actor) {
  if (a.role === 'knot') return;
  const ready = (skill: SkillId) => (a.cooldowns[skill] ?? 0) <= s.tick;
  const target = selectTarget(s, a); if (!target) return;
  if (a.side === 'hero') {
    const kit = HERO_KITS[a.role as HeroRole], team = heroes(s), lowest = injured(team)!;
    const ultUseful = ['witch', 'rogue', 'archer'].includes(a.role) || team.some(x => x.hp < x.maxHp * 0.8 || hasStatus(x, 'bound'));
    if (ready(kit.ultimate) && (a.requestedUlt || (s.auto && ultUseful))) { a.requestedUlt = false; startCast(s, a, kit.ultimate, target); return; }
    for (const skill of kit.abilities) {
      if (!ready(skill)) continue;
      if (skill === 'milk' && lowest.hp > lowest.maxHp - 50) continue;
      if (skill === 'moss' && lowest.hp > lowest.maxHp * 0.9) continue;
      // Guardian intercepts an actual windup; otherwise bash the selected enemy.
      const threat = skill === 'bash' ? enemies(s).find(x => x.cast && ['charge', 'volley', 'sweep', 'thread', 'motor', 'suction', 'debris'].includes(x.cast.skill)) : undefined;
      startCast(s, a, skill, skill === 'milk' || skill === 'moss' ? lowest : threat ?? (skill === 'pounce' && !s.focus ? enemies(s).find(x => x.role === 'mender' || x.role === 'slinger') : undefined) ?? target); return;
    }
  } else {
    if (a.role === 'mender' && ready('mend')) {
      const low = injured(enemies(s))!;
      if (low.hp < low.maxHp - 25) { startCast(s, a, 'mend', low); return; }
    }
    if (s.tick >= s.heavyReadyAt) {
      const skill = a.role === 'vacuum' ? ready('motor') ? 'motor' : ready('debris') ? 'debris' : 'suction' : a.role === 'yarn' ? ready('thread') ? 'thread' : 'sweep' : a.role === 'charger' ? 'charge' : a.role === 'slinger' ? 'volley' : null;
      if (skill && ready(skill)) {
        startCast(s, a, skill, target); s.heavyReadyAt = a.cast!.impact + 10; return;
      }
    }
  }
  if (ready('basic')) startCast(s, a, 'basic', target);
}
export function isMeleeCast(a: Actor) {
  return !!a.cast && ['basic', 'bash', 'charge', 'pounce', 'nightfall'].includes(a.cast.skill) && ['guardian', 'rogue', 'guard', 'flanker', 'charger'].includes(a.role);
}
function moveActors(s: Battle) {
  // Contact motion is part of the authoritative model: AoE tests the same position the renderer shows.
  // Read last-tick positions together so one actor's movement cannot depend on renderer order.
  const positions = new Map(s.actors.map(a => [a.id, { x: a.x, y: a.y }]));
  for (const a of s.actors) {
    if (!alive(a)) continue;
    const c = a.cast;
    if (c && isMeleeCast(a) && !hasStatus(a, 'snare') && !hasStatus(a, 'bound')) {
      const target = positions.get(c.targets[0]!) ?? c.point;
      const t = s.tick <= c.impact ? Math.min(1, (s.tick - c.start) / Math.max(1, c.release - c.start)) : Math.max(0, 1 - (s.tick - c.impact) / (c.end - c.impact));
      a.x = Math.round(a.home.x + (target.x + (a.side === 'hero' ? -45 : 45) - a.home.x) * t);
      a.y = Math.round(a.home.y + (target.y - a.home.y) * t);
    } else if (!hasStatus(a, 'snare') && !hasStatus(a, 'bound')) {
      // Short deterministic return after an interrupt; no teleport back to a formation anchor.
      a.x += Math.sign(a.home.x - a.x) * Math.min(24, Math.abs(a.home.x - a.x));
      a.y += Math.sign(a.home.y - a.y) * Math.min(24, Math.abs(a.home.y - a.y));
    }
  }
}
function tick(s: Battle) {
  s.tick++;
  if (s.phase === 'between') { if (s.tick >= s.nextWaveAt) { s.wave++; beginWave(s); } return; }
  moveActors(s);
  for (const a of s.actors) {
    if (!alive(a)) continue;
    for (const effect of [...a.statuses]) {
      if (effect.until <= s.tick) { a.statuses = a.statuses.filter(x => x !== effect); emit(s, { type: 'expire', targets: [a.id], status: effect.kind }); }
      else if (effect.kind === 'burn' && s.tick >= (effect.next ?? 0)) { effect.next = s.tick + 20; const source = byId(s, effect.source); if (source) hurt(s, source, a, effect.value); }
    }
  }
  for (const p of s.patches) {
    const source = byId(s, p.source);
    if (source && alive(source) && s.tick < p.until && s.tick >= p.next) { p.next = s.tick + 20; heroes(s).filter(a => inRadius(a, p, p.radius)).forEach(a => heal(s, source, a, 14, 'moss')); }
  }
  s.patches = s.patches.filter(p => p.until > s.tick);
  // Stable actor insertion order resolves simultaneous impacts. Death cancels an unfinished cast.
  for (const a of [...s.actors]) {
    if (!alive(a)) continue;
    if (hasStatus(a, 'snare') || hasStatus(a, 'bound')) { a.cast = null; continue; }
    const c = a.cast;
    if (c) {
      if (!c.released && s.tick >= c.release) { c.released = true; emit(s, { type: 'release', source: a.id, targets: c.targets, skill: c.skill, point: c.point, duration: c.impact - c.release }); }
      if (s.tick === c.impact) resolveCast(s, a);
      if (s.tick >= c.end) a.cast = null;
    } else decide(s, a);
  }
  const boss = enemies(s).find(a => a.role === 'yarn');
  if (boss && boss.hp <= boss.maxHp * 0.5 && !s.bossAdds) { s.bossAdds = true; spawnEnemy(s, 'flanker', 0); spawnEnemy(s, 'slinger', 3); emit(s, { type: 'passive', source: boss.id, targets: [], text: 'The basket spills · two adds' }); }
  if (!heroes(s).length || s.tick >= 3600) {
    s.phase = 'lost';
    const backline = s.actors.filter(a => a.side === 'hero' && a.role !== 'guardian').reduce((n, a) => n + a.received, 0);
    const blasts = s.events.filter(e => e.type === 'impact' && e.skill === 'motor').length;
    s.diagnosis = s.options.scenario === 'vacuum' && blasts > 0 ? 'Motor overload hit the squad. Bring Shield Bash or Thread Snare to interrupt its windup and expose the motor; save a team shield for Dust barrage.' : s.tick >= 3600 ? 'The room overwhelmed the squad after 3 minutes. Focus the mender to stop its repairs.' : backline > 500 ? 'The backline took the most pressure. Try Hearthkeepers, use Rally, or focus the slinger before its volley.' : 'The front line ran out of protection. Save Hearthwall for a charge and Shelter for binding threads.';
    emit(s, { type: 'finish', targets: [], text: s.diagnosis }); return;
  }
  if (!enemies(s).length) {
    if (!s.settlements.some(x => x.wave === s.wave)) {
      s.settlements.push({ wave: s.wave, budget: WAVES[s.wave]!.budget, defeated: s.actors.filter(a => a.side === 'enemy').map(a => a.id) });
      emit(s, { type: 'settle', targets: [], amount: WAVES[s.wave]!.budget, text: 'Practice score only' });
    }
    if (s.wave === 3 || s.options.scenario === 'crowd' || s.options.scenario === 'dummy') { s.phase = 'won'; s.diagnosis = 'The hearth is safe. Try another squad or compare a different target priority.'; emit(s, { type: 'finish', targets: [], text: 'Hearth secured' }); }
    else { s.phase = 'between'; s.nextWaveAt = s.tick + 36; }
  }
}
/** Pure fixed-step simulation. Rendering cadence and presentation pauses cannot change outcomes. */
export function advanceBattle(state: Battle, elapsedMs: number): Battle {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new Error('Invalid battle elapsed time');
  if (state.phase === 'won' || state.phase === 'lost') return state;
  if (state.version === 1) return fromLegacy(legacy.advanceBattle(state as unknown as LegacyBattle, elapsedMs));
  const s = clone(state);
  s.remainder += elapsedMs;
  while (s.remainder + 1e-7 >= STEP_MS && s.phase !== 'won' && s.phase !== 'lost') { s.remainder = Math.max(0, s.remainder - STEP_MS); tick(s); }
  if (s.phase === 'won' || s.phase === 'lost') s.remainder = 0;
  return s;
}
export function commandBattle(state: Battle, command: Command): Battle {
  if (state.phase === 'won' || state.phase === 'lost') return state;
  if (state.version === 1) return fromLegacy(legacy.commandBattle(state as unknown as LegacyBattle, command));
  const s = clone(state);
  switch (command.type) {
    case 'focus': if (command.target !== null && !enemies(s).some(x => x.id === command.target)) return state; s.focus = command.target; break;
    case 'free': if (!enemies(s).some(x => x.id === command.target && x.role === 'knot')) return state; s.focus = command.target; break;
    case 'auto': s.auto = command.enabled; break;
    case 'tactic': s.tactic = command.tactic; break;
    case 'ultimate': {
      const a = heroes(s).find(x => x.id === command.actor); if (!a) return state;
      const skill = HERO_KITS[a.role as HeroRole].ultimate;
      if ((a.cooldowns[skill] ?? 0) > s.tick || a.requestedUlt) return state;
      a.requestedUlt = true; break;
    }
  }
  s.commands.push({ tick: s.tick, command }); emit(s, { type: 'command', targets: [], text: command.type }); return s;
}
export interface BattleReplay { version: 1 | typeof SQUAD_VERSION; options: BattleOptions; commands: RecordedCommand[]; ticks: number }
export function exportReplay(s: Battle): BattleReplay { return { version: s.version, options: JSON.parse(JSON.stringify(s.options)), commands: s.commands.map(c => ({ tick: c.tick, command: { ...c.command } })), ticks: s.tick }; }
function fromLegacy(s: LegacyBattle): Battle {
  return { ...s, options: { ...s.options, team: (s.options.preset === 'hearth' ? PRESETS.hearth : PRESETS.cinders).map(defaultLoadout), level: 1, route: 'safe' }, actors: s.actors.map(a => ({ ...a, gear: [], crit: 0, cdr: 0, charges: 0 })) };
}
export function parseReplay(value: unknown): BattleReplay {
  if (!value || typeof value !== 'object') throw new Error('Invalid replay file');
  const r = value as BattleReplay;
  if (![1, SQUAD_VERSION].includes(r.version) || !Number.isInteger(r.ticks) || r.ticks < 0 || r.ticks > 3600 || !Array.isArray(r.commands) || r.commands.length > 10000 || !r.options || typeof r.options !== 'object') throw new Error('Unsupported squad replay');
  createBattle(r.options);
  if (r.version === 1 && (!['hearth', 'cinders', undefined].includes(r.options.preset) || !['patrol', 'crowd', 'boss', undefined].includes(r.options.scenario))) throw new Error('Invalid legacy replay');
  let previous = -1;
  for (const entry of r.commands) {
    if (!entry || !Number.isInteger(entry.tick) || entry.tick < previous || entry.tick > r.ticks || entry.tick < 0 || !entry.command) throw new Error('Invalid replay command order');
    previous = entry.tick; const c = entry.command;
    const valid = c.type === 'auto' ? typeof c.enabled === 'boolean' : c.type === 'tactic' ? ['protect', 'backline'].includes(c.tactic) : c.type === 'ultimate' ? /^cat-[0-2]$/.test(c.actor) : c.type === 'focus' ? c.target === null || typeof c.target === 'string' && c.target.length < 64 : c.type === 'free' && typeof c.target === 'string' && c.target.length < 64;
    if (!valid) throw new Error('Invalid replay command');
  }
  return JSON.parse(JSON.stringify(r));
}
export function replayBattle(value: unknown): Battle {
  const replay = parseReplay(value);
  if (replay.version === 1) return fromLegacy(legacy.replayBattle({ ...replay, version: 1, options: replay.options as LegacyBattle['options'] }));
  let s = createBattle(replay.options), at = 0;
  for (let t = 0; t <= replay.ticks; t++) {
    while (replay.commands[at]?.tick === t) { s = commandBattle(s, replay.commands[at++]!.command); }
    if (t < replay.ticks) s = advanceBattle(s, STEP_MS);
  }
  return s;
}
