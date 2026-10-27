import type { FxGraphics, Point } from './stage';
import type { ProjectileKind } from './timeline';

export const COLORS = {
  white: 0xffffff,
  gold: 0xffd23f,
  spark: 0xfff3a8,
  steel: 0xdfe8f2,
  dust: 0xb9a58a,
  wood: 0x9a6b3a,
  bolt: 0xb07cff,
  ember: 0xff7a2f,
  glass: 0xbfe9f5,
  poison: 0x6fd24a,
  warn: 0xff4a4a,
  loot: 0xffd23f,
} as const;

export type ShapeKind = 'slash' | 'ring' | 'thrust' | 'glyph' | 'burst' | 'puff' | 'string' | 'streak' | 'warn';

export interface ShapeInit {
  kind: ShapeKind;
  x: number;
  y: number;
  /** End point for thrust and streak. */
  x2?: number;
  y2?: number;
  durMs: number;
  color: number;
  size: number;
  angle?: number;
}

export interface Shape extends ShapeInit {
  age: number;
}

export interface BurstInit {
  color: number;
  /** Pixels per second. */
  speed: number;
  /** Pixels per second squared, positive pulls down. */
  gravity: number;
  durMs: number;
  size: number;
  /** Upward-only spray (embers, bubbles). */
  up?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  age: number;
  dur: number;
  size: number;
  color: number;
  /** Set for loot: flies from its start to this point instead of using velocity. */
  target?: Point;
  start?: Point;
}

export interface Projectile {
  kind: ProjectileKind;
  from: Point;
  to: Point;
  age: number;
  dur: number;
}

/** What a weapon recipe may ask for; the director implements it (pools, reduced motion). */
export interface Spawner {
  shape(init: ShapeInit): void;
  burst(count: number, x: number, y: number, init: BurstInit): void;
}

export interface FxContext {
  fx: Spawner;
  /** Weapon grip in world space. */
  grip: Point;
  /** Where the monster is hit. */
  target: Point;
  windupMs: number;
  /** 0-based index of the hit within the attack (daggers: 0 then 1). */
  hitIndex: number;
}

export interface WeaponFx {
  attackStart?(c: FxContext): void;
  release?(c: FxContext): void;
  impact?(c: FxContext): void;
}

export const WEAPON_FX: Record<string, WeaponFx> = {
  sword: {
    impact: ({ fx, target }) => {
      fx.shape({ kind: 'slash', x: target.x, y: target.y, durMs: 160, color: COLORS.steel, size: 12, angle: -0.6 });
      fx.burst(4, target.x, target.y, { color: COLORS.spark, speed: 90, gravity: 200, durMs: 220, size: 1 });
    },
  },
  hammer: {
    impact: ({ fx, target }) => {
      fx.shape({ kind: 'ring', x: target.x, y: target.y + 10, durMs: 320, color: COLORS.dust, size: 20 });
      fx.burst(5, target.x, target.y + 10, { color: COLORS.dust, speed: 60, gravity: 80, durMs: 320, size: 2, up: true });
    },
  },
  daggers: {
    impact: ({ fx, target, grip, hitIndex }) => {
      const flip = hitIndex % 2 === 0 ? -1 : 1;
      fx.shape({ kind: 'slash', x: target.x, y: target.y, durMs: 110, color: COLORS.steel, size: 8, angle: 0.5 * flip });
      fx.shape({ kind: 'streak', x: grip.x, y: grip.y, x2: target.x, y2: target.y, durMs: 180, color: COLORS.steel, size: 3 });
    },
  },
  spear: {
    impact: ({ fx, target, grip }) => {
      fx.shape({ kind: 'thrust', x: grip.x, y: grip.y, x2: target.x, y2: target.y, durMs: 140, color: COLORS.steel, size: 2 });
      fx.burst(3, target.x, target.y, { color: COLORS.spark, speed: 80, gravity: 160, durMs: 180, size: 1 });
    },
  },
  bow: {
    release: ({ fx, grip }) => {
      fx.shape({ kind: 'string', x: grip.x, y: grip.y, durMs: 120, color: COLORS.white, size: 8 });
    },
    impact: ({ fx, target }) => {
      fx.burst(3, target.x, target.y, { color: COLORS.spark, speed: 70, gravity: 160, durMs: 160, size: 1 });
    },
  },
  staff: {
    attackStart: ({ fx, grip, windupMs }) => {
      fx.shape({ kind: 'glyph', x: grip.x, y: grip.y, durMs: windupMs, color: COLORS.bolt, size: 9 });
    },
    impact: ({ fx, target }) => {
      fx.shape({ kind: 'burst', x: target.x, y: target.y, durMs: 240, color: COLORS.bolt, size: 12 });
      fx.burst(3, target.x, target.y, { color: COLORS.ember, speed: 30, gravity: -50, durMs: 520, size: 1, up: true });
    },
  },
  flasks: {
    impact: ({ fx, target }) => {
      fx.burst(5, target.x, target.y, { color: COLORS.glass, speed: 100, gravity: 260, durMs: 300, size: 1 });
      fx.shape({ kind: 'puff', x: target.x, y: target.y, durMs: 420, color: COLORS.poison, size: 10 });
      fx.burst(3, target.x, target.y, { color: COLORS.poison, speed: 25, gravity: -40, durMs: 560, size: 2, up: true });
    },
  },
};

