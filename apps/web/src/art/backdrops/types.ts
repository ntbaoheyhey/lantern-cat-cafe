export type Color = number; // 0xRRGGBB

export interface BackdropLayer {
  /** Rows of palette characters; '.' is transparent. Every row has exactly `width` characters. */
  rows: readonly string[];
  /** Row of the 96-px scene where this layer's first row is drawn (0 = top). rows.length + top <= 96. */
  top: number;
  /** Horizontal scroll speed relative to the ground (far 0.3 to 0.6, near 1). */
  parallax: number;
}

export interface BackdropArt {
  /** Chapter background id from chapters.ts, e.g. 'livingroom'. */
  id: string;
  /** Tile width in art pixels; layers repeat every `width` px. */
  width: number;
  /** Character -> colour; '.' must not be defined; 'k' is the outline colour. */
  palette: Readonly<Record<string, Color>>;
  /** Wall/back layer: full height (top 0, 96 rows), no transparency. */
  far: BackdropLayer;
  /** Furniture/foreground layer, may be transparent, bottom-anchored (top + rows.length === 96). */
  near: BackdropLayer;
  /** Scene row where feet stand (the floor line); between 80 and 90. */
  floorY: number;
}

export const BACKDROP_LIMITS = {
  height: 96,
  minWidth: 128,
  maxWidth: 192,
  floorMin: 80,
  floorMax: 90,
  maxColors: 12,
} as const;

/**
 * Calculates the percentage of rows in the far layer where the colour at x = 0
 * differs from the colour at x = width - 1 (0 to 100).
 */
export function seamPercentage(art: BackdropArt): number {
  if (!art.far?.rows || art.far.rows.length === 0) return 0;
  let differing = 0;
  for (const row of art.far.rows) {
    if (row && row.length > 0) {
      const leftChar = row[0];
      const rightChar = row[row.length - 1];
      if (leftChar !== undefined && rightChar !== undefined) {
        const leftColor = art.palette?.[leftChar];
        const rightColor = art.palette?.[rightChar];
        if (leftColor !== undefined && rightColor !== undefined) {
          if (leftColor !== rightColor) differing++;
        } else if (leftChar !== rightChar) {
          differing++;
        }
      }
    }
  }
  return (differing / art.far.rows.length) * 100;
}

/**
 * Checks for problems with backdrop art. Each failure is a readable string
 * starting with the backdrop id. An empty array means valid art.
 */
export function backdropProblems(art: BackdropArt): string[] {
  const out: string[] = [];
  const at = art.id;

  // 1. id matches /^[a-z]+$/
  if (!/^[a-z]+$/.test(art.id)) {
    out.push(`${at}: id must match /^[a-z]+$/`);
  }

  // 2. width within limits
  if (art.width < BACKDROP_LIMITS.minWidth || art.width > BACKDROP_LIMITS.maxWidth) {
    out.push(
      `${at}: width ${art.width} is outside limits ${BACKDROP_LIMITS.minWidth}..${BACKDROP_LIMITS.maxWidth}`,
    );
  }

  // 3. palette checks
  if ('.' in art.palette) {
    out.push(`${at}: palette must not define '.'`);
  }
  if (!('k' in art.palette)) {
    out.push(`${at}: palette needs outline colour 'k'`);
  }
  const colorCount = Object.keys(art.palette).length;
  if (colorCount > BACKDROP_LIMITS.maxColors) {
    out.push(
      `${at}: palette has ${colorCount} colours, exceeding max of ${BACKDROP_LIMITS.maxColors}`,
    );
  }

  // 4. floorY within limits
  if (art.floorY < BACKDROP_LIMITS.floorMin || art.floorY > BACKDROP_LIMITS.floorMax) {
    out.push(
      `${at}: floorY ${art.floorY} is outside limits ${BACKDROP_LIMITS.floorMin}..${BACKDROP_LIMITS.floorMax}`,
    );
  }

  // 5. far layer structure and parallax
  if (art.far.top !== 0 || art.far.rows.length !== BACKDROP_LIMITS.height) {
    out.push(
      `${at}: far layer must have top 0 and ${BACKDROP_LIMITS.height} rows (got top ${art.far.top}, rows ${art.far.rows.length})`,
    );
  }
  if (art.far.parallax < 0.3 || art.far.parallax > 0.6) {
    out.push(`${at}: far parallax ${art.far.parallax} is outside 0.3..0.6`);
  }

  // 6. far layer rows
  let farHasDot = false;
  art.far.rows.forEach((row, y) => {
    if (row.length !== art.width) {
      out.push(`${at}: far row ${y} width ${row.length}, expected ${art.width}`);
    }
    for (const ch of row) {
      if (ch === '.') {
        farHasDot = true;
      } else if (!(ch in art.palette)) {
        out.push(`${at}: far row ${y}: character '${ch}' is not in palette`);
      }
    }
  });
  if (farHasDot) {
    out.push(`${at}: far layer contains '.' (transparency not allowed)`);
  }

  // 7. near layer structure and parallax
  if (art.near.top + art.near.rows.length !== BACKDROP_LIMITS.height) {
    out.push(
      `${at}: near layer not bottom-anchored: top ${art.near.top} + rows ${art.near.rows.length} !== ${BACKDROP_LIMITS.height}`,
    );
  }
  if (art.near.parallax !== 1) {
    out.push(`${at}: near parallax ${art.near.parallax} must be 1`);
  }

  // 8. near layer rows
  art.near.rows.forEach((row, y) => {
    if (row.length !== art.width) {
      out.push(`${at}: near row ${y} width ${row.length}, expected ${art.width}`);
    }
    for (const ch of row) {
      if (ch !== '.' && !(ch in art.palette)) {
        out.push(`${at}: near row ${y}: character '${ch}' is not in palette`);
      }
    }
  });

  // 9. tile seam
  const seamPct = seamPercentage(art);
  if (seamPct > 20) {
    out.push(`${at}: hard seam: ${seamPct.toFixed(1)}% of far rows differ at edges (limit 20%)`);
  }

  return out;
}
