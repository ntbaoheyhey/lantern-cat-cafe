import { v2 } from '@taskbar-hero/game-rules';
import { basement } from './basement';
import { bathroom } from './bathroom';
import { kitchen } from './kitchen';
import { livingroom } from './livingroom';
import { rooftops } from './rooftops';
import type { BackdropArt } from './types';

export const BACKDROPS: Readonly<Record<string, BackdropArt>> = {
  livingroom,
  kitchen,
  bathroom,
  basement,
  rooftops,
};

export function backdropFor(chapter: number): BackdropArt {
  const bg = v2.CHAPTERS.find((c) => c.index === chapter)?.background;
  return (bg ? BACKDROPS[bg] : undefined) ?? livingroom;
}

export * from './types';
