import Phaser from 'phaser';
import type { GameLoop } from './gameState';

export const STRIP_HEIGHT = 96;
const GROUND_HEIGHT = 18;
const HERO_X = 56;
const GROUND_SPEED = 60; // px per second the world scrolls left
// Parallax layers scroll slower the further away they are; the ground is the fastest.
const STAR_SPEED = 2;
const FAR_HILLS_SPEED = 6;
const CAFE_SPEED = 14;
const NEAR_HILLS_SPEED = 30;
const ENEMY_SPEED = 30; // extra px per second the enemy moves left
const FIGHT_GAP = 44; // cat-to-yarn distance while fighting
const HIT_EVERY_MS = 320;
const HITS_TO_KILL = 5;
const DEATH_MS = 300;
const WALK_FRAME_MS = 180;
const BLINK_EVERY_MS = 2000;
const BLINK_MS = 120;
const TAIL_FRAME_MS = 500;
const SQUASH_MS = 70;

const PX = 4; // one art pixel is 4 screen pixels

/** Draw a tiny sprite from a string map into a generated texture. */
function pixelTexture(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  palette: Record<string, number>,
): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (color === undefined) return;
      g.fillStyle(color, 1);
      g.fillRect(x * PX, y * PX, PX, PX);
    });
  });
  g.generateTexture(key, (rows[0]?.length ?? 1) * PX, rows.length * PX);
  g.destroy();
}

// Mochi, an orange tabby with a tiny sword. Frames combine two leg poses, open or closed eyes and a
// tail up or down, so a blink or a tail flick never needs a texture built at run time.
const HERO_PALETTE = {
  o: 0xf0a040, d: 0xc66a1a, w: 0xfff0d8, k: 0x2a1a10, n: 0xff8fb1, s: 0xdfe6f2, g: 0x7a5a3a,
};
function heroRows(legs: 0 | 1, blink: boolean, tailUp: boolean): string[] {
  return [
    '.d....d...s.',
    '.oooooo...s.',
    blink ? '.oooooo...s.' : '.okooko...s.',
    '.owwnww...s.',
    tailUp ? 'd.owwo...gg.' : '..owwo...gg.',
    tailUp ? 'dooooooogg..' : '.ooooooogg..',
    'doododoo.o..',
    tailUp ? '.oooooooo...' : 'doooooooo...',
    legs === 0 ? '.ow.wo.wo...' : '..ow.wo.wo..',
    legs === 0 ? '.dd.dd.dd...' : '..dd.dd.dd..',
  ];
}
/** Texture keys indexed by legs * 4 + blink * 2 + tailUp. */
const HERO_KEYS: string[] = [];
for (const legs of [0, 1] as const) {
  for (const blink of [0, 1]) {
    for (const tail of [0, 1]) HERO_KEYS.push(`hero-${legs}${blink}${tail}`);
  }
}

// A pink ball of yarn with a loose thread.
const YARN_PALETTE = { p: 0xd9578a, P: 0xff8fb1, q: 0xffc2d6 };
const YARN = [
  '...pppp...',
  '..pPPPPp..',
  '.pPqpPPPp.',
  '.pPPPqPPp.',
  '.pqPPPPqp.',
  '.pPPqPPPp.',
  '..pPPPPp..',
  '...pppp...',
  '.pPP......',
];

// A crescent moon.
const MOON_PALETTE = { y: 0xfff3c4, l: 0xffe08a };
const MOON = [
  '..yyy..',
  '.yyyl..',
  'yyyl...',
  'yyy....',
  'yyyl...',
  '.yyyl..',
  '..yyy..',
];

/**
 * A row of pixel hills as one seamless texture. `bumps` whole waves fit the width, so the tile
 * repeats without a seam; columns are 4px wide and heights snap to 2px steps.
 */
