/** Isolated Sample adventure. No GameApi, wallet, V2 state or tradable rewards. */
import { CONFIG } from '../src/config';
import { Rng, deriveSeed } from '../src/rng';

const C = CONFIG.cafe;
export const SLOTS = ['paw', 'scarf', 'charm', 'boots'] as const;
export const SETS = ['ember', 'moss', 'star'] as const;
export const AFFIXES = ['keen', 'cushioned', 'steady', 'lucky'] as const;
export const ENCOUNTERS = ['scout', 'swift', 'armored', 'splitter', 'thief', 'treasure', 'hazard', 'cafe'] as const;
export type Slot = typeof SLOTS[number];
export type SetId = typeof SETS[number];
export type Affix = typeof AFFIXES[number];
export type EncounterKind = typeof ENCOUNTERS[number];
export type Counter = 'dodge' | 'break' | 'interrupt';
export type Route = 'gather' | 'study' | 'risk';
export type Mastery = 'bold' | 'gentle' | 'curious';
export type Kit = Record<Slot, string>;
export interface CafeItem { id: string; slot: Slot; set: SetId; affix: Affix; quality: 'plain' | 'fine' | 'bright'; chapter: number; level: number; misses: number }
export interface CafeEvent { at: number; kind: 'reward' | 'decision' | 'boss' | 'craft' | 'goal' | 'return'; text: string }
export interface Encounter { kind: EncounterKind; ordinal: number; openedAt: number; closesAt: number }
export interface BossFight {
  chapter: number; hp: number; maxHp: number; catHp: number; maxCatHp: number; elapsed: number;
  phase: number; move: number; stage: 'windup' | 'recovery'; remaining: number;
  counter: Counter; chosen: Counter | null; exposure: number; pounceAt: number;
  correct: number; missed: number; damageTaken: number; assisted: boolean;
}
export interface BossResult { chapter: number; won: boolean; grade: 'Perfect' | 'Close call' | 'Clear' | 'Try again'; seconds: number; counters: number; hp: number; hint: string; assisted: boolean }
export interface CafeState {
  version: number; seed: number; rngStep: number; seconds: number; chapter: number; tier: number;
  patches: number; xp: number; mastery: Mastery; tours: number; insight: number;
  encounter: Encounter | null; nextEncounterAt: number; encounters: number; lucky: number;
  inventory: CafeItem[]; equipped: Kit; loadouts: Partial<Record<'A' | 'B', Kit>>;
  discovered: string[]; clears: number[]; losses: number; assist: boolean;
  boss: BossFight | null; lastBoss: BossResult | null; retryAt: number;
  crafts: number; counters: number; perfects: number; claimed: string[]; events: CafeEvent[];
}
export const ROOMS = ['Living Room', 'Kitchen', 'Bathroom', 'Basement', 'Night Rooftops'] as const;
export const BOSSES: readonly { name: string; moves: readonly { name: string; counter: Counter }[] }[] = [
  { name: 'Yarn Giant', moves: [{ name: 'Tangled sweep', counter: 'dodge' }, { name: 'Coil shield', counter: 'break' }, { name: 'Loose-thread storm', counter: 'interrupt' }] },
  { name: 'Cucumber Scare', moves: [{ name: 'Seed volley', counter: 'interrupt' }, { name: 'Rolling pin', counter: 'dodge' }, { name: 'Rind armor', counter: 'break' }] },
  { name: 'Bathtub Tyrant', moves: [{ name: 'Bubble shell', counter: 'break' }, { name: 'Drain whirlpool', counter: 'interrupt' }, { name: 'Tidal splash', counter: 'dodge' }] },
  { name: 'Vacuum Beast', moves: [{ name: 'Hose sweep', counter: 'dodge' }, { name: 'Overloaded motor', counter: 'interrupt' }, { name: 'Dust bag shield', counter: 'break' }] },
  { name: 'Laser Dot Phantom', moves: [{ name: 'Mirror veil', counter: 'break' }, { name: 'Red-line dash', counter: 'dodge' }, { name: 'Prism charge', counter: 'interrupt' }] },
];
export const ENCOUNTER_COPY: Record<EncounterKind, { name: string; clue: string; symbol: string }> = {
  scout: { name: 'Dust Bunny scout', clue: 'Gather supplies or learn a weakness for the next boss.', symbol: '○' },
  swift: { name: 'Swift Sock', clue: 'Chasing is less certain but offers a bigger bundle; gathering is safe.', symbol: '»' },
  armored: { name: 'Armored Roomba', clue: 'Two Ember pieces pry out one extra patch when gathering.', symbol: '▣' },
  splitter: { name: 'Split Yarn', clue: 'Study the knot to guarantee a kit item instead of extra supplies.', symbol: '⋈' },
  thief: { name: 'Button Bandit', clue: 'Chase its loose patch bundle or take the safe path; owned gear is safe.', symbol: '◇' },
  treasure: { name: 'Treasure Mouse', clue: 'A capped lucky find brings an extra kit item and patches.', symbol: '★' },
  hazard: { name: 'Spilled tea', clue: 'Study the slippery floor for double Insight, or brave a risky shortcut.', symbol: '△' },
  cafe: { name: 'A neighbor visits', clue: 'Share a discovery for extra mastery or collect workshop supplies.', symbol: '♥' },
};

