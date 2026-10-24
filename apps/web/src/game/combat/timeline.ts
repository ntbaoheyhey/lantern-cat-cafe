import { v2 } from '@taskbar-hero/game-rules';

/** Timing of one weapon type; the game-rules profile is the source of truth. */
export type WeaponTiming = v2.WeaponProfile;
export type ProjectileKind = 'arrow' | 'bolt' | 'flask';

/** One thing the animation layer must do at game time `t` (ms from the start of the timeline). */
export type CombatCue =
  | { t: number; type: 'spawn'; maxHp: number; catMaxHp?: number }
  | { t: number; type: 'attackStart'; attack: number }
  /** A projectile leaves the weapon; its impact lands `travelMs` later. */
  | { t: number; type: 'release'; kind: ProjectileKind; travelMs: number }
  /** Damage lands: number, flinch and HP bar change happen here and only here. */
  | { t: number; type: 'impact'; source: 'hit' | 'arrow'; damage: number; crit: boolean; hp: number }
  | { t: number; type: 'bossWindup'; big: boolean }
  | { t: number; type: 'bossImpact'; big: boolean; damage: number; dodged: boolean; catHp: number }
  | { t: number; type: 'dot'; source: 'burn' | 'poison'; damage: number; hp: number }
  | { t: number; type: 'defeat' }
  | { t: number; type: 'end'; won: boolean }
  /** Idle loop only: the respawn pause is over, the next monster can start. */
  | { t: number; type: 'cycleEnd' };

export type CueType = CombatCue['type'];

/** Order of cues that share a time: a hit is shown before the defeat it causes. */
const RANK: Record<CueType, number> = {
  spawn: 0,
  attackStart: 1,
  release: 2,
  bossWindup: 3,
  impact: 4,
  bossImpact: 5,
  dot: 6,
  defeat: 7,
  end: 8,
  cycleEnd: 9,
};

function sortCues(cues: CombatCue[]): CombatCue[] {
  return cues
    .map((cue, i) => ({ cue, i }))
    .sort((a, b) => a.cue.t - b.cue.t || RANK[a.cue.type] - RANK[b.cue.type] || a.i - b.i)
    .map((x) => x.cue);
}

/**
 * Cues of a boss fight. Each impact of the log is the moment damage lands; for projectile weapons
 * a release cue is added `travelMs` before it so the arrow, bolt or flask arrives exactly then.
 */
export function buildBossCues(
  result: Pick<v2.BossResultV2, 'log' | 'bossMaxHp' | 'catMaxHp'>,
  weapon: WeaponTiming,
): CombatCue[] {
  const cues: CombatCue[] = [{ t: 0, type: 'spawn', maxHp: result.bossMaxHp, catMaxHp: result.catMaxHp }];
  let defeated = false;
  const defeatIfDead = (t: number, hp: number) => {
    if (defeated || hp > 0) return;
    defeated = true;
    cues.push({ t, type: 'defeat' });
  };
  for (const e of result.log) {
    switch (e.type) {
      case 'attack_start':
        cues.push({ t: e.t, type: 'attackStart', attack: e.attack });
        break;
      case 'impact': {
        const p = weapon.projectile;
        if (p) cues.push({ t: Math.max(0, e.t - p.travelMs), type: 'release', kind: p.kind, travelMs: p.travelMs });
        cues.push({ t: e.t, type: 'impact', source: e.source, damage: e.damage, crit: e.crit, hp: e.bossHp });
        defeatIfDead(e.t, e.bossHp);
        break;
      }
      case 'boss_windup':
        cues.push({ t: e.t, type: 'bossWindup', big: e.big });
        break;
      case 'boss_impact':
        cues.push({ t: e.t, type: 'bossImpact', big: e.big, damage: e.damage, dodged: e.dodged, catHp: e.catHp });
        break;
      case 'dot':
        cues.push({ t: e.t, type: 'dot', source: e.source, damage: e.damage, hp: e.bossHp });
        defeatIfDead(e.t, e.bossHp);
        break;
      case 'end':
        cues.push({ t: e.t, type: 'end', won: e.won });
        break;
    }
  }
  return sortCues(cues);
}

