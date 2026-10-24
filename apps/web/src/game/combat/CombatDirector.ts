import { v2 } from '@taskbar-hero/game-rules';
import type { CatSheet } from '../rig';
import {
  COLORS,
  drawParticle,
  drawProjectile,
  drawShape,
  WEAPON_FX,
  type BurstInit,
  type Particle,
  type Projectile,
  type Shape,
  type ShapeInit,
  type Spawner,
} from './effects';
import { Pool } from './pool';
import type { CombatCat, CombatMonster, CombatScene, FxGraphics, FxText, Point } from './stage';
import { buildBossCues, buildIdleCues, CuePlayer, type CombatCue, type WeaponTiming } from './timeline';

export type MonsterTier = 'normal' | 'elite' | 'boss';

/** Fixed look of the feedback, in ms and px (the card's numbers). */
export const FEEL = {
  flashMs: 60,
  knockbackPx: 3,
  knockbackMs: 90,
  hitStopMs: 50,
  shakePx: 2,
  shakeMs: 80,
  slowMoMs: 200,
  slowMoScale: 0.3,
  defeatMs: 420,
  hopPx: 12,
  lootFlyMs: 520,
  reducedFxScale: 0.5,
} as const;

export const MAX_PARTICLES = 30;
const MAX_SHAPES = 16;
const MAX_PROJECTILES = 6;
const MAX_NUMBERS = 12;
const LOOT_COUNT = 4;

/** Scene-side reactions that go beyond visuals (HUD, loot, state). All optional. */
export interface CombatHooks {
  /** A hit landed, at its impact time. */
  onImpact?(cue: Extract<CombatCue, { type: 'impact' }>): void;
  onMonsterHp?(hp: number, maxHp: number): void;
  onCatHp?(hp: number, maxHp: number): void;
  /** Defeat started (hop and fade begin). */
  onDefeat?(): void;
  /** One piece of loot reached the lootTarget. */
  onLootArrive?(): void;
  onEnd?(won: boolean): void;
}

export interface CombatDirectorOptions {
  scene: CombatScene;
  cat: CombatCat;
  monster: CombatMonster;
  weapon: WeaponTiming;
  /** Animation keys of the cat (CatSheet.anims[...].key). */
  anims: { attack: string; hurt?: string; idle?: string };
  /** Where loot flies to when a monster dies (the top bar). */
  lootTarget: Point;
  /** World point of the weapon grip; default is a spot in front of the cat. */
  grip?: () => Point;
  /** Monster height in px, for the HP bar and where hits land. Default 24. */
  monsterHeight?: number;
  tier?: MonsterTier;
  /** Default: the prefers-reduced-motion media query. */
  reducedMotion?: boolean;
  hooks?: CombatHooks;
  depth?: number;
}

interface NumberItem {
  obj: FxText;
  age: number;
  dur: number;
  x: number;
  y: number;
  rise: number;
}

export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/** World point of the weapon grip for one cat frame, from the baked sheet's anchors. */
export function gripFromSheet(sheet: CatSheet, sprite: Point, scale = 1, frame = 0): Point {
  const g = sheet.anchors('attack', frame).grip;
  return {
    x: sprite.x + (g.x - sheet.origin.x * sheet.frameW) * sheet.px * scale,
    y: sprite.y + (g.y - sheet.origin.y * sheet.frameH) * sheet.px * scale,
  };
}

/** Weapon timing of a class, straight from game-rules. */
export const weaponOf = (classId: string): WeaponTiming => v2.weaponProfileOf(classId);

/**
 * Animates a fight from cues. Drive it with update(dtMs) each frame after calling playBoss or
 * playIdle. Game time (when callbacks fire) only follows real dt; hit-stop and slow motion only
 * stretch the visuals, so hit moments are identical with or without them and with reduced motion.
 */
export class CombatDirector implements Spawner {
  readonly reducedMotion: boolean;
  private readonly o: CombatDirectorOptions;
  private readonly layer: FxGraphics;
  private readonly hpBar: FxGraphics;
  private readonly numbers: Pool<NumberItem>;
  private readonly particles: Pool<Particle>;
  private readonly shapes: Pool<Shape>;
  private readonly projectiles: Pool<Projectile>;
  private readonly fxScale: number;
  private monster: CombatMonster;
  private tier: MonsterTier;
  private home: Point;

  private player: CuePlayer | null = null;
  private idle: { stats: v2.CatStats; monster: v2.MonsterStats } | null = null;
  private restartIdle = false;
  private rng = 12345;
  private destroyed = false;