const bounded = (n: number, max: number) => Math.max(0, Math.min(max, n));
export function copyCafe(s: CafeState): CafeState {
  return { ...s, inventory: s.inventory.map(i => ({ ...i })), equipped: { ...s.equipped },
    loadouts: Object.fromEntries(Object.entries(s.loadouts).map(([name, kit]) => [name, { ...kit }])),
    discovered: [...s.discovered], clears: [...s.clears], claimed: [...s.claimed],
    boss: s.boss ? { ...s.boss } : null, lastBoss: s.lastBoss ? { ...s.lastBoss } : null,
    encounter: s.encounter ? { ...s.encounter } : null, events: s.events.map(e => ({ ...e })) };
}
function roll(s: CafeState) { return new Rng(deriveSeed(s.seed, s.rngStep++)).next(); }
function emit(s: CafeState, kind: CafeEvent['kind'], text: string) {
  s.events.push({ at: s.seconds, kind, text }); s.events = s.events.slice(-C.maxLog);
}
function discover(s: CafeState, id: string) { if (!s.discovered.includes(id)) s.discovered.push(id); }
function patches(s: CafeState, n: number) { s.patches = bounded(s.patches + n, C.maxPatches); }
export function masteryLevel(s: CafeState) { return Math.min(C.mastery.maxLevel, Math.floor(s.xp / C.mastery.xpPerLevel)); }
export function setCounts(s: CafeState, kit = s.equipped): Record<SetId, number> {
  const counts = { ember: 0, moss: 0, star: 0 };
  for (const slot of SLOTS) { const item = s.inventory.find(i => i.id === kit[slot] && i.slot === slot); if (item) counts[item.set]++; }
  return counts;
}
export function cafeStats(s: CafeState, kit = s.equipped) {
  const sets = setCounts(s, kit), level = masteryLevel(s);
  let damage: number = C.hero.damage, hp: number = C.hero.hp, guard: number = C.hero.guard, luck = 0, patchBonus = 0;
  for (const slot of SLOTS) {
    const item = s.inventory.find(i => i.id === kit[slot] && i.slot === slot); if (!item) continue;
    const q = item.quality === 'bright' ? C.gear.brightMultiplier : item.quality === 'fine' ? C.gear.fineMultiplier : 1;
    damage += (C.gear.baseDamage + (item.chapter - 1) * C.gear.chapterDamage + item.level * C.gear.levelDamage + (item.affix === 'keen' ? C.gear.keenDamage : 0)) * q;
    hp += (C.gear.baseHp + (item.chapter - 1) * C.gear.chapterHp + item.level * C.gear.levelHp + (item.affix === 'cushioned' ? C.gear.cushionedHp : 0)) * q;
    if (item.affix === 'steady') guard += C.gear.steadyGuard;
    if (item.affix === 'lucky') patchBonus += C.gear.luckyPatches;
  }
  if (sets.ember >= C.sets.two) damage *= 1 + C.sets.emberDamage;
  if (sets.moss >= C.sets.two) hp *= 1 + C.sets.mossHp;
  if (sets.moss >= C.sets.four) guard += C.sets.mossGuard;
  if (sets.star >= C.sets.two) patchBonus += C.sets.starPatches;
  if (sets.star >= C.sets.three) luck += C.sets.starLuck;
  damage *= 1 + (s.mastery === 'bold' ? level * C.mastery.damagePerLevel : 0) + Math.min(s.tours, C.tour.maxBonusTours) * C.tour.damagePerTour;
  hp *= 1 + (s.mastery === 'gentle' ? level * C.mastery.hpPerLevel : 0);
  if (s.mastery === 'curious' && level > 0) patchBonus += C.mastery.scoutPatches;
  return { damage: Math.round(damage), hp: Math.round(hp), guard: Math.min(C.hero.guardCap, guard),
    regen: Math.min(C.hero.regenCap, sets.moss >= C.sets.three ? C.sets.mossRegen : 0),
    cooldown: C.hero.pounceCooldown - (sets.ember >= C.sets.three ? C.sets.emberCooldown : 0),
    exposure: C.boss.exposureDamage + (sets.ember >= C.sets.four ? C.sets.emberExposure : 0), luck, patchBonus, sets };
}
export function compareKit(s: CafeState, item: CafeItem) {
  const before = cafeStats(s), after = cafeStats(s, { ...s.equipped, [item.slot]: item.id });
  return { damage: after.damage - before.damage, ehp: Math.round(after.hp / (1 - after.guard) - before.hp / (1 - before.guard)), before, after };
}
/** Legible heuristic: match the requested set first, then its main purpose. */
export function recommendedKit(s: CafeState, set: SetId): Kit {
  const kit = { ...s.equipped };
  for (const slot of SLOTS) {
    const matching = s.inventory.filter(i => i.slot === slot && i.set === set);
    const candidates = matching.length ? matching : s.inventory.filter(i => i.slot === slot);
    const score = (i: CafeItem) => { const stats = cafeStats(s, { ...kit, [slot]: i.id });
      return set === 'ember' ? stats.damage : set === 'moss' ? stats.hp / (1 - stats.guard) : stats.patchBonus; };
    const best = candidates.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))[0]; if (best) kit[slot] = best.id;
  }
  return kit;
}
export function qualityOdds(s: CafeState, bossLoot = false) {
  const stats = cafeStats(s), bonus = (bossLoot ? C.tiers[s.tier]!.quality : 0) + stats.luck;
  const bright = Math.min(1, C.gear.brightChance + bonus);
  const fine = stats.sets.star >= C.sets.four ? 1 - bright : Math.min(1 - bright, C.gear.fineChance - C.gear.brightChance);
  return { bright, fine, plain: Math.max(0, 1 - bright - fine) };
}
function makeItem(s: CafeState, slot?: Slot, set?: SetId, bossLoot = false): CafeItem {
  const qualityRoll = roll(s), odds = qualityOdds(s, bossLoot);
  const quality = qualityRoll < odds.bright ? 'bright' : qualityRoll < odds.bright + odds.fine ? 'fine' : 'plain';
  return { id: `cafe-${s.seed}-${s.rngStep}-${s.seconds}`, slot: slot ?? SLOTS[Math.floor(roll(s) * SLOTS.length)]!,
    set: set ?? SETS[Math.floor(roll(s) * SETS.length)]!, affix: AFFIXES[Math.floor(roll(s) * AFFIXES.length)]!,
    quality: quality === 'plain' && cafeStats(s).sets.star >= C.sets.four ? 'fine' : quality,
    chapter: s.chapter, level: 0, misses: 0 };
}
function findItem(s: CafeState, slot?: Slot, set?: SetId, bossLoot = false) {
  if (s.inventory.length >= C.maxItems) { patches(s, C.gatherPatches); emit(s, 'reward', 'Kit full: the find became workshop patches.'); return; }
  const item = makeItem(s, slot, set, bossLoot); s.inventory.push(item); discover(s, `gear:${item.set}:${item.slot}`);
  emit(s, 'reward', `${item.quality} ${item.set} ${item.slot} · ${item.affix}`);
}
function openEncounter(s: CafeState) {
  // A rotating bag guarantees variety; seed chooses the order, never long droughts.
  const offset = deriveSeed(s.seed, s.chapter) % ENCOUNTERS.length;
  const kind = ENCOUNTERS[(s.encounters + offset) % ENCOUNTERS.length]!;
  s.encounter = { kind, ordinal: s.encounters, openedAt: s.seconds, closesAt: s.seconds + (s.encounters === 0 ? C.firstFindSeconds : C.decisionSeconds) };
  emit(s, 'decision', ENCOUNTER_COPY[kind].name + ': gather, study, or explore?');
}
export function createCafe(seed: number = C.seed): CafeState {
  const inventory = SLOTS.map((slot, n): CafeItem => ({ id: `starter-${slot}`, slot, set: n % C.sets.two === 0 ? 'moss' : 'ember', affix: 'cushioned', quality: 'plain', chapter: 1, level: 0, misses: 0 }));
  const s: CafeState = { version: C.version, seed: seed >>> 0, rngStep: 0, seconds: 0, chapter: 1, tier: 0, patches: C.startingPatches,
    xp: 0, mastery: 'gentle', tours: 0, insight: 0, encounter: null, nextEncounterAt: 0, encounters: 0, lucky: 0,
    inventory, equipped: Object.fromEntries(inventory.map(i => [i.slot, i.id])) as Kit, loadouts: {}, discovered: [], clears: [],
    losses: 0, assist: true, boss: null, lastBoss: null, retryAt: 0, crafts: 0, counters: 0, perfects: 0, claimed: [], events: [] };
  for (const item of inventory) discover(s, `gear:${item.set}:${item.slot}`);
  openEncounter(s); return s;
}
/** One source for the actual route payoffs and their UI previews. */
export function routeOptions(s: CafeState) {
  const kind = s.encounter?.kind, stats = cafeStats(s);
  const risk = kind === 'swift' ? { chance: C.encounters.swiftChance, patches: C.encounters.swiftPatches }
    : kind === 'thief' ? { chance: C.encounters.thiefChance, patches: C.encounters.thiefPatches }
    : kind === 'hazard' ? { chance: C.encounters.hazardChance, patches: C.encounters.hazardPatches }
    : { chance: C.riskChance, patches: C.riskPatches };
  return { gather: C.gatherPatches + stats.patchBonus + (kind === 'armored' && stats.sets.ember >= C.sets.two ? C.encounters.armorBonus : 0),
    study: { patches: C.riskConsolation + stats.patchBonus, insight: Math.min(C.maxInsight - s.insight, kind === 'hazard' ? C.encounters.hazardInsight : 1), item: kind === 'splitter', xp: kind === 'cafe' ? C.encounterXp : 0 },
    risk: { chance: Math.min(1, risk.chance + stats.luck), patches: risk.patches + stats.patchBonus, consolation: C.riskConsolation + stats.patchBonus } };
}
function resolveEncounter(s: CafeState, route: Route) {
  const e = s.encounter; if (!e) return;
  const options = routeOptions(s); let reward: number = options.gather;
  if (route === 'study') { reward = options.study.patches; s.insight += options.study.insight; }
  if (route === 'risk') reward = roll(s) < options.risk.chance ? options.risk.patches : options.risk.consolation;
  if (e.kind === 'cafe' && route === 'study') s.xp += C.encounterXp;
  s.encounters++; s.xp += C.encounterXp; discover(s, `${s.chapter}:${e.kind}`);
  const actual = Math.min(reward, C.maxPatches - s.patches); patches(s, reward);
  emit(s, 'reward', `${ENCOUNTER_COPY[e.kind].name}: +${actual} patches${route === 'study' ? `, +${options.study.insight} Insight` : ''}.`);
  if (s.encounters === 1 || s.encounters % C.itemEvery === 0 || e.kind === 'splitter' && route === 'study') findItem(s);
  if (e.kind === 'treasure' && s.lucky < C.luckyCapPerTour) { s.lucky++; patches(s, C.luckyExtra); findItem(s); }
  s.encounter = null; s.nextEncounterAt = Math.max(s.seconds + 1, e.openedAt + C.encounterSeconds);
}
export function bossReady(s: CafeState) { return !s.boss && s.encounters >= C.bossGate * s.chapter && s.seconds >= s.retryAt; }
function startBoss(s: CafeState) {
  if (!bossReady(s)) return;
  const stats = cafeStats(s), tier = C.tiers[s.tier]!, assisted = s.assist && s.losses >= C.assist.afterLosses;
  const hp = Math.round(C.boss.hp[s.chapter - 1]! * tier.hp * (1 + (roll(s) * 2 - 1) * C.boss.variance) * (assisted ? 1 - C.assist.hpReduction : 1));
  s.boss = { chapter: s.chapter, hp, maxHp: hp, catHp: stats.hp, maxCatHp: stats.hp, elapsed: 0, phase: 1,
    move: 0, stage: 'windup', remaining: C.boss.windupSeconds, counter: BOSSES[s.chapter - 1]!.moves[0]!.counter,
    chosen: null, exposure: 0, pounceAt: 0, correct: 0, missed: 0, damageTaken: 0, assisted };
  s.encounter = null; s.lastBoss = null;
  discover(s, `${s.chapter}:boss`); emit(s, 'decision', `${BOSSES[s.chapter - 1]!.name}: ${s.boss.counter} the first telegraph.`);
}
function finishBoss(s: CafeState, won: boolean) {
  const b = s.boss!;
  const grade = !won ? 'Try again' : b.damageTaken === 0 ? 'Perfect' : b.catHp / b.maxCatHp <= C.boss.closeCallFraction ? 'Close call' : 'Clear';
  s.lastBoss = { chapter: b.chapter, won, grade, seconds: b.elapsed, counters: b.correct, hp: Math.max(0, Math.round(b.catHp)), assisted: b.assisted,
    hint: won ? 'Try another kit or a higher tier when you feel ready.' : b.elapsed >= C.boss.enrageSeconds ? 'Enrage won the long fight. Try Ember pieces, insight, and Pounce during recovery.' : `Watch the named cue: ${BOSSES[b.chapter - 1]!.moves.map(m => `${m.name} → ${m.counter}`).join('; ')}.` };
  if (won) {
    const first = !s.clears.includes(b.chapter); if (first) s.clears.push(b.chapter);
    s.xp += first ? C.bossXp : C.encounterXp; patches(s, first ? C.boss.firstRewardPatches : C.boss.repeatRewardPatches);
    if (first) findItem(s, undefined, undefined, true); s.losses = 0; if (grade === 'Perfect') s.perfects++;
  } else s.losses++;
  s.insight = 0; s.retryAt = s.seconds + C.boss.retrySeconds; s.boss = null;
  s.nextEncounterAt = s.seconds + C.decisionSeconds;
  emit(s, won ? 'reward' : 'boss', `${grade}: ${BOSSES[b.chapter - 1]!.name} · ${b.elapsed}s · ${b.correct} counters.`);
}
function tickBoss(s: CafeState) {
  const b = s.boss!, stats = cafeStats(s); b.elapsed++;
  const exposed = b.exposure > 0; b.exposure = Math.max(0, b.exposure - 1);
  // A shield rewards Break: ordinary attacks still make bounded progress.
  const shield = b.stage === 'windup' && b.counter === 'break' && b.chosen !== 'break';
  b.hp -= stats.damage * (1 + s.insight * C.insightDamage) * (exposed ? 1 + stats.exposure : 1) * (shield ? 1 - C.boss.shieldReduction : 1);
  b.catHp = Math.min(b.maxCatHp, b.catHp + stats.regen);
  b.phase = 1 + C.boss.phaseThresholds.filter(t => b.hp / b.maxHp <= t).length;
  b.remaining--;
  if (b.remaining <= 0 && b.stage === 'windup') {
    const correct = b.chosen === b.counter;
    if (correct) { b.correct++; s.counters++; b.exposure = C.boss.correctExposureSeconds; }
    else {
      b.missed++;
      const damage = C.boss.damage[b.chapter - 1]! * C.tiers[s.tier]!.damage * C.boss.phaseDamage[b.phase - 1]! * (b.elapsed >= C.boss.enrageSeconds ? C.boss.enrageDamage : 1)
        * (b.assisted ? 1 - C.assist.damageReduction : 1) * (b.chosen === null ? 1 - stats.guard : 1);
      b.catHp -= damage; b.damageTaken += damage;
    }
    b.stage = 'recovery'; b.remaining = C.boss.recoverySeconds;
    emit(s, 'boss', correct ? 'Counter landed — exposed! Pounce during recovery.' : 'Mochi braces. Match the next named cue to avoid the hit.');
  } else if (b.remaining <= 0) {
    b.move++; const move = BOSSES[b.chapter - 1]!.moves[b.move % BOSSES[b.chapter - 1]!.moves.length]!;
    b.counter = move.counter; b.chosen = null; b.stage = 'windup';
    b.remaining = b.phase === C.boss.phaseThresholds.length + 1 ? C.boss.finalWindupSeconds : C.boss.windupSeconds;
    emit(s, 'decision', `Phase ${b.phase}: ${move.name} → ${move.counter}.`);
  }
  if (b.catHp <= 0 || b.elapsed >= C.boss.maxSeconds) finishBoss(s, false);
  else if (b.hp <= 0) finishBoss(s, true);
}
export function cafeQuests(s: CafeState) {
  const counts = setCounts(s);
  return [
    { id: 'patrol', name: 'Make the rounds', progress: s.encounters, target: C.quests.patrol },
    { id: 'variety', name: 'Meet the neighbors', progress: new Set(s.discovered.filter(k => !k.endsWith(':boss') && !k.startsWith('gear:')).map(k => k.split(':')[1])).size, target: C.quests.variety },
    { id: 'counters', name: 'Read the room', progress: s.counters, target: C.quests.counters },
    { id: 'crafts', name: 'Made with care', progress: s.crafts, target: C.quests.crafts },
    { id: 'boss', name: 'A brave little cat', progress: s.clears.length, target: C.quests.boss },
    { id: 'set', name: 'A matching moment', progress: Math.max(...Object.values(counts)), target: C.sets.four },
    { id: 'perfect', name: 'Not a whisker out of place', progress: s.perfects, target: C.quests.perfect },
    { id: 'tour', name: 'A familiar new beginning', progress: s.tours, target: C.quests.tour },
  ].map(q => ({ ...q, progress: s.claimed.includes(q.id) ? q.target : Math.min(q.progress, q.target), claimed: s.claimed.includes(q.id) }));
}
function awardGoals(s: CafeState) {
  for (const q of cafeQuests(s)) if (q.progress >= q.target && !q.claimed) {
    s.claimed.push(q.id); s.xp += C.questXp; patches(s, C.questPatches); emit(s, 'goal', `${q.name}: +${C.questXp} mastery, +${C.questPatches} patches.`);
  }
}
export function completion(s: CafeState) {
  const target = ROOMS.length * (ENCOUNTERS.length + 1) + SETS.length * SLOTS.length + cafeQuests(s).length;
  return { found: s.discovered.length + s.claimed.length, target, percent: Math.floor((s.discovered.length + s.claimed.length) / target * 100) };
}
export function advanceCafe(state: CafeState, seconds = 1): CafeState {
  const s = copyCafe(state), steps = Math.floor(bounded(Number.isFinite(seconds) ? seconds : 0, C.maxStepSeconds));
  for (let n = 0; n < steps; n++) {
    s.seconds++;
    if (s.boss) tickBoss(s);
    else {
      if (!s.encounter && s.seconds >= s.nextEncounterAt) openEncounter(s);
      if (s.encounter && s.seconds >= s.encounter.closesAt) resolveEncounter(s, 'gather');
    }
    awardGoals(s);
  }
  return s;
}
export type CafeAction =
  | { type: 'route'; route: Route } | { type: 'fight' } | { type: 'counter'; counter: Counter } | { type: 'pounce' }
  | { type: 'equip'; id: string } | { type: 'build'; set: SetId } | { type: 'craft'; slot: Slot; set: SetId }
  | { type: 'stitch'; id: string; kind: 'steady' | 'spark' } | { type: 'recycle'; id: string }
  | { type: 'saveKit' | 'loadKit'; name: 'A' | 'B' } | { type: 'tier'; tier: number }
  | { type: 'mastery'; mastery: Mastery } | { type: 'assist'; enabled: boolean } | { type: 'nextRoom' } | { type: 'tour' };
