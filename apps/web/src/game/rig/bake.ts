import type Phaser from 'phaser';
import { composeFrame, FRAME, FRAME_ORIGIN } from './compose';
import { animsFor } from './poses';
import { ANIM_NAMES, VISIBLE_SLOTS, type AnimName, type Anchors, type ClassLook, type EquippedVisuals } from './types';

/*
 * bakeCat draws a dressed cat once into one texture (one named frame per animation frame) and
 * registers its Phaser animations. Fights then draw one image per frame instead of eight layers.
 * Nothing is built at import: a class's frames are made the first time that class is baked.
 */

export interface CatAnim {
  /** Phaser animation key: sprite.play(anim.key). */
  readonly key: string;
  readonly frames: readonly string[];
  readonly frameMs: readonly number[];
  readonly loop: boolean;
  readonly hitFrames?: readonly number[];
}

export interface CatSheet {
  /** Texture key. Same inputs give the same key. */
  readonly key: string;
  /** Scale the frames were drawn at (1 = one art pixel per texture pixel). */
  readonly px: number;
  /** Frame size in art pixels (multiply by px for texture pixels). */
  readonly frameW: number;
  readonly frameH: number;
  /** Sprite origin that puts the cat's feet on the sprite's position: sprite.setOrigin(origin.x, origin.y). */
  readonly origin: { readonly x: number; readonly y: number };
  readonly anims: Readonly<Record<AnimName, CatAnim>>;
  /** Anchors of one frame in frame art pixels (origin top-left of the frame), for effects and projectiles. */
  anchors(anim: AnimName, index: number): Anchors;
}

/** The pixels of a whole sheet at 1x: frames laid out in a grid, row-major colours (-1 transparent). */
export interface SheetImage {
  readonly width: number;
  readonly height: number;
  readonly pixels: Int32Array;
  readonly frames: readonly { readonly name: string; readonly x: number; readonly y: number }[];
  readonly frameW: number;
  readonly frameH: number;
}

/** Where sheets go. The Phaser one is phaserTextures(); tests use a fake. */
export interface TextureSink {
  has(key: string): boolean;
  add(key: string, image: SheetImage, px: number): void;
}
export interface AnimSink {
  exists(key: string): boolean;
  create(config: Phaser.Types.Animations.Animation): unknown;
}

const SHEET_COLUMNS = 8;

/** Stable texture key for a look, its visible gear and the scale. */
export function catTextureKey(look: ClassLook, gear: EquippedVisuals, px = 1): string {
  const parts = VISIBLE_SLOTS.map((slot) => {
    const v = gear[slot];
    return v ? `${slot}=${v.set}.${v.rarity}` : '';
  }).filter(Boolean);
  return `cat2:${look.id}:${hash(JSON.stringify(look))}:${px}:${parts.join('|') || 'bare'}`;
}

/** FNV-1a, enough to tell two edited looks with the same id apart in the dev preview. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

/** Compose every frame of every animation into one sheet image. */
export function buildSheet(look: ClassLook, gear: EquippedVisuals): { image: SheetImage; anchors: Map<string, Anchors> } {
  const anims = animsFor(look.weaponType);
  const list: { name: string; anim: AnimName; i: number }[] = [];
  for (const anim of ANIM_NAMES) anims[anim].frames.forEach((_, i) => list.push({ name: `${anim}:${i}`, anim, i }));
  const cols = Math.min(SHEET_COLUMNS, list.length);
  const rows = Math.ceil(list.length / cols);
  const width = cols * FRAME.w;
  const height = rows * FRAME.h;
  const pixels = new Int32Array(width * height).fill(-1);
  const anchors = new Map<string, Anchors>();
  const frames = list.map(({ name, anim, i }, n) => {
    const fx = (n % cols) * FRAME.w;
    const fy = Math.floor(n / cols) * FRAME.h;
    const f = composeFrame(look, gear, anim, i);
    for (let y = 0; y < FRAME.h; y++) pixels.set(f.pixels.subarray(y * FRAME.w, (y + 1) * FRAME.w), (fy + y) * width + fx);
    anchors.set(name, toFrame(f.anchors));
    return { name, x: fx, y: fy };
  });
  return { image: { width, height, pixels, frames, frameW: FRAME.w, frameH: FRAME.h }, anchors };
}

