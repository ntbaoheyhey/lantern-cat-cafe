import { useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import { v2 } from '@taskbar-hero/game-rules';
import { backdropFor } from '../art/backdrops';
import { BackdropView } from '../art/backdrops/BackdropView';
import { V2PixelFrame } from '../art/v2Frames';
import { usePrefersReducedMotion } from '../motion/reducedMotion';
import './ChapterMap.css';

export interface ChapterMapProps {
  chapters?: readonly v2.ChapterDef[];
  currentChapter: number;
  clearedChapters?: readonly number[] | Set<number>;
  round?: number;
  onSelect?: (chapterNumber: number) => void;
  /** Compact mode: only this chapter's card, no header or path (used under the chapter tabs). */
  selectedChapter?: number;
  /** Full-screen path; compact selected-card consumers retain their existing layout. */
  presentation?: 'path';
}

export const CHAPTER_THEME_COLORS: Record<number, { color: string; label: string }> = {
  1: { color: 'var(--accent, #ffb86b)', label: 'Living Room Amber' },
  2: { color: 'var(--good, #6be08a)', label: 'Kitchen Mint' },
  3: { color: 'var(--rarity-rare, #4aa8ff)', label: 'Bathroom Cyan' },
  4: { color: 'var(--rarity-epic, #bb74ff)', label: 'Basement Violet' },
  5: { color: 'var(--focus, #ffd75e)', label: 'Night Rooftops Gold' },
};

/** Pixel-art boss skull marker (16x16 SVG). */
export function BossMarkerIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="v2-map-boss-marker-svg"
    >
      <path d="M4 1h8v1h-8zM3 2h10v1h-10zM2 3h12v5h-12zM3 8h10v1h-10zM4 9h8v1h-8zM5 10h6v1h-6zM4 11h8v3h-8zM6 14h4v1h-4z" fill="#000000" />
      <path d="M4 2h8v1h-8zM3 3h10v5h-10zM4 8h8v1h-8zM5 9h6v1h-6zM6 10h4v1h-4zM5 11h6v2h-6zM7 13h2v1h-2z" fill="var(--bad, #ff6b6b)" />
      <path d="M4 4h3v3h-3zM9 4h3v3h-3z" fill="#000000" />
      <path d="M5 5h1v1h-1zM10 5h1v1h-1z" fill="var(--focus, #ffd75e)" />
      <path d="M5 11h1v2h-1zM7 11h2v1h-2zM10 11h1v2h-1z" fill="#ffffff" />
    </svg>
  );
}

/** Pixel-art checkmark icon for cleared chapters (16x16 SVG). */
export function CheckIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="v2-map-check-svg"
    >
      <path d="M13 3h2v2h-2zM12 5h1v2h-1zM11 7h1v2h-1zM10 9h1v2h-1zM9 11h1v2h-1zM8 12h1v2h-1zM7 13h1v1h-1zM6 12h1v1h-1zM5 10h1v2h-1zM4 8h1v2h-1zM3 7h1v1h-1zM2 6h1v1h-1zM1 5h1v1h-1z" fill="#000000" />
      <path d="M13 4h1v1h-1zM12 6h1v1h-1zM11 8h1v1h-1zM10 10h1v1h-1zM9 12h1v1h-1zM8 13h1v1h-1zM7 12h1v1h-1zM6 11h1v1h-1zM5 9h1v1h-1zM4 7h1v1h-1zM3 6h1v1h-1zM2 5h1v1h-1z" fill="var(--good, #6be08a)" />
    </svg>
  );
}

/** Resolves the display name of a chapter's boss. */
export function getBossName(c: v2.ChapterDef): string {
  if (!c.boss) return 'Chapter Boss';
  const monster = v2.MONSTERS.find((m) => m.id === c.boss);
  return monster?.name ?? c.boss;
}

/**
 * ChapterMap displays 5 chapter nodes on a winding pixel path with states:
 * - cleared: checkmark, gold border, reachable for rematch
 * - current: pulse animation (respects reduced motion), round n/10
 * - locked: padlock frame from v2Frames, aria-disabled with reason
 *
 * Fully accessible with aria-current on the current chapter, keyboard order 1..5,
 * and responsive vertical list mode at <= 390px with zero horizontal scroll.
 */
