import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { CH1_PILOT_ART, WARRIOR_CAT_PILOT } from './ch1';
import { catPilotArtProblems, monsterPilotArtProblems } from './types';

describe('CH1 Pilot Art (Option A: 24/28/40px)', () => {
  const ch1Monsters = v2.MONSTERS.filter((m) => m.chapter === 1);
  const ch1Ids = ch1Monsters.map((m) => m.id);

  it('contains all 5 Chapter 1 monster ids', () => {
    expect(Object.keys(CH1_PILOT_ART).sort()).toEqual([...ch1Ids].sort());
    expect(Object.keys(CH1_PILOT_ART)).toHaveLength(5);
  });

  it('follows the pilot format with zero problems for every monster', () => {
    for (const [id, art] of Object.entries(CH1_PILOT_ART)) {
      const problems = monsterPilotArtProblems(art);
      expect(problems, `Monster ${id} has pilot art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('adheres to Option A dimensions (24x24 regular, 28x28 elite, 40x40 boss)', () => {
    expect(CH1_PILOT_ART['mon.dust.bunny']?.size).toEqual({ w: 24, h: 24 });
    expect(CH1_PILOT_ART['mon.loose.yarn']?.size).toEqual({ w: 24, h: 24 });
    expect(CH1_PILOT_ART['mon.sock.puppet']?.size).toEqual({ w: 24, h: 24 });
    expect(CH1_PILOT_ART['mon.roomba.scout']?.size).toEqual({ w: 28, h: 28 });
    expect(CH1_PILOT_ART['mon.yarn.giant']?.size).toEqual({ w: 40, h: 40 });
  });

  it('has walk (4-6), attack (3-4), hit (2), and defeat (4) frames for all monsters', () => {
    for (const [id, art] of Object.entries(CH1_PILOT_ART)) {
      expect(art.frames.walk?.length, `${id} walk frames`).toBeGreaterThanOrEqual(4);
      expect(art.frames.walk?.length, `${id} walk frames`).toBeLessThanOrEqual(6);
      expect(art.frames.attack?.length, `${id} attack frames`).toBeGreaterThanOrEqual(3);
      expect(art.frames.attack?.length, `${id} attack frames`).toBeLessThanOrEqual(4);
      expect(art.frames.hit?.length, `${id} hit frames`).toBe(2);
      expect(art.frames.defeat?.length, `${id} defeat frames`).toBeGreaterThanOrEqual(4);
    }
  });

  it('ensures all monster frames have feet grounded on the bottom row', () => {
    for (const [id, art] of Object.entries(CH1_PILOT_ART)) {
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
    const silhouettes = Object.entries(CH1_PILOT_ART).map(([id, art]) => {
      const frame0 = art.frames.walk![0]!;
      return frame0.map((row) => row.replace(/[^.]/g, '#')).join('\n');
    });
    expect(new Set(silhouettes).size).toBe(5);
  });
});

describe('Warrior Cat Pilot Art (32x32, 32 px tall)', () => {
  it('follows the CatPilotArt format with zero problems', () => {
    const problems = catPilotArtProblems(WARRIOR_CAT_PILOT);
    expect(problems, `Warrior cat pilot has problems: ${problems.join('; ')}`).toEqual([]);
  });

  it('has dimensions exactly 32x32', () => {
    expect(WARRIOR_CAT_PILOT.size).toEqual({ w: 32, h: 32 });
  });

  it('has idle (4), walk (4), attack (4: windup -> strike -> recover), and hit (2) frames', () => {
    expect(WARRIOR_CAT_PILOT.frames.idle.length).toBe(4);
    expect(WARRIOR_CAT_PILOT.frames.walk.length).toBe(4);
    expect(WARRIOR_CAT_PILOT.frames.attack.length).toBe(4);
    expect(WARRIOR_CAT_PILOT.frames.hit.length).toBe(2);
  });

  it('ensures all cat frames have paws grounded on row 31', () => {
    for (const [anim, frames] of Object.entries(WARRIOR_CAT_PILOT.frames)) {
      frames.forEach((rows, i) => {
        const bottomRow = rows[31]!;
        const hasPaw = bottomRow.split('').some((ch) => ch !== '.');
        expect(hasPaw, `Cat ${anim}[${i}] bottom row must touch ground`).toBe(true);
      });
    }
  });

  it('has distinct silhouettes across idle, walk, attack, and hit', () => {
    const idles = WARRIOR_CAT_PILOT.frames.idle[0]!.map((r) => r.replace(/[^.]/g, '#')).join('');
    const walks = WARRIOR_CAT_PILOT.frames.walk[0]!.map((r) => r.replace(/[^.]/g, '#')).join('');
    const attacks = WARRIOR_CAT_PILOT.frames.attack[2]!.map((r) => r.replace(/[^.]/g, '#')).join('');
    const hits = WARRIOR_CAT_PILOT.frames.hit[0]!.map((r) => r.replace(/[^.]/g, '#')).join('');

    expect(new Set([idles, walks, attacks, hits]).size).toBe(4);
  });
});
