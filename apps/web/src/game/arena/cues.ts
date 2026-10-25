import { v2 } from '@taskbar-hero/game-rules';
import type { BossFightResultV2, ClassId, TimelineEventV2 } from '../../api/GameApiV2';
import { buildBossCues, type CombatCue } from '../combat';

export type ArenaCue = CombatCue
  | { t: number; type: 'shake'; big: boolean }
  | { t: number; type: 'flash'; target: 'cat' | 'boss' }
  | { t: number; type: 'bossDefeat' }
  | { t: number; type: 'catDefeat' };

export interface ArenaCueOptions {
  chapter: number;
  classId: ClassId;
  catMaxHp: number;
  reducedMotion: boolean;
}

// Compatible with the wire timeline both before and after C12 adds D2 flags.
type FlaggedEvent = TimelineEventV2 & { big?: boolean; dodged?: boolean };

function bossFlags(timeline: readonly FlaggedEvent[]) {
  const damages = timeline
    .filter(e => e.type === 'boss_impact' && (e.damage ?? 0) > 0)
    .map(e => e.damage!)
    .sort((a, b) => a - b);
  const mid = Math.floor(damages.length / 2);
  const median = damages.length === 0 ? 0
    : damages.length % 2 ? damages[mid]! : (damages[mid - 1]! + damages[mid]!) / 2;
  const bigImpacts = timeline.map(e => e.big ?? ((e.damage ?? 0) > 1.5 * median));
  const bigWindups = new Set<number>();
  let windup: number | undefined;
  // Resolve the most recent windup by time, retaining source order for ties.
  const ordered = timeline.map((e, i) => ({ e, i })).sort((a, b) => a.e.t - b.e.t || a.i - b.i);
  for (const { e, i } of ordered) {
    if (e.type === 'boss_windup') windup = i;
    if (e.type === 'boss_impact' && bigImpacts[i] && windup !== undefined) bigWindups.add(windup);
  }
  return { bigImpacts, bigWindups };
}

/** Adapt the server replay to the shared scheduler; no simulation or renderer is involved. */
export function buildArenaCues(result: BossFightResultV2, opts: ArenaCueOptions): ArenaCue[] {
  const { bigImpacts, bigWindups } = bossFlags(result.timeline);
  let attack = 0;
  let catHp = Math.max(0, opts.catMaxHp);
  let bossHp = v2.bossOfChapter(opts.chapter).hp;
  const log: v2.BossEventV2[] = result.timeline.map((e: FlaggedEvent, i) => {
    if (e.catHp !== undefined) catHp = Math.max(0, e.catHp);
    if (e.bossHp !== undefined) bossHp = Math.max(0, e.bossHp);
    switch (e.type) {
      case 'attack_start': return { t: e.t, type: e.type, attack: ++attack };
      case 'impact': return { t: e.t, type: e.type, source: 'hit', damage: e.damage ?? 0, crit: e.crit ?? false, bossHp };
      case 'boss_windup': return { t: e.t, type: e.type, big: e.big ?? bigWindups.has(i) };
      case 'boss_impact': return { t: e.t, type: e.type, big: bigImpacts[i]!, damage: e.damage ?? 0, dodged: e.dodged ?? e.damage === 0, catHp };
      case 'dot': return { t: e.t, type: e.type, source: opts.classId === 'alchemist' ? 'poison' : 'burn', damage: e.damage ?? 0, bossHp };
      case 'end': return { t: e.t, type: e.type, won: result.won };
    }
  });
  const shared = buildBossCues({ log, bossMaxHp: v2.bossOfChapter(opts.chapter).hp, catMaxHp: Math.max(0, opts.catMaxHp) }, v2.weaponProfileOf(opts.classId));
  // The shared scheduler already applies RANK and stable source order. Inserting
  // extras here keeps each one immediately after its cause, even at equal times.
  return shared.flatMap((cue): ArenaCue[] => {
    const cues: ArenaCue[] = [cue];
    if (!opts.reducedMotion) {
      if (cue.type === 'impact' && cue.crit) cues.push({ t: cue.t, type: 'flash', target: 'boss' });
      if (cue.type === 'bossImpact') {
        if (!cue.dodged) cues.push({ t: cue.t, type: 'shake', big: cue.big });
        if (cue.damage > 0) cues.push({ t: cue.t, type: 'flash', target: 'cat' });
      }
    }
    if (cue.type === 'end') cues.push({ t: cue.t, type: result.won ? 'bossDefeat' : 'catDefeat' });
    return cues;
  });
}

/** Authoritative HP for Skip, including fights where one side was never hit. */
export function finalState(result: BossFightResultV2, opts: Pick<ArenaCueOptions, 'chapter' | 'catMaxHp'>): { catHp: number; bossHp: number; won: boolean } {
  let catHp = Math.max(0, opts.catMaxHp);
  let bossHp = v2.bossOfChapter(opts.chapter).hp;
  for (const e of result.timeline) {
    if (e.catHp !== undefined) catHp = Math.max(0, e.catHp);
    if (e.bossHp !== undefined) bossHp = Math.max(0, e.bossHp);
  }
  return { catHp, bossHp, won: result.won };
}
