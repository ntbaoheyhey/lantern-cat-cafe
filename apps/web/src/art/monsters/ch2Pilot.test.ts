import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { CH2_PILOT_ART } from './ch2';
import { monsterPilotArtProblems } from './types';

describe('CH2 Pilot Art (Option A: 24/28/40px)', () => {
  const ch2Monsters = v2.MONSTERS.filter((m) => m.chapter === 2);
  const ch2Ids = ch2Monsters.map((m) => m.id);

  it('contains all 5 Chapter 2 monster ids', () => {
    expect(Object.keys(CH2_PILOT_ART).sort()).toEqual([...ch2Ids].sort());
    expect(Object.keys(CH2_PILOT_ART)).toHaveLength(5);
  });

  it('follows the pilot format with zero problems for every monster', () => {
    for (const [id, art] of Object.entries(CH2_PILOT_ART)) {
      const problems = monsterPilotArtProblems(art);
      expect(problems, `Monster ${id} has pilot art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('adheres to Option A dimensions (24x24 regular, 28x28 elite, 40x40 boss)', () => {
    expect(CH2_PILOT_ART['mon.pickle.imp']?.size).toEqual({ w: 24, h: 24 });
    expect(CH2_PILOT_ART['mon.toast.mimic']?.size).toEqual({ w: 24, h: 24 });
    expect(CH2_PILOT_ART['mon.spoon.bug']?.size).toEqual({ w: 24, h: 24 });
    expect(CH2_PILOT_ART['mon.blender.brute']?.size).toEqual({ w: 28, h: 28 });
    expect(CH2_PILOT_ART['mon.cucumber.scare']?.size).toEqual({ w: 40, h: 40 });
  });

  it('has walk (4-6), attack (3-4), hit (2), and defeat (4-6) frames for all monsters', () => {
    for (const [id, art] of Object.entries(CH2_PILOT_ART)) {
      expect(art.frames.walk?.length, `${id} walk frames`).toBeGreaterThanOrEqual(4);
      expect(art.frames.walk?.length, `${id} walk frames`).toBeLessThanOrEqual(6);
      expect(art.frames.attack?.length, `${id} attack frames`).toBeGreaterThanOrEqual(3);
      expect(art.frames.attack?.length, `${id} attack frames`).toBeLessThanOrEqual(4);
      expect(art.frames.hit?.length, `${id} hit frames`).toBe(2);
      expect(art.frames.defeat?.length, `${id} defeat frames`).toBeGreaterThanOrEqual(4);
    }
  });

  it('ensures all monster frames have feet grounded on the bottom row', () => {
    for (const [id, art] of Object.entries(CH2_PILOT_ART)) {
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
    const silhouettes = Object.entries(CH2_PILOT_ART).map(([id, art]) => {
      const frame0 = art.frames.walk![0]!;
      return frame0.map((row) => row.replace(/[^.]/g, '#')).join('\n');
    });
    expect(new Set(silhouettes).size).toBe(5);
  });
});