  private hp = 1;
  private maxHp = 1;
  private catHp = 1;
  private catMaxHp = 1;
  private ghost = 1;
  private barVisible = false;
  private hitIndex = 0;
  private numberCount = 0;

  private hitStopLeft = 0;
  private slowLeft = 0;
  private flashLeft = 0;
  private knock = { age: 1e9, dur: 1, px: 0 };
  private defeatAge = -1;
  private pendingLoot = 0;
  private returnToIdleIn = -1;
  private paused = false;

  constructor(options: CombatDirectorOptions) {
    this.o = options;
    this.monster = options.monster;
    this.tier = options.tier ?? 'normal';
    this.home = { x: options.monster.x, y: options.monster.y };
    this.reducedMotion = options.reducedMotion ?? prefersReducedMotion();
    this.fxScale = this.reducedMotion ? FEEL.reducedFxScale : 1;

    const { scene } = options;
    const depth = options.depth ?? 50;
    this.layer = scene.add.graphics().setDepth(depth);
    this.hpBar = scene.add.graphics().setDepth(depth + 1);
    this.numbers = new Pool<NumberItem>(
      MAX_NUMBERS,
      () => ({
        obj: scene.add
          .text(0, 0, '', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
          })
          .setOrigin(0.5, 1)
          .setDepth(depth + 2)
          .setVisible(false),
        age: 0,
        dur: 1,
        x: 0,
        y: 0,
        rise: 0,
      }),
      (n) => n.obj.setVisible(false),
      true,
    );
    // Created up front so the object count stays constant during fights.
    for (const n of Array.from({ length: MAX_NUMBERS }, () => this.numbers.acquire()!)) this.numbers.release(n);

