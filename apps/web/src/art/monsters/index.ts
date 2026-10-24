import type { MonsterArt } from './types';
import { CH1_ART } from './ch1';
import { CH2_ART } from './ch2';
import { CH3_ART } from './ch3';
import { CH4_ART } from './ch4';
import { CH5_ART } from './ch5';

export const MONSTER_ART: Readonly<Record<string, MonsterArt>> = {
  ...CH1_ART,
  ...CH2_ART,
  ...CH3_ART,
  ...CH4_ART,
  ...CH5_ART,
};

export function monsterArt(id: string): MonsterArt | null {
  return MONSTER_ART[id] ?? null;
}

export * from './types';
