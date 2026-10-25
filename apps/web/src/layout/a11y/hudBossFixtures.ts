import { vi } from 'vitest';
import type { ServerStateV2 } from '../../api/GameApiV2';
import type { BossGatePanelProps } from '../boss/BossGatePanel';
import { bossGatePanelProps, sampleServerStateV2 } from './fixtures';

// ---------------------------------------------------------------------------
// ServerStateV2 fixtures for HUD cases
// ---------------------------------------------------------------------------

/** Normal progressing player with standard currencies and mid-round status */
export const hudNormalState: ServerStateV2 = sampleServerStateV2({
  level: 5,
  chapter: 1,
  round: 3,
  kills: 4,
  killsPerRound: 10,
  gated: false,
  neededPower: 0,
  keys: 1,
});

/** Progression-gated player needing more power to advance */
export const hudGatedState: ServerStateV2 = sampleServerStateV2({
  level: 8,
  chapter: 2,
  round: 5,
  kills: 2,
  killsPerRound: 10,
  gated: true,
  neededPower: 1500,
  keys: 1,
});

/** Player holding maximum key stack (5 keys) */
export const hudMaxKeysState: ServerStateV2 = sampleServerStateV2({
  level: 15,
  chapter: 3,
  round: 8,
  kills: 7,
  killsPerRound: 10,
  gated: false,
  neededPower: 0,
  keys: 5,
});

/** Player with zero fish, yarn, and keys */
export const hudZeroCurrenciesState: ServerStateV2 = {
  ...sampleServerStateV2({
    level: 1,
    chapter: 1,
    round: 1,
    kills: 0,
    killsPerRound: 10,
    gated: false,
    neededPower: 0,
    keys: 0,
  }),
  currencies: {
    fish: 0,
    yarn: 0,
    keys: 0,
  },
};

export function createHudServerState(
  overrides?: Partial<Parameters<typeof sampleServerStateV2>[0]>,
): ServerStateV2 {
  return sampleServerStateV2(overrides);
}

// ---------------------------------------------------------------------------
// BossGatePanel props fixtures per gate state
// ---------------------------------------------------------------------------

const BASE_NOW_S = 1000;

/** State (a): Gated - Current chapter power too low to challenge boss */
export const bossGateGatedProps: BossGatePanelProps = bossGatePanelProps({
  state: sampleServerStateV2({
    chapter: 1,
    round: 5,
    kills: 3,
    killsPerRound: 10,
    gated: true,
    neededPower: 1500,
    keys: 1,
    clearedChapters: [],
    cooldownUntil: null,
  }),
  chapter: 1,
  nowS: BASE_NOW_S,
  busy: false,
  onFight: vi.fn(),
  onSelectChapter: vi.fn(),
});

/** State (b): No Key - Reached boss but holding 0 Cat Keys */
export const bossGateNoKeyProps: BossGatePanelProps = bossGatePanelProps({
  state: sampleServerStateV2({
    chapter: 1,
    round: 10,
    kills: 10,
    killsPerRound: 10,
    gated: false,
    neededPower: 0,
    keys: 0,
    clearedChapters: [],
    cooldownUntil: null,
  }),
  chapter: 1,
  nowS: BASE_NOW_S,
  busy: false,
  onFight: vi.fn(),
  onSelectChapter: vi.fn(),
});

/** State (c): Cooldown - Boss loss catnap active (cooldownUntil = 1060s, nowS = 1000s -> 60s remaining) */
export const bossGateCooldownProps: BossGatePanelProps = bossGatePanelProps({
  state: sampleServerStateV2({
    chapter: 1,
    round: 10,
    kills: 10,
    killsPerRound: 10,
    gated: false,
    neededPower: 0,
    keys: 1,
    clearedChapters: [],
    cooldownUntil: BASE_NOW_S + 60,
  }),
  chapter: 1,
  nowS: BASE_NOW_S,
  busy: false,
  onFight: vi.fn(),
  onSelectChapter: vi.fn(),
});

/** State (d): Not Reached - Early in chapter before reaching round 10 / final kill */
export const bossGateNotReachedProps: BossGatePanelProps = bossGatePanelProps({
  state: sampleServerStateV2({
    chapter: 1,
    round: 2,
    kills: 1,
    killsPerRound: 10,
    gated: false,
    neededPower: 0,
    keys: 1,
    clearedChapters: [],
    cooldownUntil: null,
  }),
  chapter: 1,
  nowS: BASE_NOW_S,
  busy: false,
  onFight: vi.fn(),
  onSelectChapter: vi.fn(),
});

/** State (e): Rematch - Re-challenging a previously cleared chapter boss */
export const bossGateRematchProps: BossGatePanelProps = bossGatePanelProps({
  state: sampleServerStateV2({
    chapter: 2,
    round: 1,
    kills: 0,
    killsPerRound: 10,
    gated: false,
    neededPower: 0,
    keys: 1,
    clearedChapters: [1],
    cooldownUntil: null,
  }),
  chapter: 1,
  nowS: BASE_NOW_S,
  busy: false,
  onFight: vi.fn(),
  onSelectChapter: vi.fn(),
});

/** State (f): Ready (first clear) - Reached boss of uncleared chapter with key held */
export const bossGateReadyProps: BossGatePanelProps = bossGatePanelProps({
  state: sampleServerStateV2({
    chapter: 1,
    round: 10,
    kills: 10,
    killsPerRound: 10,
    gated: false,
    neededPower: 0,
    keys: 1,
    clearedChapters: [],
    cooldownUntil: null,
  }),
  chapter: 1,
  nowS: BASE_NOW_S,
  busy: false,
  onFight: vi.fn(),
  onSelectChapter: vi.fn(),
});

export type BossGateFixtureStateKind =
  | 'gated'
  | 'no_key'
  | 'cooldown'
  | 'not_reached'
  | 'rematch'
  | 'ready';

export function createBossGateProps(
  kind: BossGateFixtureStateKind,
  overrides?: Partial<BossGatePanelProps>,
): BossGatePanelProps {
  switch (kind) {
    case 'gated':
      return { ...bossGateGatedProps, ...overrides };
    case 'no_key':
      return { ...bossGateNoKeyProps, ...overrides };
    case 'cooldown':
      return { ...bossGateCooldownProps, ...overrides };
    case 'not_reached':
      return { ...bossGateNotReachedProps, ...overrides };
    case 'rematch':
      return { ...bossGateRematchProps, ...overrides };
    case 'ready':
      return { ...bossGateReadyProps, ...overrides };
  }
}
