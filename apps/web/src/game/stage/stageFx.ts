/** The authored backdrop floor is in scene pixels. Unknown floors use 7/8 of the stage. */
export function computeFloorY(height: number, backdropFloor?: number): number {
  return Math.round(Math.max(0, Math.min(height, backdropFloor ?? height * 7 / 8)));
}

/** Pick a half-integer scale inside the visible-height limits, nearest the cat's height. */
export function scaleForMonster(catHeight: number, monsterHeight: number, boss = false): number {
  if (catHeight <= 0 || monsterHeight <= 0) throw new RangeError('Visible heights must be positive');
  const min = Math.max(1, Math.ceil(.8 * catHeight / monsterHeight * 2));
  const max = Math.floor((boss ? 2.0 : 1.25) * catHeight / monsterHeight * 2);
  if (min > max) throw new RangeError('No crisp scale fits these visible heights');
  return Math.max(min, Math.min(max, Math.round(catHeight / monsterHeight * 2))) / 2;
}

/** Ignore transparent padding when sizing actors and their shadows. */
export function visibleBounds(width: number, height: number, opaque: (x: number, y: number) => boolean) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (opaque(x, y)) {
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return { width: Math.max(0, right - left + 1), height: Math.max(0, bottom - top + 1), bottom: bottom + 1 };
}

export function damageTextStyle(big = false, missed = false, colors = { accent: '#ff9a4a', muted: '#b8a9c9', font: '"JetBrains Mono", monospace' }) {
  return { fontFamily: colors.font, fontSize: big ? '15px' : '10px', color: missed ? colors.muted : big ? colors.accent : '#ffffff', stroke: '#000000', strokeThickness: 1, resolution: 1 };
}

/** Motion is measured from the impact, independent of animation frame rate. */
export function feedbackAt(age: number, reduced: boolean) {
  const progress = Math.max(0, Math.min(1, age / 600));
  return {
    flash: age < 80,
    shake: !reduced && age < 100 ? (Math.floor(age / 25) % 2 === 0 ? 2 : -2) : 0,
    rise: reduced ? 0 : 12 * progress,
    alpha: reduced ? (age < 600 ? 1 : 0) : 1 - progress,
    done: age >= 600,
  };
}

/** Opaque horizontal edges in world coordinates relative to the sprite's origin. */
export function horizontalBounds(width: number, height: number, origin: number, scale: number, opaque: (x: number, y: number) => boolean) {
  let left = width, right = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (opaque(x, y)) {
    left = Math.min(left, x); right = Math.max(right, x + 1);
  }
  return { left: (left - width * origin) * scale, right: (right - width * origin) * scale };
}
