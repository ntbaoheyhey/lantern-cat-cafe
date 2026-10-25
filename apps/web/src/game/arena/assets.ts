import type Phaser from 'phaser';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import type { MonsterAnim, MonsterArt } from '../../art/monsters';
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
/** Bake the existing authored monster frames; no art is generated or modified. */
export function bakeMonster(scene: Phaser.Scene, art: MonsterArt): Record<MonsterAnim, string> {
  const keys = {} as Record<MonsterAnim, string>;
  for (const anim of ['idle', 'walk', 'windup', 'attack', 'hit', 'defeat'] as const) {
    const frames = art.frames[anim] ?? art.frames.idle ?? art.frames.walk!;
    const key = `monster:${art.id}:${anim}`;
    keys[anim] = key;
    if (!scene.textures.exists(key)) {
      const texture = scene.textures.createCanvas(key, art.size.w * frames.length, art.size.h)!;
      const ctx = texture.context;
      frames.forEach((rows, frame) => {
        rows.forEach((row, y) => [...row].forEach((pixel, x) => {
          if (pixel === '.') return;
          ctx.fillStyle = `#${art.palette[pixel]!.toString(16).padStart(6, '0')}`;
          ctx.fillRect(frame * art.size.w + x, y, 1, 1);
        }));
        texture.add(String(frame), 0, frame * art.size.w, 0, art.size.w, art.size.h);
      });
      texture.refresh();
    }
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: frames.map((_, frame) => ({ key, frame: String(frame) })), frameRate: anim === 'defeat' ? 10 : 8, repeat: anim === 'idle' || anim === 'walk' ? -1 : 0 });
  }
  return keys;
}
