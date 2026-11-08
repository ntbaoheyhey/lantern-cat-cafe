import { Rng, type Seed } from '../../rng';
import { V2_CONFIG } from '../config';
import { classOf, damage, sane, weaponProfileOf } from './stats';
import type { BossDef, BossEventV2, BossResultV2, CatStats } from './types';

type Job =
  | { kind: 'cat_attack'; n: number }
  | { kind: 'cat_hit'; source: 'hit' | 'arrow'; mult: number }
  | { kind: 'dot'; source: 'burn' | 'poison'; damage: number }
  | { kind: 'boss_windup'; big: boolean; token: number }
  | { kind: 'boss_impact'; big: boolean; token: number };

interface Scheduled {
  t: number;
  seq: number;
  job: Job;
}

/**
 * Boss fight as a timeline in ms. Deterministic: the same stats, class, boss and seed give the same
 * log (the only randomness is crit and dodge rolls, drawn in event order).
 *
 * - The cat attacks every stats.attackIntervalMs; each weapon has hit offsets and an optional
 *   projectile (content/classes.ts), and the damage lands at the impact time.
 * - Class passives play out hit by hit: Rogue's second hit, Hunter's mark (+damageTaken after the
 *   first hit), Archer's volley (every nth attack adds arrows with a smaller hit), Witch's burn and
 *   Alchemist's poison (damage over time per hit), Guardian's bonk (a hit pushes back the boss's
 *   next normal attack unless it is already telegraphed). Cleave and Alchemist's heal on kill
 *   need a second monster or a kill, so they do nothing here.
 * - The boss attacks every attackIntervalMs, and every bigEveryMs it lands a big attack that is
 *   announced (boss_windup big) bigWindupMs ahead.
 * - The fight is lost if the cat dies or maxMs passes.
 */