/** Position and heading of a projectile at progress p (0 to 1). */
export function projectileAt(kind: ProjectileKind, from: Point, to: Point, p: number): Point & { angle: number } {
  const at = (q: number): Point => {
    const x = from.x + (to.x - from.x) * q;
    const y = from.y + (to.y - from.y) * q;
    if (kind === 'flask') return { x, y: y - 4 * q * (1 - q) * 50 };
    if (kind === 'bolt') return { x, y: y - Math.sin(Math.PI * q) * 8 };
    return { x, y };
  };
  const a = at(p);
  const b = at(Math.min(1, p + 0.02));
  return { ...a, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

export function drawProjectile(g: FxGraphics, pr: Projectile): void {
  const p = Math.min(1, Math.max(0, pr.age / pr.dur));
  const x = pr.from.x + (pr.to.x - pr.from.x) * p;
  const baseY = pr.from.y + (pr.to.y - pr.from.y) * p;
  const y = baseY - (pr.kind === 'flask' ? 4 * p * (1 - p) * 50 : pr.kind === 'bolt' ? Math.sin(Math.PI * p) * 8 : 0);
  const slope = pr.to.y - pr.from.y - (pr.kind === 'flask' ? 200 * (1 - 2 * p) : pr.kind === 'bolt' ? Math.PI * Math.cos(Math.PI * p) * 8 : 0);
  const angle = Math.atan2(slope, pr.to.x - pr.from.x);
  const dx = Math.cos(angle), dy = Math.sin(angle);
  if (pr.kind === 'arrow') {
    g.lineStyle(1, COLORS.white, 0.35).lineBetween(x - dx * 24, y - dy * 24, x - dx * 8, y - dy * 8);
    g.lineStyle(2, COLORS.wood, 1).lineBetween(x - dx * 8, y - dy * 8, x, y);
    g.fillStyle(COLORS.steel, 1).fillRect(x - 1, y - 1, 2, 2);
  } else if (pr.kind === 'bolt') {
    for (let k = 3; k >= 1; k--) {
      const tail = Math.max(0, p - k * 0.05);
      const tx = pr.from.x + (pr.to.x - pr.from.x) * tail;
      const ty = pr.from.y + (pr.to.y - pr.from.y) * tail - Math.sin(Math.PI * tail) * 8;
      g.fillStyle(COLORS.bolt, 0.5 - k * 0.1).fillCircle(tx, ty, 3 - k * 0.5);
    }
    g.fillStyle(COLORS.bolt, 1).fillCircle(x, y, 3);
    g.fillStyle(COLORS.white, 1).fillCircle(x, y, 1.5);
  } else {
    const spin = p * 12;
    g.fillStyle(COLORS.glass, 1).fillCircle(x, y, 3);
    g.fillStyle(COLORS.poison, 1).fillCircle(x, y + 1, 2);
    g.lineStyle(2, COLORS.glass, 1).lineBetween(x, y, x + Math.cos(spin) * 4, y + Math.sin(spin) * 4 - 3);
  }
}

export function drawShape(g: FxGraphics, s: Shape): void {
  const p = Math.min(1, Math.max(0, s.age / s.durMs));
  const fade = 1 - p;
  switch (s.kind) {
    case 'slash': {
      const a0 = (s.angle ?? 0) - 1.1;
      const sweep = 2.2 * Math.min(1, p * 2.5);
      g.lineStyle(1 + 2 * fade, s.color, fade);
      let px = s.x + Math.cos(a0) * s.size;
      let py = s.y + Math.sin(a0) * s.size;
      for (let i = 1; i <= 8; i++) {
        const a = a0 + (sweep * i) / 8;
        const nx = s.x + Math.cos(a) * s.size;
        const ny = s.y + Math.sin(a) * s.size;
        g.lineBetween(px, py, nx, ny);
        px = nx;
        py = ny;
      }
      break;
    }
    case 'ring':
      g.lineStyle(2, s.color, 0.8 * fade).strokeCircle(s.x, s.y, 3 + s.size * p);
      break;
    case 'thrust': {
      const head = Math.min(1, p * 3);
      g.lineStyle(s.size, s.color, fade).lineBetween(
        s.x + ((s.x2 ?? s.x) - s.x) * Math.max(0, head - 0.5),
        s.y + ((s.y2 ?? s.y) - s.y) * Math.max(0, head - 0.5),
        s.x + ((s.x2 ?? s.x) - s.x) * head,
        s.y + ((s.y2 ?? s.y) - s.y) * head,
      );
      break;
    }
    case 'glyph': {
      const a = p < 0.8 ? p / 0.8 : (1 - p) / 0.2;
      g.lineStyle(1, s.color, a).strokeCircle(s.x, s.y, s.size);
      g.lineStyle(1, s.color, a).strokeCircle(s.x, s.y, s.size * 0.55);
      const spin = p * 6;
      for (let i = 0; i < 3; i++) {
        const t = spin + (i * Math.PI * 2) / 3;
        g.lineBetween(s.x, s.y, s.x + Math.cos(t) * s.size, s.y + Math.sin(t) * s.size);
      }
      break;
    }
    case 'burst':
      g.fillStyle(s.color, 0.6 * fade).fillCircle(s.x, s.y, s.size * (0.4 + 0.6 * p));
      g.lineStyle(1, COLORS.white, fade).strokeCircle(s.x, s.y, s.size * p);
      break;
    case 'puff':
      g.fillStyle(s.color, 0.55 * fade).fillCircle(s.x, s.y - 4 * p, s.size * (0.5 + 0.5 * p));
      break;
    case 'string': {
      const wob = Math.sin(p * 30) * 2 * fade;
      g.lineStyle(1, s.color, fade).lineBetween(s.x, s.y - s.size / 2, s.x + wob, s.y);
      g.lineBetween(s.x + wob, s.y, s.x, s.y + s.size / 2);
      break;
    }
    case 'streak':
      g.lineStyle(s.size, s.color, 0.4 * fade).lineBetween(s.x, s.y, s.x2 ?? s.x, s.y2 ?? s.y);
      break;
    case 'warn':
      g.lineStyle(2, s.color, 0.8 * (1 - p * 0.5)).strokeCircle(s.x, s.y, s.size * (1.2 - 0.4 * p));
      g.fillStyle(s.color, 1).fillRect(s.x - 1, s.y - 5, 2, 6).fillRect(s.x - 1, s.y + 3, 2, 2);
      break;
  }
}

export function drawParticle(g: FxGraphics, q: Particle): void {
  if (q.age < 0) return;
  const p = Math.min(1, q.age / q.dur);
  g.fillStyle(q.color, 1 - p * p).fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size);
}
