import Phaser from 'phaser';

export const STRIP_HEIGHT = 64;
const GROUND_HEIGHT = 14;
const HERO_X = 56;
const GROUND_SPEED = 60; // px per second the world scrolls left
const ENEMY_SPEED = 30; // extra px per second the enemy moves left
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

const HERO_PALETTE = { h: 0xf2c9a0, a: 0x3b6fd4, d: 0x24437f, s: 0xcfd6e4, k: 0x3a2a1a };
const HERO_A = [
  '..kkkk..',
  '.khhhhk.',
  '.hhhhhh.',
  '..aaaa..',
  '.saaaad.',
  '.saaaad.',
  '..dddd..',
  '..d..d..',
  '.dd..dd.',
];
const HERO_B = [
  '..kkkk..',
  '.khhhhk.',
  '.hhhhhh.',
  '..aaaa..',
  '.saaaad.',
  '.saaaad.',
  '..dddd..',
  '...dd...',
  '...dd...',
];
const SLIME_PALETTE = { g: 0x5cc26b, d: 0x2f7d3b, w: 0xffffff, k: 0x111111 };
const SLIME = [
  '..........',
  '...gggg...',
  '..gggggg..',
  '.ggwkggwkg',
  '.gggggggg.',
  'dgggggggggd',
  '.dddddddd.',
].map((r) => r.padEnd(10, '.').slice(0, 10));

export class StripScene extends Phaser.Scene {
  private ground!: Phaser.GameObjects.TileSprite;
  private hero!: Phaser.GameObjects.Image;
  private enemy!: Phaser.GameObjects.Image;
  private walkTimer = 0;
  private walkFrame = 0;
  private hitFlash = 0;

  constructor() {
    super('strip');
  }

  create(): void {
    pixelTexture(this, 'hero-a', HERO_A, HERO_PALETTE);
    pixelTexture(this, 'hero-b', HERO_B, HERO_PALETTE);
    pixelTexture(this, 'slime', SLIME, SLIME_PALETTE);

    const tile = this.make.graphics({ x: 0, y: 0 }, false);
    tile.fillStyle(0x4a3b2a, 1).fillRect(0, 0, 32, GROUND_HEIGHT);
    tile.fillStyle(0x5e9c4a, 1).fillRect(0, 0, 32, 4);
    tile.fillStyle(0x3a2d20, 1).fillRect(6, 8, 4, 2).fillRect(20, 6, 4, 2);
    tile.generateTexture('ground', 32, GROUND_HEIGHT);
    tile.destroy();

    const w = this.scale.width;
    const groundTop = STRIP_HEIGHT - GROUND_HEIGHT;
    this.cameras.main.setBackgroundColor(0x1d2433);
    this.ground = this.add.tileSprite(0, groundTop, w, GROUND_HEIGHT, 'ground').setOrigin(0, 0);
    this.hero = this.add.image(HERO_X, groundTop + 2, 'hero-a').setOrigin(0.5, 1);
    this.enemy = this.add.image(w + 20, groundTop + 2, 'slime').setOrigin(0.5, 1);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.ground.width = size.width;
    this.cameras.main.setSize(size.width, size.height);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 100) / 1000;
    this.ground.tilePositionX += GROUND_SPEED * dt;

    this.walkTimer += delta;
    if (this.walkTimer >= WALK_FRAME_MS) {
      this.walkTimer = 0;
      this.walkFrame = 1 - this.walkFrame;
      this.hero.setTexture(this.walkFrame === 0 ? 'hero-a' : 'hero-b');
    }

    if (this.hitFlash > 0) {
      this.hitFlash -= delta;
      this.enemy.setAlpha(Math.floor(this.hitFlash / 50) % 2 === 0 ? 0.3 : 1);
      if (this.hitFlash <= 0) this.respawnEnemy();
      return;
    }

    this.enemy.x -= (GROUND_SPEED + ENEMY_SPEED) * dt;
    if (this.enemy.x <= HERO_X + 22) {
      this.hitFlash = 300; // placeholder "fight": flash, then a new enemy appears
    }
  }

  private respawnEnemy(): void {
    this.enemy.setAlpha(1);
    this.enemy.x = this.scale.width + 20;
  }
}
