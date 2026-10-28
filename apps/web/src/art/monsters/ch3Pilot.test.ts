import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { CH3_PILOT_ART } from './ch3';
import { monsterPilotArtProblems } from './types';

describe('CH3 Pilot Art (Option A: 24/28/40px)', () => {
  const ch3Monsters = v2.MONSTERS.filter((m) => m.chapter === 3);
  const ch3Ids = ch3Monsters.map((m) => m.id);

  it('contains all 5 Chapter 3 monster ids', () => {
    expect(Object.keys(CH3_PILOT_ART).sort()).toEqual([...ch3Ids].sort());
    expect(Object.keys(CH3_PILOT_ART)).toHaveLength(5);
  });

  it('follows the pilot format with zero problems for every monster', () => {
    for (const [id, art] of Object.entries(CH3_PILOT_ART)) {
      const problems = monsterPilotArtProblems(art);
      expect(problems, `Monster ${id} has pilot art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('adheres to Option A dimensions (24x24 regular, 28x28 elite, 40x40 boss)', () => {
    expect(CH3_PILOT_ART['mon.soap.slime']?.size).toEqual({ w: 24, h: 24 });
    expect(CH3_PILOT_ART['mon.rubber.duck']?.size).toEqual({ w: 24, h: 24 });
    expect(CH3_PILOT_ART['mon.sponge.crab']?.size).toEqual({ w: 24, h: 24 });
    expect(CH3_PILOT_ART['mon.hair.dryer.wisp']?.size).toEqual({ w: 28, h: 28 });
    expect(CH3_PILOT_ART['mon.bathtub.tyrant']?.size).toEqual({ w: 40, h: 40 });
  });

  it('has walk (4-6), attack (3-4), hit (2), and defeat (4-6) frames for all monsters', () => {
    for (const [id, art] of Object.entries(CH3_PILOT_ART)) {
      expect(art.frames.walk?.length, `${id} walk frames`).toBeGreaterThanOrEqual(4);
      expect(art.frames.walk?.length, `${id} walk frames`).toBeLessThanOrEqual(6);
      expect(art.frames.attack?.length, `${id} attack frames`).toBeGreaterThanOrEqual(3);
      expect(art.frames.attack?.length, `${id} attack frames`).toBeLessThanOrEqual(4);
      expect(art.frames.hit?.length, `${id} hit frames`).toBe(2);
      expect(art.frames.defeat?.length, `${id} defeat frames`).toBeGreaterThanOrEqual(4);
    }
  });

  it('ensures all monster frames have feet grounded on the bottom row', () => {
    for (const [id, art] of Object.entries(CH3_PILOT_ART)) {
      for (const [anim, frames] of Object.entries(art.frames)) {
        frames?.forEach((rows, i) => {
          const bottomRow = rows[art.size.h - 1]!;
          const hasFootPixel = bottomRow.split('').some((ch) => ch !== '.');
          expect(hasFootPixel, `${id} ${anim}[${i}] bottom row must contain non-transparent feet pixels`).toBe(true);
        });
      }
    }
  });

  it('ensures all walk frame 0s are distinct silhouettes', () => {
    const silhouettes = Object.entries(CH3_PILOT_ART).map(([id, art]) => {
      const frame0 = art.frames.walk![0]!;
      return frame0.map((row) => row.replace(/[^.]/g, '#')).join('\n');
    });
    expect(new Set(silhouettes).size).toBe(5);
  });
});