    const blank = { x: 0, y: 0, age: 0, dur: 1 };
    this.particles = new Pool<Particle>(
      MAX_PARTICLES,
      () => ({ ...blank, vx: 0, vy: 0, gravity: 0, size: 1, color: 0 }),
      (q) => {
        q.target = undefined;
        q.start = undefined;
      },
    );
    this.shapes = new Pool<Shape>(MAX_SHAPES, () => ({ ...blank, kind: 'ring', durMs: 1, color: 0, size: 1 }), () => {}, true);
    this.projectiles = new Pool<Projectile>(
      MAX_PROJECTILES,
      () => ({ ...blank, kind: 'arrow', from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }),
      () => {},
      true,
    );
  }

  /** Fight a boss: cues come from the rules timeline. */
  playBoss(result: Pick<v2.BossResultV2, 'log' | 'bossMaxHp' | 'catMaxHp'>, tier: MonsterTier = 'boss'): void {
    this.idle = null;
    this.tier = tier;
    this.play(buildBossCues(result, this.o.weapon));
  }

  /** Idle fights: predicted kills, one monster after another until stopIdle(). */
  playIdle(stats: v2.CatStats, monster: v2.MonsterStats, tier: MonsterTier = 'normal'): void {
    this.idle = { stats, monster };
    this.tier = tier;
    this.play(buildIdleCues(stats, monster));
  }

  stopIdle(): void {
    this.idle = null;
  }

  /** Play ready-made cues from game time 0. */
  play(cues: readonly CombatCue[]): void {
    this.player = new CuePlayer(cues, (cue) => this.handle(cue));
  }

  /** Point the director at another monster sprite (its position becomes the new home). */
  setMonster(monster: CombatMonster, tier: MonsterTier = 'normal'): void {
    this.monster = monster;
    this.tier = tier;
    this.home = { x: monster.x, y: monster.y };
  }

  /** Anything still animating: effects, numbers, loot, a defeat in progress. */
  get busy(): boolean {
    return (
      this.particles.active.length + this.shapes.active.length + this.projectiles.active.length + this.numbers.active.length > 0 ||
      this.defeatAge >= 0 ||
      this.pendingLoot > 0 ||
      this.hitStopLeft > 0
    );
  }

  get activeCounts() {
    return {
      particles: this.particles.active.length,
      shapes: this.shapes.active.length,
      projectiles: this.projectiles.active.length,
      numbers: this.numbers.active.length,
    };
  }

  update(dtMs: number): void {
    if (this.destroyed) return;
    const dt = Math.min(Math.max(0, dtMs), 100);
    this.player?.advance(dt);
    if (this.restartIdle && this.idle) {
      this.restartIdle = false;
      this.play(buildIdleCues(this.idle.stats, this.idle.monster));
    }

    let vdt = dt;
    if (this.hitStopLeft > 0) {
      vdt = 0;
      this.hitStopLeft -= dt;
    } else if (this.slowLeft > 0) {
      vdt = dt * FEEL.slowMoScale;
      this.slowLeft -= dt;
    }
    this.setAnimsPaused(this.hitStopLeft > 0);

    this.stepVisuals(vdt);
    this.stepCat(dt);
    this.draw();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.setAnimsPaused(false);
    this.monster.clearTint();
    this.layer.destroy();
    this.hpBar.destroy();
    for (const n of this.numbers.all()) n.obj.destroy();
    this.numbers.releaseAll();
    this.particles.releaseAll();
    this.shapes.releaseAll();
    this.projectiles.releaseAll();
    this.player = null;
    this.idle = null;
  }

  // Spawner

  shape(init: ShapeInit): void {
    const s = this.shapes.acquire();
    if (!s) return;
    Object.assign(s, init, { durMs: init.durMs * this.fxScale, age: 0 });
  }

  burst(count: number, x: number, y: number, init: BurstInit): void {
    const n = this.reducedMotion ? Math.ceil(count / 2) : count;
    for (let i = 0; i < n; i++) {
      const q = this.particles.acquire();
      if (!q) return;
      const a = init.up ? -Math.PI / 2 + (this.rand() - 0.5) * 1.6 : this.rand() * Math.PI * 2;
      const v = init.speed * (0.5 + this.rand() * 0.5);
      Object.assign(q, {
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        gravity: init.gravity,
        age: 0,
        dur: init.durMs * this.fxScale,
        size: init.size,
        color: init.color,
      });
    }
  }

  // Cue handling

  private handle(cue: CombatCue): void {
    const hooks = this.o.hooks;
    switch (cue.type) {
      case 'spawn':
        this.onSpawn(cue);
        break;
      case 'attackStart':
        this.hitIndex = 0;
        this.o.cat.play(this.o.anims.attack);
        this.returnToIdleIn = Math.max(...this.o.weapon.hitAtMs) + 250;
        WEAPON_FX[this.o.weapon.id]?.attackStart?.(this.fxContext());
        break;
      case 'release':
        this.onRelease(cue);
        break;
      case 'impact':
        this.onImpact(cue);
        hooks?.onImpact?.(cue);
        break;
      case 'dot':
        this.setHp(cue.hp);
        this.spawnNumber(`${Math.round(cue.damage)}`, cue.source === 'burn' ? '#ff9a4a' : '#8be36a', 7, 0);
        this.burst(2, this.target().x, this.target().y, {
          color: cue.source === 'burn' ? COLORS.ember : COLORS.poison,
          speed: 25,
          gravity: -40,
          durMs: 420,
          size: 1,
          up: true,
        });
        break;
      case 'bossWindup':
        this.shape({ kind: 'warn', x: this.target().x, y: this.home.y - (this.o.monsterHeight ?? 24) - 8, durMs: cue.big ? 700 : 350, color: COLORS.warn, size: cue.big ? 12 : 7 });
        break;
      case 'bossImpact':
        this.onBossImpact(cue);
        break;
      case 'defeat':
        this.onDefeat();
        break;
      case 'end':
        hooks?.onEnd?.(cue.won);
        break;
      case 'cycleEnd':
        if (this.idle) this.restartIdle = true;
        break;
    }
  }

  private onSpawn(cue: Extract<CombatCue, { type: 'spawn' }>): void {
    this.maxHp = Math.max(1, cue.maxHp);
    this.hp = this.maxHp;
    this.ghost = 1;
    this.barVisible = true;
    if (cue.catMaxHp !== undefined) {
      this.catMaxHp = Math.max(1, cue.catMaxHp);
      this.catHp = this.catMaxHp;
    }
    this.defeatAge = -1;
    this.flashLeft = 0;
    this.knock.age = 1e9;
    this.monster.clearTint();
    this.monster.setVisible(true).setAlpha(1).setPosition(this.home.x, this.home.y);
    this.o.hooks?.onMonsterHp?.(this.hp, this.maxHp);
  }

  private onRelease(cue: Extract<CombatCue, { type: 'release' }>): void {
    const pr = this.projectiles.acquire();
    const grip = this.grip();
    if (pr) Object.assign(pr, { kind: cue.kind, from: grip, to: this.target(), age: 0, dur: cue.travelMs });
    WEAPON_FX[this.o.weapon.id]?.release?.(this.fxContext());
  }

  /** Damage lands: everything the player sees about a hit happens here. */
  private onImpact(cue: Extract<CombatCue, { type: 'impact' }>): void {
    const t = this.target();
    // The projectile that carried this hit has arrived.
    const arrived = this.projectiles.active[0];
    if (arrived) this.projectiles.release(arrived);

    this.setHp(cue.hp);
    const big = cue.crit;
    this.spawnNumber(`${Math.round(cue.damage)}${big ? '!' : ''}`, big ? '#ffd23f' : '#ffffff', big ? 15 : cue.source === 'arrow' ? 8 : 10, big ? 1 : 0);

    this.flashLeft = FEEL.flashMs;
    this.monster.setTintFill(COLORS.white);
    const heavy = this.tier !== 'normal' && (cue.crit || cue.hp <= 0);
    this.knock = {
      age: 0,
      dur: heavy ? FEEL.knockbackMs * 1.8 : FEEL.knockbackMs,
      px: (heavy ? FEEL.knockbackPx * 2.5 : FEEL.knockbackPx) * (this.monster.x >= this.o.cat.x ? 1 : -1),
    };

    this.hitStopLeft = FEEL.hitStopMs;
    if (!this.reducedMotion && (cue.crit || this.o.weapon.id === 'hammer')) {
      const cam = this.o.scene.cameras.main;
      cam.shake(FEEL.shakeMs, FEEL.shakePx / Math.max(1, cam.width));
    }

    WEAPON_FX[this.o.weapon.id]?.impact?.({ ...this.fxContext(), target: t });
    this.hitIndex++;
  }

  private onBossImpact(cue: Extract<CombatCue, { type: 'bossImpact' }>): void {
    const cat = this.o.cat;
    if (cue.dodged) {
      this.spawnNumber('MISS', '#cfe8ff', 8, 0, { x: cat.x, y: cat.y - 24 });
      return;
    }
    this.catHp = cue.catHp;
    this.o.hooks?.onCatHp?.(cue.catHp, this.catMaxHp);
    this.spawnNumber(`${Math.round(cue.damage)}`, '#ff6a6a', cue.big ? 13 : 9, 0, { x: cat.x, y: cat.y - 24 });
    if (this.o.anims.hurt) {
      cat.play(this.o.anims.hurt);
      this.returnToIdleIn = 260;
    }
    this.burst(3, cat.x, cat.y - 10, { color: COLORS.warn, speed: 60, gravity: 150, durMs: 200, size: 1 });
  }

  private onDefeat(): void {
    this.defeatAge = 0;
    this.o.hooks?.onDefeat?.();
    const t = this.target();
    this.burst(8, t.x, t.y, { color: COLORS.dust, speed: 70, gravity: 40, durMs: 420, size: 2 });
    this.burst(4, t.x, t.y, { color: COLORS.white, speed: 50, gravity: 0, durMs: 300, size: 1 });
    if (this.tier !== 'normal' && !this.reducedMotion) this.slowLeft = FEEL.slowMoMs;

    const count = this.reducedMotion ? 2 : LOOT_COUNT;
    for (let i = 0; i < count; i++) {
      const q = this.particles.acquire();
      if (!q) {
        this.o.hooks?.onLootArrive?.();
        continue;
      }
      const start = { x: t.x, y: t.y };
      Object.assign(q, {
        x: t.x,
        y: t.y,
        vx: 0,
        vy: 0,
        gravity: 0,
        age: -i * 60 * this.fxScale,
        dur: FEEL.lootFlyMs * this.fxScale,
        size: 2,
        color: COLORS.loot,
        start,
        target: this.o.lootTarget,
      });
      this.pendingLoot++;
    }
  }

  // Per frame

  private stepVisuals(dt: number): void {
    for (const q of [...this.particles.active]) {
      q.age += dt;
      if (q.age < 0) continue;
      if (q.target && q.start) {
        const p = Math.min(1, q.age / q.dur);
        const e = p * p;
        q.x = q.start.x + (q.target.x - q.start.x) * e;
        q.y = q.start.y + (q.target.y - q.start.y) * e - Math.sin(Math.PI * p) * 14;
        if (p >= 1) {
          this.particles.release(q);
          this.pendingLoot--;
          this.o.hooks?.onLootArrive?.();
        }
        continue;
      }
      q.vy += q.gravity * (dt / 1000);
      q.x += q.vx * (dt / 1000);
      q.y += q.vy * (dt / 1000);
      if (q.age >= q.dur) this.particles.release(q);
    }
    for (const s of [...this.shapes.active]) {
      s.age += dt;
      if (s.age >= s.durMs) this.shapes.release(s);
    }
    for (const pr of [...this.projectiles.active]) {
      pr.age += dt;
      if (pr.age >= pr.dur) this.projectiles.release(pr);
    }
    for (const n of [...this.numbers.active]) {
      n.age += dt;
      if (n.age >= n.dur) {
        this.numbers.release(n);
        continue;
      }
      const p = n.age / n.dur;
      n.obj.setPosition(n.x, n.y - n.rise * Math.sqrt(p)).setAlpha(p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4);
    }

    this.stepMonster(dt);
    this.ghost = Math.max(this.hp / this.maxHp, this.ghost - dt / 600);
  }

  private stepMonster(dt: number): void {
    if (this.flashLeft > 0) {
      this.flashLeft -= dt;
      if (this.flashLeft <= 0) this.monster.clearTint();
    }
    this.knock.age += dt;
    let dx = 0;
    let dy = 0;
    if (this.knock.age < this.knock.dur) dx = this.knock.px * (1 - this.knock.age / this.knock.dur);

    if (this.defeatAge >= 0) {
      this.defeatAge += dt;
      const total = FEEL.defeatMs * this.fxScale;
      const p = Math.min(1, this.defeatAge / total);
      if (!this.reducedMotion) dy = -FEEL.hopPx * Math.sin(Math.PI * Math.min(1, p * 1.6));
      this.monster.setAlpha(1 - Math.max(0, (p - 0.25) / 0.75));
      if (p >= 1) {
        this.defeatAge = -1;
        this.monster.setAlpha(0).setVisible(false);
        this.monster.clearTint();
        this.barVisible = false;
      }
    }
    if (this.monster.alpha > 0) this.monster.setPosition(this.home.x + dx, this.home.y + dy);
  }

  private stepCat(dt: number): void {
    if (this.returnToIdleIn < 0) return;
    this.returnToIdleIn -= dt;
    if (this.returnToIdleIn < 0 && this.o.anims.idle) this.o.cat.play(this.o.anims.idle, true);
  }

  private draw(): void {
    const g = this.layer.clear();
    for (const s of this.shapes.active) drawShape(g, s);
    for (const pr of this.projectiles.active) drawProjectile(g, pr);
    for (const q of this.particles.active) drawParticle(g, q);

    const bar = this.hpBar.clear();
    if (!this.barVisible) return;
    const w = 20;
    const x = Math.round(this.home.x - w / 2);
    const y = Math.round(this.home.y - (this.o.monsterHeight ?? 24) - 6);
    bar.fillStyle(0x000000, 0.7).fillRect(x - 1, y - 1, w + 2, 4);
    bar.fillStyle(0xffffff, 0.8).fillRect(x, y, Math.round(w * this.ghost), 2);
    bar.fillStyle(0xe5484d, 1).fillRect(x, y, Math.round((w * this.hp) / this.maxHp), 2);
  }

  // Helpers

  private setHp(hp: number): void {
    this.hp = Math.max(0, Math.min(this.maxHp, hp));
    this.o.hooks?.onMonsterHp?.(this.hp, this.maxHp);
  }

  private setAnimsPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    for (const a of [this.o.cat.anims, this.monster.anims]) {
      if (paused) a?.pause();
      else a?.resume();
    }
  }

  private spawnNumber(text: string, color: string, size: number, jitterSeed: number, at?: Point): void {
    const n = this.numbers.acquire();
    if (!n) return;
    const base = at ?? { x: this.home.x, y: this.home.y - (this.o.monsterHeight ?? 24) - 4 };
    const jitter = ((this.numberCount++ * 7 + jitterSeed) % 5) - 2;
    n.age = 0;
    n.dur = (size > 12 ? 900 : 650) * this.fxScale;
    n.x = base.x + jitter * 3;
    n.y = base.y;
    n.rise = size > 12 ? 22 : 14;
    n.obj.setText(text).setColor(color).setFontSize(size).setPosition(n.x, n.y).setAlpha(1).setVisible(true);
  }

  private target(): Point {
    return { x: this.home.x, y: this.home.y - (this.o.monsterHeight ?? 24) / 2 };
  }

  private grip(): Point {
    return this.o.grip?.() ?? { x: this.o.cat.x + 10, y: this.o.cat.y - 12 };
  }

  private fxContext() {
    return { fx: this as Spawner, grip: this.grip(), target: this.target(), windupMs: this.o.weapon.windupMs, hitIndex: this.hitIndex };
  }

  /** Small deterministic generator: same fight, same sparks. */
  private rand(): number {
    this.rng = (this.rng * 1664525 + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }
}