function hillsTexture(
  scene: Phaser.Scene, key: string, w: number, h: number, color: number,
  base: number, amp: number, bumps: number, phase: number,
): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(color, 1);
  for (let x = 0; x < w; x += 4) {
    const wave = 0.5 + 0.5 * Math.sin((2 * Math.PI * bumps * x) / w + phase);
    const top = Math.min(h, Math.round((base + amp * wave) / 2) * 2);
    g.fillRect(x, h - top, 4, top);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

/** A distant cafe and a small shop in silhouette, with warm lit windows. */
function cafeTexture(scene: Phaser.Scene, key: string, w: number, h: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const body = 0x2e1f3d;
  const roof = 0x3b2749;
  // Cafe: stepped roof, chimney, three windows, a door and an awning.
  g.fillStyle(body, 1).fillRect(40, 14, 64, 20);
  g.fillStyle(roof, 1).fillRect(36, 10, 72, 4).fillRect(44, 6, 56, 4).fillRect(52, 2, 40, 4);
  g.fillStyle(body, 1).fillRect(84, 0, 6, 4);
  g.fillStyle(0xb45a7a, 1).fillRect(40, 14, 64, 3);
  g.fillStyle(0xffcf6b, 1).fillRect(46, 20, 8, 8).fillRect(60, 20, 8, 8).fillRect(88, 20, 8, 8);
  g.fillStyle(0xe89a4a, 1).fillRect(72, 22, 10, 12);
  // Small shop further along.
  g.fillStyle(body, 1).fillRect(190, 20, 40, 14);
  g.fillStyle(roof, 1).fillRect(186, 16, 48, 4).fillRect(194, 12, 32, 4);
  g.fillStyle(0xffcf6b, 1).fillRect(196, 24, 8, 6).fillRect(214, 24, 8, 6);
  g.generateTexture(key, w, h);
  g.destroy();
}

export class StripScene extends Phaser.Scene {
  private sky!: Phaser.GameObjects.TileSprite;
  private moon!: Phaser.GameObjects.Image;
  private ground!: Phaser.GameObjects.TileSprite;
  /** Every scrolling layer (stars to ground) with its speed, so update() and resize loop over one list. */
  private layers: Phaser.GameObjects.TileSprite[] = [];
  private speeds: number[] = [];
  private reducedMotion = false;
  private motionQuery: MediaQueryList | null = null;
  private onMotionChange = (e: MediaQueryListEvent): void => {
    this.reducedMotion = e.matches;
  };
  private blinkTimer = 0;
  private tailTimer = 0;
  private tailUp = false;
  private heroKey = '';
  private hero!: Phaser.GameObjects.Image;
  private enemy!: Phaser.GameObjects.Image;
  private loop: GameLoop | null = null;
  private mode: 'walk' | 'fight' | 'die' = 'walk';
  private walkTimer = 0;
  private walkFrame = 0;
  private hitTimer = 0;
  private hits = 0;
  private dieTimer = 0;
  private lungeTimer = 0;

  constructor() {
    super('strip');
  }

  create(): void {
    this.loop = (this.registry.get('loop') as GameLoop | undefined) ?? null;
    for (const legs of [0, 1] as const) {
      for (const blink of [0, 1]) {
        for (const tail of [0, 1]) {
          pixelTexture(this, HERO_KEYS[legs * 4 + blink * 2 + tail]!, heroRows(legs, blink === 1, tail === 1), HERO_PALETTE);
        }
      }
    }
    pixelTexture(this, 'yarn', YARN, YARN_PALETTE);
    pixelTexture(this, 'moon', MOON, MOON_PALETTE);

    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.reducedMotion = this.motionQuery?.matches ?? false;
    this.motionQuery?.addEventListener('change', this.onMotionChange);

    const groundTop = STRIP_HEIGHT - GROUND_HEIGHT;

    // Dusk sky: horizontal bands from deep plum at the top to a warm glow at the horizon.
    const sky = this.make.graphics({ x: 0, y: 0 }, false);
    const bands = [0x1f1630, 0x2a1f40, 0x3a2a55, 0x55356a, 0x7a4478, 0xa85a7e, 0xd4747a];
    const bandH = Math.ceil(groundTop / bands.length);
    bands.forEach((c, i) => sky.fillStyle(c, 1).fillRect(0, i * bandH, 4, bandH));
    sky.generateTexture('sky', 4, groundTop);
    sky.destroy();

    const stars = this.make.graphics({ x: 0, y: 0 }, false);
    const dots: [number, number, number][] = [[10, 8, 2], [46, 22, 2], [78, 6, 2], [104, 30, 2], [124, 14, 2], [60, 40, 2], [20, 36, 2]];
    dots.forEach(([x, y, r]) => stars.fillStyle(0xfff3c4, 1).fillRect(x, y, r, r));
    stars.generateTexture('stars', 140, groundTop - 12);
    stars.destroy();

    // Three depth layers. Every texture is generated once and tiles seamlessly.
    hillsTexture(this, 'hills-far', 160, 26, 0x5a3a6e, 14, 12, 1, 0.4);
    hillsTexture(this, 'hills-near', 128, 14, 0x3a2c4e, 6, 8, 2, 1.3);
    cafeTexture(this, 'cafe', 320, 34);

    // Warm brown ground with a grass-like top edge.
    const tile = this.make.graphics({ x: 0, y: 0 }, false);
    tile.fillStyle(0x6b4a32, 1).fillRect(0, 0, 32, GROUND_HEIGHT);
    tile.fillStyle(0x7bb661, 1).fillRect(0, 0, 32, 4);
    tile.fillStyle(0x5c9a4a, 1).fillRect(4, 4, 3, 2).fillRect(14, 4, 3, 2).fillRect(25, 4, 3, 2);
    tile.fillStyle(0x553a26, 1).fillRect(6, 10, 4, 2).fillRect(20, 13, 4, 2).fillRect(13, 8, 3, 2);
    tile.generateTexture('ground', 32, GROUND_HEIGHT);
    tile.destroy();

    const w = this.scale.width;
    this.cameras.main.setBackgroundColor(0x1f1630);
    this.sky = this.add.tileSprite(0, 0, w, groundTop, 'sky').setOrigin(0, 0);
    this.addLayer(this.add.tileSprite(0, 0, w, groundTop - 12, 'stars').setOrigin(0, 0), STAR_SPEED);
    this.moon = this.add.image(w - 40, 22, 'moon').setOrigin(0.5, 0.5);
    this.addLayer(this.add.tileSprite(0, groundTop - 26, w, 26, 'hills-far').setOrigin(0, 0), FAR_HILLS_SPEED);
    this.addLayer(this.add.tileSprite(0, groundTop - 44, w, 34, 'cafe').setOrigin(0, 0), CAFE_SPEED);
    this.addLayer(this.add.tileSprite(0, groundTop - 14, w, 14, 'hills-near').setOrigin(0, 0), NEAR_HILLS_SPEED);
    this.ground = this.add.tileSprite(0, groundTop, w, GROUND_HEIGHT, 'ground').setOrigin(0, 0);
    this.addLayer(this.ground, GROUND_SPEED);
    this.heroKey = HERO_KEYS[0]!;
    this.hero = this.add.image(HERO_X, groundTop + 2, this.heroKey).setOrigin(0.5, 1);
    this.enemy = this.add.image(this.spawnX(), groundTop + 2, 'yarn').setOrigin(0.5, 1);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.motionQuery?.removeEventListener('change', this.onMotionChange);
    });
  }

  private addLayer(sprite: Phaser.GameObjects.TileSprite, speed: number): void {
    this.layers.push(sprite);
    this.speeds.push(speed);
  }

  private spawnX(): number {
    // Close enough to be on screen almost immediately, even on a wide strip.
    return Math.min(this.scale.width + 20, HERO_X + 240);
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.sky.width = size.width;
    for (let i = 0; i < this.layers.length; i++) this.layers[i]!.width = size.width;
    this.moon.x = size.width - 40;
    this.cameras.main.setSize(size.width, size.height);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 100) / 1000;
    const dtMs = Math.min(delta, 100);

    this.animateHero(dtMs);

    if (this.mode === 'walk') {
      if (!this.reducedMotion) {
        for (let i = 0; i < this.layers.length; i++) this.layers[i]!.tilePositionX += this.speeds[i]! * dt;
      }
      this.walkTimer += dtMs;
      if (this.walkTimer >= WALK_FRAME_MS) {
        this.walkTimer = 0;
        this.walkFrame = 1 - this.walkFrame;
      }
      this.enemy.x -= (GROUND_SPEED + ENEMY_SPEED) * dt;
      if (this.enemy.x <= HERO_X + FIGHT_GAP) {
        this.mode = 'fight';
        this.hitTimer = 0;
        this.hits = 0;
      }
      return;
    }

    if (this.mode === 'fight') {
      this.hitTimer += dtMs;
      if (this.lungeTimer > 0) {
        this.lungeTimer -= dtMs;
        if (this.lungeTimer <= 0) this.hero.x = HERO_X;
      }
      if (this.hitTimer >= HIT_EVERY_MS) {
        this.hitTimer = 0;
        this.hits += 1;
        this.hitEnemy();
        if (this.hits >= HITS_TO_KILL) {
          this.mode = 'die';
          this.dieTimer = DEATH_MS;
        }
      }
      return;
    }

    this.dieTimer -= dtMs;
    this.enemy.setAlpha(Math.floor(this.dieTimer / 50) % 2 === 0 ? 0.3 : 1);
    if (this.dieTimer <= 0) {
      this.enemy.setAlpha(1).clearTint().setScale(1);
      this.enemy.x = this.spawnX();
      this.hero.x = HERO_X;
      this.mode = 'walk';
    }
  }

  /** Pick Mochi's frame: leg pose from the walk cycle, plus a blink every ~2s and a 2-frame tail. */
  private animateHero(dtMs: number): void {
    let blink = 0;
    if (!this.reducedMotion) {
      this.blinkTimer = (this.blinkTimer + dtMs) % BLINK_EVERY_MS;
      blink = this.blinkTimer < BLINK_MS ? 1 : 0;
      this.tailTimer += dtMs;
      if (this.tailTimer >= TAIL_FRAME_MS) {
        this.tailTimer = 0;
        this.tailUp = !this.tailUp;
      }
    }
    const key = HERO_KEYS[this.walkFrame * 4 + blink * 2 + (this.tailUp ? 1 : 0)]!;
    if (key !== this.heroKey) {
      this.heroKey = key;
      this.hero.setTexture(key);
    }
  }

  /** One sword hit: Mochi lunges, the yarn flashes red and recoils, damage floats up. */
  private hitEnemy(): void {
    this.hero.x = HERO_X + 6;
    this.lungeTimer = 120;
    this.enemy.setTintFill(0xff4040);
    this.tweens.add({ targets: this.enemy, scaleX: 1.2, scaleY: 0.75, duration: SQUASH_MS, yoyo: true });
    this.enemy.x += 3;
    this.time.delayedCall(90, () => {
      this.enemy.clearTint();
      this.enemy.x -= 3;
    });
    const power = Math.round(this.loop?.getSnapshot().power ?? 10);
    const txt = this.add
      .text(this.enemy.x, this.enemy.y - this.enemy.height, `-${power}`, {
        fontFamily: "'Pixelify Sans', monospace", fontSize: '14px', color: '#ffe066', stroke: '#000', strokeThickness: 3,
      })
      .setOrigin(0.5, 1);
    this.tweens.add({
      targets: txt, y: txt.y - 18, alpha: 0, duration: 500, onComplete: () => txt.destroy(),
    });
  }
}