export function actCafe(state: CafeState, action: CafeAction): CafeState {
  const s = copyCafe(state);
  if (s.boss) {
    if (action.type === 'counter' && s.boss.stage === 'windup' && s.boss.chosen === null) s.boss.chosen = action.counter;
    if (action.type === 'pounce' && s.boss.elapsed >= s.boss.pounceAt) {
      const stats = cafeStats(s);
      s.boss.hp -= stats.damage * C.hero.pounceMultiplier * (s.boss.exposure > 0 ? 1 + stats.exposure : 1);
      s.boss.pounceAt = s.boss.elapsed + stats.cooldown;
      if (s.boss.hp <= 0) finishBoss(s, true);
    }
    return s;
  }
  switch (action.type) {
    case 'route': resolveEncounter(s, action.route); break;
    case 'fight': startBoss(s); break;
    case 'equip': { const i = s.inventory.find(i => i.id === action.id); if (i) s.equipped[i.slot] = i.id; break; }
    case 'build': if (SETS.includes(action.set)) s.equipped = recommendedKit(s, action.set); break;
    case 'craft':
      if (s.patches >= C.forge.craftCost && s.inventory.length < C.maxItems && SLOTS.includes(action.slot) && SETS.includes(action.set)) {
        patches(s, -C.forge.craftCost); findItem(s, action.slot, action.set); s.crafts++; emit(s, 'craft', `${action.set} ${action.slot} crafted. Chosen set and slot are guaranteed.`);
      } break;
    case 'stitch': {
      const item = s.inventory.find(i => i.id === action.id), cost = action.kind === 'steady' ? C.forge.steadyCost : C.forge.sparkCost;
      if (!item || item.level >= C.gear.maxLevel || s.patches < cost) break;
      patches(s, -cost);
      const success = action.kind === 'steady' || item.misses >= C.forge.pityMisses || roll(s) < C.forge.sparkChance;
      if (success) { item.level = Math.min(C.gear.maxLevel, item.level + (action.kind === 'steady' ? 1 : C.forge.sparkLevels)); item.misses = 0; }
      else item.misses++;
      s.crafts++; emit(s, 'craft', success ? `${item.set} ${item.slot} → stitch ${item.level}.` : `Spark fizzled. Gear kept; ${item.misses}/${C.forge.pityMisses} misses toward a guarantee.`); break;
    }
    case 'recycle':
      if (!Object.values(s.equipped).includes(action.id) && !Object.values(s.loadouts).some(k => k && Object.values(k).includes(action.id)) && s.inventory.some(i => i.id === action.id)) {
        s.inventory = s.inventory.filter(i => i.id !== action.id); patches(s, C.riskConsolation);
      } break;
    case 'saveKit': s.loadouts[action.name] = { ...s.equipped }; break;
    case 'loadKit': if (s.loadouts[action.name]) s.equipped = { ...s.loadouts[action.name]! }; break;
    case 'tier': if (Number.isInteger(action.tier) && C.tiers[action.tier]) s.tier = action.tier; break;
    case 'mastery': if (['bold', 'gentle', 'curious'].includes(action.mastery)) s.mastery = action.mastery; break;
    case 'assist': s.assist = action.enabled; break;
    case 'nextRoom':
      if (s.clears.includes(s.chapter) && s.chapter < ROOMS.length) { s.chapter++; s.lastBoss = null; s.encounter = null; s.nextEncounterAt = s.seconds + 1; s.losses = 0; }
      break;
    case 'tour':
      if (s.clears.length >= C.tour.unlockClears) {
        s.tours++; s.chapter = 1; s.clears = []; s.encounters = 0; s.lucky = 0; s.insight = 0; s.losses = 0;
        s.lastBoss = null; s.encounter = null; s.retryAt = s.seconds; s.nextEncounterAt = s.seconds + 1;
        emit(s, 'goal', 'New tour: rooms restart. Kit, patches, mastery, journal and achievements stay.');
      } break;
  }
  awardGoals(s); return s;
}
/** Catch-up grants only local workshop patches. Never simulates bosses or gear offline. */
export function returnToCafe(state: CafeState, seconds: number) {
  const credited = Math.floor(bounded(Number.isFinite(seconds) ? seconds : 0, C.away.capSeconds));
  const grant = Math.min(C.away.maxPatches, Math.floor(credited / C.away.secondsPerPatch), C.maxPatches - state.patches);
  const s = copyCafe(state); patches(s, grant);
  if (credited >= C.away.minSeconds) emit(s, 'return', `While you were away: ${grant} local patches. Bosses and kit waited for you.`);
  return { state: s, credited, patches: grant };
}
