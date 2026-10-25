import React from 'react';
import { v2 } from '@taskbar-hero/game-rules';

export interface ProgressChipProps {
  chapter: number;
  round: number;
  kills: number;
  killsPerRound: number;
}

export function ProgressChip({ chapter, round, kills, killsPerRound }: ProgressChipProps) {
  const chapterDef = v2.CHAPTERS.find((c) => c.index === chapter);
  const chapterName = chapterDef?.name ?? `Chapter ${chapter}`;
  const roundsPerChapter = chapterDef?.roundsPerChapter ?? 10;

  const accessibleName = `Chapter ${chapter} ${chapterName}, round ${round} of ${roundsPerChapter}, ${kills} of ${killsPerRound} monsters`;

  return (
    <div
      className="hud-chip hud-progress-chip"
      role="group"
      aria-label={accessibleName}
      title={chapterName}
    >
      <span aria-hidden="true" className="hud-progress-text">
        Chapter {chapter} · Round {round} · {kills}/{killsPerRound}
      </span>
    </div>
  );
}