function toFrame(a: Anchors): Anchors {
  const m = (p: { x: number; y: number }) => ({ x: p.x + FRAME.cellX, y: p.y + FRAME.cellY });
  return {
    head: m(a.head), body: m(a.body), pawFront: m(a.pawFront), pawBack: m(a.pawBack),
    footFront: m(a.footFront), footBack: m(a.footBack), grip: m(a.grip), gripAngle: a.gripAngle,
  };
}

const caches = new WeakMap<TextureSink, Map<string, CatSheet>>();

/** Bake into any sink. Returns the cached sheet when the same look and gear were baked before. */
export function bakeCatInto(
  textures: TextureSink, anims: AnimSink | null, look: ClassLook, gear: EquippedVisuals, px = 1,
): CatSheet {
  let cache = caches.get(textures);
  if (!cache) caches.set(textures, (cache = new Map()));
  const key = catTextureKey(look, gear, px);
  const hit = cache.get(key);
  if (hit && textures.has(key)) return hit;

  const { image, anchors } = buildSheet(look, gear);
  if (!textures.has(key)) textures.add(key, image, px);
  const defs = animsFor(look.weaponType);
  const out = {} as Record<AnimName, CatAnim>;
  for (const name of ANIM_NAMES) {
    const def = defs[name];
    const frames = def.frames.map((_, i) => `${name}:${i}`);
    const anim: CatAnim = {
      key: `${key}#${name}`, frames, frameMs: def.frameMs, loop: def.loop,
      ...(def.hitFrames ? { hitFrames: def.hitFrames } : {}),
    };
    out[name] = anim;
    if (anims && !anims.exists(anim.key)) {
      anims.create({
        key: anim.key,
        // Each frame's own duration replaces the animation's frame rate (Phaser 3.60+).
        frames: frames.map((frame, i) => ({ key, frame, duration: def.frameMs[i] })),
        repeat: def.loop ? -1 : 0,
      });
    }
  }
  const sheet: CatSheet = {
    key, px, frameW: FRAME.w, frameH: FRAME.h, origin: FRAME_ORIGIN, anims: out,
    anchors(anim, index) {
      const a = anchors.get(`${anim}:${index}`);
      if (!a) throw new Error(`rig: ${key} has no frame ${anim}:${index}`);
      return a;
    },
  };
  cache.set(key, sheet);
  return sheet;
}

const sinks = new WeakMap<Phaser.Textures.TextureManager, TextureSink>();

/** Texture sink for a Phaser game: draws the sheet into a canvas texture with named frames. */
export function phaserTextures(textures: Phaser.Textures.TextureManager): TextureSink {
  let sink = sinks.get(textures);
  if (sink) return sink;
  sink = {
    has: (key) => textures.exists(key),
    add(key, image, px) {
      const canvas = sheetCanvas(image, px);
      const tex = textures.addCanvas(key, canvas);
      if (!tex) throw new Error(`rig: could not add texture ${key}`);
      for (const f of image.frames) tex.add(f.name, 0, f.x * px, f.y * px, image.frameW * px, image.frameH * px);
    },
  };
  sinks.set(textures, sink);
  return sink;
}

/** Paint a sheet into a canvas, each art pixel as a px x px square. */
export function sheetCanvas(image: SheetImage, px: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width * px;
  canvas.height = image.height * px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('rig: no 2d canvas');
  const data = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    const sy = Math.floor(y / px) * image.width;
    for (let x = 0; x < canvas.width; x++) {
      const c = image.pixels[sy + Math.floor(x / px)]!;
      if (c === -1) continue;
      const o = (y * canvas.width + x) * 4;
      data.data[o] = (c >> 16) & 0xff;
      data.data[o + 1] = (c >> 8) & 0xff;
      data.data[o + 2] = c & 0xff;
      data.data[o + 3] = 0xff;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/** Bake a dressed cat for a scene and register its animations. Cached per game. */
export function bakeCat(scene: Phaser.Scene, look: ClassLook, gear: EquippedVisuals = {}, px = 1): CatSheet {
  return bakeCatInto(phaserTextures(scene.textures), scene.anims, look, gear, px);
}
