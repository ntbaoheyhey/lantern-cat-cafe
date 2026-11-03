import React from 'react';
import { useMotionCue } from '../../motion/useMotionCue';
import { formatAmount } from '../loot/lootLines';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

export interface LevelXpBarProps {
  level: number;
  xp: number;
  xpToNext: number;
}

export function LevelXpBar({ level, xp, xpToNext }: LevelXpBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const levelCue = useMotionCue<HTMLSpanElement>(level, 'level');

  const clampedXp = Math.max(0, xp);
  const ratio = xpToNext > 0 ? clampedXp / xpToNext : 0;
  const pct = Math.min(100, Math.max(0, ratio * 100));

  const valueText = `${formatAmount(xp)} / ${formatAmount(xpToNext)} XP`;

  return (
    <div className="hud-level-xp" data-testid="hud-level-xp">
      <span ref={levelCue} className="hud-level-badge motion-cue">Lv {level}</span>
      <div
        className="hud-xp-track"
        role="progressbar"
        aria-label="Experience"
        aria-valuemin={0}
        aria-valuemax={xpToNext}
        aria-valuenow={xp}
        aria-valuetext={valueText}
      >
        <div
          className={`hud-xp-fill ${prefersReducedMotion ? 'hud-xp-fill--reduced-motion' : 'hud-xp-fill--animated'}`}
          style={{
            width: `${pct}%`,
            ...(prefersReducedMotion ? { transition: 'none' } : {}),
          }}
        />
      </div>
      <span className="hud-xp-text" aria-hidden="true">{valueText}</span>
    </div>
  );
}
