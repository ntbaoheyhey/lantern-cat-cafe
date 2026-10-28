import type { MonsterArt } from './types';
import { CH1_ART, CH1_PILOT_ART } from './ch1';
import { CH2_ART, CH2_PILOT_ART } from './ch2';
import { CH3_ART, CH3_PILOT_ART } from './ch3';
import { CH4_ART, CH4_PILOT_ART } from './ch4';
import { CH5_ART, CH5_PILOT_ART } from './ch5';

export const MONSTER_ART: Readonly<Record<string, MonsterArt>> = {
  ...CH1_ART,
  ...CH2_ART,
  ...CH3_ART,
  ...CH4_ART,
  ...CH5_ART,
};

export const MONSTER_PILOT_ART: Readonly<Record<string, MonsterArt>> = {
  ...CH1_PILOT_ART,
  ...CH2_PILOT_ART,
  ...CH3_PILOT_ART,
  ...CH4_PILOT_ART,
  ...CH5_PILOT_ART,
};

export function monsterArt(id: string): MonsterArt | null {
  return MONSTER_ART[id] ?? null;
}

export function monsterPilotArt(id: string): MonsterArt | null {
  return MONSTER_PILOT_ART[id] ?? null;
}

export * from './types';