export function ChapterMap({
  chapters = v2.CHAPTERS,
  currentChapter,
  clearedChapters = [],
  round = 1,
  onSelect,
  selectedChapter,
  presentation,
}: ChapterMapProps) {
  const compact = selectedChapter !== undefined && presentation !== 'path';
  const shown = chapters;
  const prefersReducedMotion = usePrefersReducedMotion();

  const clearedSet = useMemo(() => {
    if (clearedChapters instanceof Set) return clearedChapters;
    return new Set(clearedChapters);
  }, [clearedChapters]);

  return (
    <nav className={`v2-chapter-map${compact ? ' v2-chapter-map--compact' : ''}${presentation === 'path' ? ' v2-chapter-map--path' : ''}`} aria-label="Chapter Map">
      {(
      <div className="v2-map-header">
        <h2 className="v2-map-title">World Map</h2>
        <span className="v2-map-subtitle">Cat Café Quest Chapters</span>
      </div>
      )}

      <div className="v2-map-canvas">
        {/* Winding pixel path background for desktop layout */}
        <svg
          className="v2-map-path-svg"
          viewBox="0 0 1000 520"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Black outer outline */}
          <path
            d="M 180 90 L 820 90 L 820 250 L 180 250 L 180 430 L 500 430"
            fill="none"
            stroke="#000000"
            strokeWidth="14"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          {/* Stepped cobblestone / path base */}
          <path
            d="M 180 90 L 820 90 L 820 250 L 180 250 L 180 430 L 500 430"
            fill="none"
            stroke="var(--border, #5b4572)"
            strokeWidth="8"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          {/* Pixel dash markings */}
          <path
            d="M 180 90 L 820 90 L 820 250 L 180 250 L 180 430 L 500 430"
            fill="none"
            stroke="var(--gold, #ffd34e)"
            strokeWidth="4"
            strokeDasharray="14 10"
            strokeLinecap="square"
          />
        </svg>

        <ol className="v2-map-list" role="list">
          {shown.map((c) => {
            const isCleared = clearedSet.has(c.index);
            const isCurrent = c.index === currentChapter;
            const isLocked = !isCleared && !isCurrent;
            const isRematch = isCleared;

            const themeInfo = CHAPTER_THEME_COLORS[c.index] ?? {
              color: 'var(--accent, #ffb86b)',
              label: 'Amber',
            };
            const bossName = getBossName(c);
            const maxRounds = c.roundsPerChapter ?? 10;
            const currentRound = Math.min(Math.max(round, 1), maxRounds);
            const lockedReasonId = `v2-map-locked-reason-${c.index}`;
            const lockedReasonText = `Locked: Complete Chapter ${c.index - 1} first to unlock`;

            const handleClick = () => {
              if (isLocked) return;
              onSelect?.(c.index);
            };

            const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
              if (isLocked && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
              }
            };

            // Build class list: include 'pulse' on current node when reduced motion is NOT requested
            const classNames = [
              'v2-map-node',
              `v2-map-node--ch${c.index}`,
              isCleared ? 'v2-map-node--cleared' : '',
              isCurrent ? 'v2-map-node--current' : '',
              isCurrent && !prefersReducedMotion ? 'pulse' : '',
              isRematch ? 'v2-map-node--rematch' : '',
              isLocked ? 'v2-map-node--locked dimmed' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={c.id || c.index} className={`v2-map-item v2-map-item--ch${c.index}${c.index === selectedChapter ? ' v2-map-item--selected' : ''}`}>
                <button
                  type="button"
                  className={classNames}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-pressed={presentation === 'path' ? c.index === selectedChapter : undefined}
                  aria-disabled={isLocked ? true : undefined}
                  aria-describedby={isLocked ? lockedReasonId : undefined}
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                  style={
                    {
                      '--chapter-theme': themeInfo.color,
                    } as CSSProperties
                  }
                  data-chapter={c.index}
                  data-state={isLocked ? 'locked' : isCurrent ? 'current' : 'cleared'}
                >
                  {/* Theme colour indicator */}
                  <div
                    className="v2-map-theme-bar"
                    style={{ backgroundColor: themeInfo.color }}
                    aria-hidden="true"
                  />

                  {/* Room thumbnail */}
                  <div
                    className={`v2-map-thumb ${isLocked ? 'dimmed' : ''}`}
                    aria-hidden="true"
                  >
                    <BackdropView
                      art={backdropFor(c.index)}
                      width={64}
                      layers="both"
                    />
                  </div>

                  {/* Main node card content */}
                  <div className="v2-map-node-content">
                    <div className="v2-map-node-top">
                      <span className="v2-map-chapter-num">CH. {c.index}</span>
                      <span
                        className="v2-map-theme-dot"
                        style={{ backgroundColor: themeInfo.color }}
                        title={`Theme: ${themeInfo.label}`}
                        aria-hidden="true"
                      />
                      {isCleared && (
                        <span className="v2-map-cleared-badge" title="Chapter Cleared">
                          <CheckIcon />
                        </span>
                      )}
                    </div>

                    <h3 className="v2-map-chapter-name">{c.name}</h3>

                    <div className="v2-map-boss-row">
                      <span className="v2-map-boss-marker-wrap" title="Chapter Boss">
                        <BossMarkerIcon />
                      </span>
                      <span className="v2-map-boss-label">Boss:</span>
                      <span className="v2-map-boss-name">{bossName}</span>
                    </div>

                    {/* State-specific badges and notices */}
                    <div className="v2-map-status-footer">
                      {isCurrent && (
                        <span className="v2-map-badge v2-map-badge--round" data-testid="round-indicator">
                          Round {currentRound}/{maxRounds}
                        </span>
                      )}

                      {isRematch && (
                        <span className="v2-map-badge v2-map-badge--rematch" data-testid="rematch-badge">
                          Rematch
                        </span>
                      )}

                      {isLocked && (
                        <div className="v2-map-lock-display">
                          <span className="v2-map-padlock" aria-hidden="true">
                            <V2PixelFrame name="lockedSlot" size={2} title="Locked Padlock" />
                          </span>
                          <span id={lockedReasonId} className="v2-map-locked-text">
                            {lockedReasonText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