export function simulateBossV2(rawStats: CatStats, classId: string, rawBoss: BossDef, seed: Seed): BossResultV2 {
  // Broken or absurd numbers (NaN, Infinity) are clamped so the log never holds NaN.
  const stats: CatStats = {
    ...rawStats,
    hp: sane(rawStats.hp),
    atk: sane(rawStats.atk),
    def: sane(rawStats.def),
    hpRegen: sane(rawStats.hpRegen),
    critChance: Math.min(1, sane(rawStats.critChance)),
    critDamage: sane(rawStats.critDamage),
    dodge: Math.min(1, sane(rawStats.dodge)),
    bossDamage: sane(rawStats.bossDamage),
  };
  const boss: BossDef = {
    ...rawBoss,
    hp: sane(rawBoss.hp),
    atk: sane(rawBoss.atk),
    def: sane(rawBoss.def),
    attackIntervalMs: Math.max(V2_CONFIG.caps.minAttackIntervalMs, sane(rawBoss.attackIntervalMs) || V2_CONFIG.boss.attackIntervalMs),
  };
  const cfg = V2_CONFIG.boss;
  const cls = classOf(classId);
  const weapon = weaponProfileOf(classId);
  const rng = new Rng(seed);

  const queue: Scheduled[] = [];
  let seq = 0;
  const push = (t: number, job: Job) => {
    const item = { t, seq: seq++, job };
    let lo = 0;
    let hi = queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const m = queue[mid]!;
      if (m.t < item.t || (m.t === item.t && m.seq < item.seq)) lo = mid + 1;
      else hi = mid;
    }
    queue.splice(lo, 0, item);
  };

  const log: BossEventV2[] = [];
  const bossMaxHp = Math.max(0, boss.hp);
  const catMaxHp = Math.max(0, stats.hp);
  let bossHp = bossMaxHp;
  let catHp = catMaxHp;
  let lastRegenT = 0;
  let marked = false;
  let ended = false;

  const end = (t: number, won: boolean) => {
    ended = true;
    log.push({ t, type: 'end', won });
  };
  const interval = Math.max(V2_CONFIG.caps.minAttackIntervalMs, sane(rawStats.attackIntervalMs) || 1000);

  // Normal boss attack with a cancellable token, so bonk can push it back before its telegraph.
  let normalToken = 0;
  let normalImpactAt = 0;
  const scheduleNormal = (impactAt: number) => {
    normalImpactAt = impactAt;
    const token = ++normalToken;
    push(Math.max(0, impactAt - cfg.windupMs), { kind: 'boss_windup', big: false, token });
    push(impactAt, { kind: 'boss_impact', big: false, token });
  };

  if (catHp <= 0) {
    end(0, false);
    return { won: false, log, bossMaxHp, catMaxHp, durationMs: 0 };
  }
  if (bossHp <= 0) {
    end(0, true);
    return { won: true, log, bossMaxHp, catMaxHp, durationMs: 0 };
  }

  // Cat attacks first, then the boss, so a tie at the same ms favours the cat.
  push(0, { kind: 'cat_attack', n: 1 });
  scheduleNormal(boss.attackIntervalMs);
  for (let n = 1; n * cfg.bigEveryMs < cfg.maxMs; n++) {
    push(n * cfg.bigEveryMs - cfg.bigWindupMs, { kind: 'boss_windup', big: true, token: 0 });
    push(n * cfg.bigEveryMs, { kind: 'boss_impact', big: true, token: 0 });
  }

  const hurtBoss = (t: number, dmg: number) => {
    bossHp = Math.max(0, bossHp - dmg);
    if (bossHp <= 0) end(t, true);
  };

  while (!ended) {
    const ev = queue.shift();
    if (!ev || ev.t >= cfg.maxMs) {
      end(cfg.maxMs, false);
      break;
    }
    const { t, job } = ev;
    switch (job.kind) {
      case 'cat_attack': {
        log.push({ t, type: 'attack_start', attack: job.n });
        const travel = weapon.projectile?.travelMs ?? 0;
        for (const offset of weapon.hitAtMs) push(t + offset + travel, { kind: 'cat_hit', source: 'hit', mult: 1 });
        const p = cls.passive;
        if (p.id === 'volley' && job.n % p.params.every === 0) {
          const first = weapon.hitAtMs[0] ?? 0;
          for (let j = 1; j < p.params.arrows; j++) {
            push(t + first + travel + V2_CONFIG.volleyStaggerMs * j, {
              kind: 'cat_hit',
              source: 'arrow',
              mult: p.params.extraArrowDamage,
            });
          }
        }
        push(t + interval, { kind: 'cat_attack', n: job.n + 1 });
        break;
      }
      case 'cat_hit': {
        const crit = rng.chance(stats.critChance);
        let atk = stats.atk * job.mult * (1 + stats.bossDamage);
        if (crit) atk *= stats.critDamage;
        const p = cls.passive;
        if (marked && p.id === 'markPrey') atk *= 1 + p.params.damageTaken;
        const dmg = damage(atk, boss.def);
        bossHp = Math.max(0, bossHp - dmg);
        log.push({ t, type: 'impact', source: job.source, damage: dmg, crit, bossHp });
        if (bossHp <= 0) {
          end(t, true);
          break;
        }
        if (p.id === 'markPrey') marked = true;
        if (p.id === 'burn' || p.id === 'poison') {
          const fraction = p.id === 'burn' ? p.params.burnFraction : p.params.poisonFraction;
          const ticks = Math.max(1, Math.round(p.params.durationMs / p.params.tickMs));
          const each = Math.round((dmg * fraction) / ticks);
          if (each > 0)
            for (let k = 1; k <= ticks; k++)
              push(t + k * p.params.tickMs, { kind: 'dot', source: p.id === 'burn' ? 'burn' : 'poison', damage: each });
        }
        if (p.id === 'bonk' && job.source === 'hit' && t < normalImpactAt - cfg.windupMs) {
          scheduleNormal(normalImpactAt + p.params.delayMs);
        }
        break;
      }
      case 'dot': {
        const dmg = Math.min(job.damage, bossHp);
        bossHp -= dmg;
        log.push({ t, type: 'dot', source: job.source, damage: dmg, bossHp });
        if (bossHp <= 0) end(t, true);
        break;
      }
      case 'boss_windup': {
        if (job.big || job.token === normalToken) log.push({ t, type: 'boss_windup', big: job.big });
        break;
      }
      case 'boss_impact': {
        if (!job.big && job.token !== normalToken) break;
        catHp = Math.min(catMaxHp, catHp + stats.hpRegen * catMaxHp * ((t - lastRegenT) / 1000));
        lastRegenT = t;
        const dodged = rng.chance(stats.dodge);
        const dmg = dodged ? 0 : damage(boss.atk * (job.big ? cfg.bigMultiplier : 1), stats.def);
        catHp = Math.max(0, catHp - dmg);
        log.push({ t, type: 'boss_impact', big: job.big, damage: dmg, dodged, catHp });
        if (catHp <= 0) end(t, false);
        else if (!job.big) scheduleNormal(t + boss.attackIntervalMs);
        break;
      }
    }
  }

  const last = log[log.length - 1];
  const won = last?.type === 'end' ? last.won : false;
  return { won, log, bossMaxHp, catMaxHp, durationMs: last?.t ?? 0 };
}
