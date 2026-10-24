import Phaser from 'phaser';
import { bakeCat, CLASS_LOOKS, type Anchors, type AnimName, type CatSheet } from '../game/rig';
import type { PreviewRow } from './previewGrid';

export const LABEL_W = 210;
export const HEADER_H = 22;
const GAP = 8;
const FRAME_LABEL_H = 14;

export interface PreviewData {
  rows: readonly PreviewRow[];
  anims: readonly AnimName[];
  zoom: number;
  anchors: boolean;
  light: boolean;
  /** Show every frame side by side, standing still, instead of playing each animation. */
  strip: boolean;
}

interface Cell {
  sprite: Phaser.GameObjects.Sprite;
  sheet: CatSheet;
  anim: AnimName;
  /** Fixed frame in strip mode; null while playing. */
  still: number | null;
  label: Phaser.GameObjects.Text;
  dots: Phaser.GameObjects.Graphics;
}

/** Grid columns: one per animation, or one per frame in strip mode. */
export function previewColumns(d: Pick<PreviewData, 'anims' | 'strip'>, framesOf: (a: AnimName) => number) {
  return d.anims.flatMap((anim) =>
    d.strip ? Array.from({ length: framesOf(anim) }, (_, i) => ({ anim, still: i as number | null })) : [{ anim, still: null }],
  );
}

export function previewSize(d: Pick<PreviewData, 'rows' | 'zoom'>, columns: number, frameW: number, frameH: number) {
  return {
    width: LABEL_W + columns * (frameW * d.zoom + GAP) + GAP,
    height: HEADER_H + d.rows.length * (frameH * d.zoom + FRAME_LABEL_H + GAP) + GAP,
  };
}

const ANCHOR_COLORS: Record<Exclude<keyof Anchors, 'gripAngle'>, number> = {
  head: 0xff5a5a, body: 0xffd75e, pawFront: 0x4ae0ff, pawBack: 0x2a8ab0,
  footFront: 0x6be08a, footBack: 0x2f9e50, grip: 0xff4ae0,
};

/** Grid of baked cats for the dev preview. Every cell is one sprite playing one animation. */
export class PreviewScene extends Phaser.Scene {
  private cells: Cell[] = [];
  private data0!: PreviewData;

  constructor() {
    super('preview');
  }

  init(data: PreviewData): void {
    this.data0 = data;
    this.cells = [];
  }

  create(): void {
    const d = this.data0;
    const text = d.light ? '#2a1a30' : '#fff3e0';
    this.cameras.main.setBackgroundColor(d.light ? '#fbf5ee' : '#2a1f36');
    const columns = (sheet: CatSheet) => previewColumns(d, (a) => sheet.anims[a].frames.length);
    d.rows.forEach((row, r) => {
      const sheet = bakeCat(this, CLASS_LOOKS[row.cls], row.visuals);
      const sheetW = sheet.frameW * d.zoom;
      const sheetH = sheet.frameH * d.zoom;
      const y = HEADER_H + r * (sheetH + FRAME_LABEL_H + GAP);
      this.add.text(8, y + sheetH / 2 - 8, row.label, { fontFamily: 'monospace', fontSize: '12px', color: text });
      columns(sheet).forEach(({ anim, still }, c) => {
        const x = LABEL_W + c * (sheetW + GAP);
        const sprite = this.add.sprite(x + sheet.origin.x * sheetW, y + sheet.origin.y * sheetH, sheet.key, `${anim}:${still ?? 0}`)
          .setOrigin(sheet.origin.x, sheet.origin.y)
          .setScale(d.zoom);
        const label = this.add.text(x, y + sheetH, '', { fontFamily: 'monospace', fontSize: '10px', color: text });
        const dots = this.add.graphics();
        const cell: Cell = { sprite, sheet, anim, still, label, dots };
        if (still === null) {
          sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => this.drawCell(cell, x, y));
          // Loop everything here, with a pause after one-shot animations, so they can be compared.
          sprite.play({ key: sheet.anims[anim].key, repeat: -1, repeatDelay: sheet.anims[anim].loop ? 0 : 500 });
        }
        this.cells.push(cell);
        this.drawCell(cell, x, y);
      });
      if (r === 0) {
        columns(sheet).forEach(({ anim, still }, c) => {
          const title = still === null ? anim : `${anim} ${still + 1}`;
          this.add.text(LABEL_W + c * (sheetW + GAP), 4, title, { fontFamily: 'monospace', fontSize: '12px', color: text });
        });
      }
    });
    window.__spritePreview = { ready: true, cells: this.cells.length, textures: new Set(this.cells.map((c) => c.sheet.key)).size };
  }

  private drawCell(cell: Cell, x: number, y: number): void {
    const frame = cell.sprite.anims.currentFrame;
    const index = cell.still ?? (frame ? frame.index - 1 : 0);
    const total = cell.sheet.anims[cell.anim].frames.length;
    const hit = cell.sheet.anims[cell.anim].hitFrames?.includes(index) ? ' hit' : '';
    cell.label.setText(`${index + 1}/${total}${hit}`);
    cell.dots.clear();
    if (!this.data0.anchors) return;
    const z = this.data0.zoom;
    const a = cell.sheet.anchors(cell.anim, index);
    for (const [name, color] of Object.entries(ANCHOR_COLORS)) {
      const p = a[name as keyof typeof ANCHOR_COLORS];
      cell.dots.fillStyle(color, 1).fillRect(x + p.x * z, y + p.y * z, z, z);
    }
    const rad = (a.gripAngle * Math.PI) / 180;
    cell.dots.lineStyle(1, ANCHOR_COLORS.grip, 0.8).lineBetween(
      x + (a.grip.x + 0.5) * z, y + (a.grip.y + 0.5) * z,
      x + (a.grip.x + 0.5 + Math.cos(rad) * 6) * z, y + (a.grip.y + 0.5 - Math.sin(rad) * 6) * z,
    );
  }

  setPlaying(playing: boolean): void {
    if (playing) this.anims.resumeAll();
    else this.anims.pauseAll();
  }

  step(): void {
    for (const c of this.cells) if (c.still === null) c.sprite.anims.nextFrame();
  }
}

declare global {
  interface Window {
    __spritePreview?: { ready: boolean; cells: number; textures: number };
  }
}
