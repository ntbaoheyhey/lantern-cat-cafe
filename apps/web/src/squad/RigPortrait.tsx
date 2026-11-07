import { useMemo } from 'react';
import { buildSheet, CLASS_LOOKS } from '../game/rig';
import { sheetCanvas } from '../game/rig/bake';
import type { squad } from '@taskbar-hero/game-rules';

const cache = new Map<string, string>();
export function RigPortrait({ role, name }: { role: squad.HeroRole; name: string }) {
  const url = useMemo(() => {
    const existing = cache.get(role); if (existing) return existing;
    const { image } = buildSheet(CLASS_LOOKS[role], {}), frame = image.frames.find(f => f.name === 'idle:0')!;
    const sheet = sheetCanvas(image, 1), canvas = document.createElement('canvas');
    canvas.width = image.frameW; canvas.height = image.frameH;
    canvas.getContext('2d')?.drawImage(sheet, frame.x, frame.y, image.frameW, image.frameH, 0, 0, image.frameW, image.frameH);
    const data = canvas.toDataURL(); cache.set(role, data); return data;
  }, [role]);
  return <img className="squad-portrait" src={url} alt={`${name}, ${role}`} />;
}
