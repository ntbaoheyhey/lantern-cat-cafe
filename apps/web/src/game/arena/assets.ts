import type Phaser from 'phaser';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import type { MonsterAnim, MonsterArt } from '../../art/monsters';
import { monsterPilotArt } from '../../art/monsters';
import type { EquippedVisuals, VisibleSlot } from '../rig';

export function equippedVisuals(state: ServerStateV2): EquippedVisuals {
  const out: Partial<Record<VisibleSlot, { set: string; rarity: v2.GearRarityId }>> = {};
  for (const item of state.inventory.filter(item => state.equipped[item.slot] === item.id)) {
    if (!['weapon', 'helmet', 'armor', 'gloves', 'boots'].includes(item.slot)) continue;
    const def = v2.ITEMS.find(def => def.id === item.itemKey);
    if (def) out[item.slot as VisibleSlot] = { set: def.visual.set, rarity: item.rarity };
  }
  return out;
}

const bakedMonsterCanvases = new Map<string, HTMLCanvasElement>();

/** Pre-render and cache sprite sheet onto an offscreen canvas using fast typed-array rasterization. */
function getBakedMonsterCanvas(activeArt: MonsterArt, anim: MonsterAnim, frames: readonly (readonly string[])[]): HTMLCanvasElement {
  const cacheKey = `${activeArt.id}:${anim}`;
  const hit = bakedMonsterCanvases.get(cacheKey);
  if (hit) return hit;

  const totalW = activeArt.size.w * frames.length;
  const totalH = activeArt.size.h;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : ({} as HTMLCanvasElement);
  if (!canvas.getContext) return canvas;
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(totalW, totalH);
  const data32 = new Uint32Array(imgData.data.buffer);

  // Precompute 32-bit little-endian ABGR colors for the palette.
  const pal32: Record<string, number> = {};
  for (const [k, v] of Object.entries(activeArt.palette)) {
    pal32[k] = (0xFF000000 | ((v & 0xFF) << 16) | (v & 0x00FF00) | ((v >> 16) & 0xFF)) >>> 0;
  }

  for (let f = 0; f < frames.length; f++) {
    const rows = frames[f]!;
    const frameOffset = f * activeArt.size.w;
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y]!;
      const rowOffset = y * totalW + frameOffset;
      for (let x = 0; x < row.length; x++) {
        const px = row[x]!;
        if (px !== '.') {
          data32[rowOffset + x] = pal32[px]!;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bakedMonsterCanvases.set(cacheKey, canvas);
  return canvas;
}

interface BakeTask {
  art: MonsterArt;
  anim: MonsterAnim;
  frames: readonly (readonly string[])[];
}

const bakeQueue: BakeTask[] = [];
let isProcessingQueue = false;

function scheduleNextBake(): void {
  if (bakeQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  isProcessingQueue = true;
  const runner = (deadline?: IdleDeadline) => {
    const startTime = performance.now();
    while (bakeQueue.length > 0) {
      if (deadline && deadline.timeRemaining() <= 1 && performance.now() - startTime >= 4) break;
      if (performance.now() - startTime >= 8) break;
      const task = bakeQueue.shift()!;
      getBakedMonsterCanvas(task.art, task.anim, task.frames);
    }
    if (bakeQueue.length > 0) {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(runner, { timeout: 250 });
      } else if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => runner());
      } else {
        setTimeout(runner, 16);
      }
    } else {
      isProcessingQueue = false;
    }
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(runner, { timeout: 250 });
  } else if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => runner());
  } else {
    setTimeout(runner, 16);
  }
}

/** Preload and pre-bake monster animations ahead of time into offscreen canvas cache using time slicing. */
export function queuePreloadMonsterArt(art: MonsterArt): void {
  const activeArt = monsterPilotArt(art.id) ?? art;
  for (const anim of ['idle', 'walk', 'windup', 'attack', 'hit', 'defeat'] as const) {
    const frames = activeArt.frames[anim] ?? activeArt.frames.idle ?? activeArt.frames.walk!;
    const cacheKey = `${activeArt.id}:${anim}`;
    if (!bakedMonsterCanvases.has(cacheKey)) {
      bakeQueue.push({ art: activeArt, anim, frames });
    }
  }
  if (!isProcessingQueue) scheduleNextBake();
}

export function preloadMonsterArt(art: MonsterArt): void {
  queuePreloadMonsterArt(art);
}

/** Bake the existing authored monster frames; zero duplicate canvas allocations when addCanvas is available. */
export function bakeMonster(scene: Phaser.Scene, art: MonsterArt): Record<MonsterAnim, string> {
  const activeArt = monsterPilotArt(art.id) ?? art;
  const keys = {} as Record<MonsterAnim, string>;
  for (const anim of ['idle', 'walk', 'windup', 'attack', 'hit', 'defeat'] as const) {
    const frames = activeArt.frames[anim] ?? activeArt.frames.idle ?? activeArt.frames.walk!;
    const key = `monster:${activeArt.id}:${anim}`;
    keys[anim] = key;
    if (!scene.textures.exists(key)) {
      const cached = getBakedMonsterCanvas(activeArt, anim, frames);
      const texture = scene.textures.addCanvas ? scene.textures.addCanvas(key, cached) : scene.textures.createCanvas(key, activeArt.size.w * frames.length, activeArt.size.h);
      if (texture) {
        if (!scene.textures.addCanvas && cached && cached.width && texture.context) {
          texture.context.drawImage(cached, 0, 0);
        }
        frames.forEach((_, frame) => {
          texture.add(String(frame), 0, frame * activeArt.size.w, 0, activeArt.size.w, activeArt.size.h);
        });
        texture.refresh();
      }
    }
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: frames.map((_, frame) => ({ key, frame: String(frame) })),
        frameRate: anim === 'defeat' ? 10 : 8,
        repeat: anim === 'idle' || anim === 'walk' ? -1 : 0,
      });
    }
  }
  return keys;
}
