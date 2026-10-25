import { describe, expect, it } from 'vitest';
import { BACKDROP_LIMITS, backdropProblems, seamPercentage, type BackdropArt } from './types';

const solidFar = (w: number, h: number = BACKDROP_LIMITS.height, char = 'k') =>
  Array.from({ length: h }, () => char.repeat(w));

const emptyNear = (w: number, rowsCount: number) =>
  Array.from({ length: rowsCount }, () => '.'.repeat(w));

const valid128: BackdropArt = {
  id: 'testroom',
  width: 128,
  palette: { k: 0x111111 },
  far: {
    top: 0,
    parallax: 0.5,
    rows: solidFar(128),
  },
  near: {
    top: 48,
    parallax: 1,
    rows: emptyNear(128, 48),
  },
  floorY: 85,
};

describe('backdropProblems', () => {
  it('accepts a minimal valid 128-wide art', () => {
    expect(backdropProblems(valid128)).toEqual([]);
  });

  it('fails on wrong width', () => {
    const badWidth = { ...valid128, width: 100 };
    const problems = backdropProblems(badWidth);
    expect(problems.join()).toContain('width');
  });

  it("fails on '.' in far", () => {
    const withDotInFar: BackdropArt = {
      ...valid128,
      far: {
        ...valid128.far,
        rows: ['.' + 'k'.repeat(127), ...solidFar(128, 95)],
      },
    };
    const problems = backdropProblems(withDotInFar);
    expect(problems.join()).toContain('.');
  });

  it('fails on unknown char', () => {
    const withUnknownChar: BackdropArt = {
      ...valid128,
      near: {
        ...valid128.near,
        rows: ['x' + '.'.repeat(127), ...emptyNear(128, 47)],
      },
    };
    const problems = backdropProblems(withUnknownChar);
    expect(problems.join()).toContain("'x' is not in palette");
  });

  it('fails when near is not bottom-anchored', () => {
    const notAnchored: BackdropArt = {
      ...valid128,
      near: {
        ...valid128.near,
        top: 40, // 40 + 48 = 88 !== 96
      },
    };
    const problems = backdropProblems(notAnchored);
    expect(problems.join()).toContain('bottom-anchored');
  });

  it('fails on floorY 50', () => {
    const badFloor = { ...valid128, floorY: 50 };
    const problems = backdropProblems(badFloor);
    expect(problems.join()).toContain('floorY');
  });

  it('fails on far parallax 1', () => {
    const badParallax: BackdropArt = {
      ...valid128,
      far: {
        ...valid128.far,
        parallax: 1,
      },
    };
    const problems = backdropProblems(badParallax);
    expect(problems.join()).toContain('parallax');
  });

  it("fails on palette with '.'", () => {
    const badPalette: BackdropArt = {
      ...valid128,
      palette: {
        k: 0x111111,
        '.': 0xffffff,
      },
    };
    const problems = backdropProblems(badPalette);
    expect(problems.join()).toContain("palette must not define '.'");
  });

  it('fails on a hard seam', () => {
    // 50 rows out of 96 differ at x=0 vs x=width-1 (52% > 20%)
    const seamRows = [
      ...Array.from({ length: 50 }, () => 'k' + 'k'.repeat(126) + 'w'),
      ...Array.from({ length: 46 }, () => 'k'.repeat(128)),
    ];
    const hardSeamArt: BackdropArt = {
      ...valid128,
      palette: { k: 0x111111, w: 0xffffff },
      far: {
        ...valid128.far,
        rows: seamRows,
      },
    };
    const problems = backdropProblems(hardSeamArt);
    expect(problems.join()).toContain('hard seam');
    expect(seamPercentage(hardSeamArt)).toBeGreaterThan(20);
  });

  it('fails on invalid id, missing k, excess colors, and near parallax', () => {
    expect(backdropProblems({ ...valid128, id: 'living_Room' }).join()).toContain('id must match');
    expect(backdropProblems({ ...valid128, palette: { a: 0x111111 } }).join()).toContain(
      "needs outline colour 'k'",
    );
    const thirteenColors: Record<string, number> = { k: 0 };
    for (let i = 0; i < 12; i++) thirteenColors[`c${i}`] = i;
    expect(backdropProblems({ ...valid128, palette: thirteenColors }).join()).toContain(
      'colours, exceeding max',
    );
    expect(
      backdropProblems({ ...valid128, near: { ...valid128.near, parallax: 0.8 } }).join(),
    ).toContain('near parallax');
  });
});
