import type { ReactNode } from 'react';
import { CONFIG } from '@taskbar-hero/game-rules';
import './art2.css';

export const ART2_QUALITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export const ART2_SKILLS = ['seamsweep', 'kettlepulse', 'hempair', 'windowthrust', 'rafterecho', 'lanternarc', 'mossparcel'] as const;
export const ART2_STATES = ['bag-empty', 'market-empty', 'forge-no-materials', 'no-wallet', 'offline', 'landing'] as const;
export type Art2Quality = typeof ART2_QUALITIES[number];
export type Art2Skill = typeof ART2_SKILLS[number];
export type Art2State = typeof ART2_STATES[number];
export type Art2Id = `${'rune' | 'pet'}-${'frame' | 'slot'}-${Art2Quality}` | `skill-frame-${Art2Skill}` | Art2State;

/** Decorative art only. The existing shared flag is the sole runtime gate. */
export function Art2Image({ id, scale = 1, eager = false }: { id: Art2Id; scale?: 1 | 2; eager?: boolean }) {
  if (!CONFIG.features.originalEconomy) return null;
  const native = (ART2_STATES as readonly string[]).includes(id) ? 96 : 48;
  return <img className="art2-image" data-art2={id} src={`/ui-art2/${id}.png`} alt="" aria-hidden="true"
    width={native * scale} height={native * scale} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

export function Art2Frame({ id, children }: { id: Exclude<Art2Id, Art2State>; children: ReactNode }) {
  if (!CONFIG.features.originalEconomy) return null;
  return <span className="art2-frame"><Art2Image id={id} scale={2} /><span className="art2-frame-content">{children}</span></span>;
}
