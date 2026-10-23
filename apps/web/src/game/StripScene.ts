import Phaser from 'phaser';
import type { GameLoop } from './gameState';

export const STRIP_HEIGHT = 96;
const GROUND_HEIGHT = 18;
const HERO_X = 56;
const GROUND_SPEED = 60; // px per second the world scrolls left
const STAR_SPEED = 6; // the stars drift slowly
const ENEMY_SPEED = 30; // extra px per second the enemy moves left
const FIGHT_GAP = 36; // cat-to-yarn distance while fighting
const HIT_EVERY_MS = 320;
const HITS_TO_KILL = 5;
const DEATH_MS = 300;
const WALK_FRAME_MS = 180;

const PX = 3; // one art pixel is 3 screen pixels

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

// Mochi, an orange tabby with a tiny sword. Two walk frames differ only in the legs (last two rows).
const HERO_PALETTE = {
  o: 0xf0a040, d: 0xc66a1a, w: 0xfff0d8, k: 0x2a1a10, n: 0xff8fb1, s: 0xdfe6f2, g: 0x7a5a3a,
};
const HERO_TOP = [
  '.d....d...s.',
  '.oooooo...s.',
  '.okooko...s.',
  '.owwnww...s.',
  '..owwo...gg.',
  '.ooooooogg..',
  'doododoo.o..',
  'doooooooo...',
];
const HERO_A = [...HERO_TOP, '.ow.wo.wo...', '.dd.dd.dd...'];
const HERO_B = [...HERO_TOP, '..ow.wo.wo..', '..dd.dd.dd..'];

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

export class StripScene extends Phaser.Scene {
  private sky!: Phaser.GameObjects.TileSprite;
  private stars!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.TileSprite;
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
    pixelTexture(this, 'hero-a', HERO_A, HERO_PALETTE);
    pixelTexture(this, 'hero-b', HERO_B, HERO_PALETTE);
    pixelTexture(this, 'yarn', YARN, YARN_PALETTE);

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
    this.stars = this.add.tileSprite(0, 0, w, groundTop - 12, 'stars').setOrigin(0, 0);
    this.ground = this.add.tileSprite(0, groundTop, w, GROUND_HEIGHT, 'ground').setOrigin(0, 0);
    this.hero = this.add.image(HERO_X, groundTop + 2, 'hero-a').setOrigin(0.5, 1);
    this.enemy = this.add.image(this.spawnX(), groundTop + 2, 'yarn').setOrigin(0.5, 1);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  private spawnX(): number {
    // Close enough to be on screen almost immediately, even on a wide strip.
    return Math.min(this.scale.width + 20, HERO_X + 240);
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.sky.width = size.width;
    this.stars.width = size.width;
    this.ground.width = size.width;
    this.cameras.main.setSize(size.width, size.height);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 100) / 1000;
    const dtMs = Math.min(delta, 100);

    if (this.mode === 'walk') {
      this.ground.tilePositionX += GROUND_SPEED * dt;
      this.stars.tilePositionX += STAR_SPEED * dt;
      this.walkTimer += dtMs;
      if (this.walkTimer >= WALK_FRAME_MS) {
        this.walkTimer = 0;
        this.walkFrame = 1 - this.walkFrame;
        this.hero.setTexture(this.walkFrame === 0 ? 'hero-a' : 'hero-b');
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
      this.enemy.setAlpha(1).clearTint();
      this.enemy.x = this.spawnX();
      this.hero.x = HERO_X;
      this.mode = 'walk';
    }
  }

  /** One sword hit: Mochi lunges, the yarn flashes red and recoils, damage floats up. */
  private hitEnemy(): void {
    this.hero.x = HERO_X + 6;
    this.lungeTimer = 120;
    this.enemy.setTintFill(0xff4040);
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