export interface IdleOptions {
  /** Where the first cycle starts. Default 0. */
  startMs?: number;
  /** Monsters to fight in a row. Default 1. */
  cycles?: number;
  /** Pause between a defeat and the next monster. Default 600. */
  respawnMs?: number;
}

/**
 * Client-predicted kill loop for idle fights. monsterFight gives the time to kill; attacks repeat
 * every attack interval and every hit moment (plus projectile travel) before that time is a hit
 * that takes an equal share of the monster's HP, the last one kills it. No crits are predicted.
 */
export function buildIdleCues(
  stats: v2.CatStats,
  monster: v2.MonsterStats,
  options: IdleOptions = {},
): CombatCue[] {
  const { startMs = 0, cycles = 1, respawnMs = 600 } = options;
  const weapon = v2.weaponProfileOf(stats.classId);
  const fight = v2.monsterFight(stats, monster);
  const travel = weapon.projectile?.travelMs ?? 0;
  const interval = Math.max(1, stats.attackIntervalMs);
  const maxHp = Math.max(1, Math.round(monster.hp));
  const cues: CombatCue[] = [];

  let t0 = startMs;
  for (let c = 0; c < cycles; c++) {
    const hits: { attack: number; at: number }[] = [];
    for (let attack = 0; attack * interval <= fight.timeToKillMs; attack++) {
      for (const h of weapon.hitAtMs) {
        const at = attack * interval + h + travel;
        if (at <= fight.timeToKillMs + 1e-6) hits.push({ attack, at });
      }
    }
    if (hits.length === 0) hits.push({ attack: 0, at: fight.timeToKillMs });
    const lastAttack = hits[hits.length - 1]!.attack;

    cues.push({ t: t0, type: 'spawn', maxHp });
    for (let attack = 0; attack <= lastAttack; attack++) {
      cues.push({ t: t0 + attack * interval, type: 'attackStart', attack });
      if (weapon.projectile) {
        for (const h of weapon.hitAtMs) {
          cues.push({
            t: t0 + attack * interval + h,
            type: 'release',
            kind: weapon.projectile.kind,
            travelMs: travel,
          });
        }
      }
    }
    const share = maxHp / hits.length;
    hits.forEach((h, i) => {
      const hp = i === hits.length - 1 ? 0 : Math.round(maxHp - share * (i + 1));
      cues.push({ t: t0 + h.at, type: 'impact', source: 'hit', damage: Math.round(share), crit: false, hp });
    });
    const killAt = t0 + hits[hits.length - 1]!.at;
    cues.push({ t: killAt, type: 'defeat' });
    t0 = killAt + respawnMs;
    cues.push({ t: t0, type: 'cycleEnd' });
  }
  return sortCues(cues);
}

/**
 * Fires each cue exactly once when game time reaches it. Game time only moves through `advance`,
 * so a visual hit-stop (which freezes sprites, not this clock) never shifts later cues.
 */
export class CuePlayer {
  private index = 0;
  private time = 0;

  constructor(
    private readonly cues: readonly CombatCue[],
    private readonly onCue: (cue: CombatCue) => void,
  ) {}

  get now(): number {
    return this.time;
  }

  get done(): boolean {
    return this.index >= this.cues.length;
  }

  /** Move game time forward by `dtMs` and fire every cue that became due, in order. */
  advance(dtMs: number): void {
    this.advanceTo(this.time + Math.max(0, dtMs));
  }

  advanceTo(timeMs: number): void {
    this.time = Math.max(this.time, timeMs);
    while (this.index < this.cues.length && this.cues[this.index]!.t <= this.time) {
      this.onCue(this.cues[this.index++]!);
    }
  }
}
