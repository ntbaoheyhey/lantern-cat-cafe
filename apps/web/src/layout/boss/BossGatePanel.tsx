import type { CSSProperties } from 'react';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { PixelIcon } from '../../art/pixelIcons';
import { CHAPTER_THEME_COLORS } from '../../map/ChapterMap';
import {
  bossGateStatus,
  bossLabel,
  fightableChapters,
  formatCountdown,
  type BossGateStatusV2,
} from './bossGate';
import { BossPortrait } from './BossPortrait';
import './boss.css';

export interface BossGatePanelProps {
  state: ServerStateV2;
  /** Chapter shown; the parent keeps it. */
  chapter: number;
  /** Server-clock seconds; the parent re-renders every second while a cooldown runs. */
  nowS: number;
  /** True while a fight request is in flight. */
  busy: boolean;
  onFight: (chapter: number) => void;
  onSelectChapter: (chapter: number) => void;
}

function formatNotReached(
  status: Extract<BossGateStatusV2, { kind: 'not_reached' }>,
): string {
  if (status.roundsLeft === -1 && status.killsLeft === -1) {
    return `Beat the chapter ${status.chapter - 1} boss first.`;
  }
  const monstersStr = `${status.killsLeft} more monster${status.killsLeft === 1 ? '' : 's'}`;
  if (status.roundsLeft === 0) {
    return `Clear ${monstersStr} to reach the boss.`;
  }
  const roundsStr = `${status.roundsLeft} more round${status.roundsLeft === 1 ? '' : 's'}`;
  return `Clear ${roundsStr} and ${monstersStr} to reach the boss.`;
}

function getLiveAnnouncement(status: BossGateStatusV2): string {
  switch (status.kind) {
    case 'ready':
      return status.rematch ? 'Rematch ready' : 'Fight ready';
    case 'cooldown':
      return 'Catnap cooldown';
    case 'not_reached':
      return 'Chapter not reached';
    case 'no_key':
      return 'Cat Key required';
    case 'no_class':
      return 'Class selection required';
  }
}

function getVisibleStatusText(status: BossGateStatusV2): string | null {
  switch (status.kind) {
    case 'ready':
      return null;
    case 'cooldown':
      return `Catnap: ${formatCountdown(status.secondsLeft)}`;
    case 'not_reached':
      return formatNotReached(status);
    case 'no_key':
      return 'You need a Cat Key. You get one each day from your first claim, and sometimes from monsters in cleared chapters.';
    case 'no_class':
      return 'Pick a class first.';
  }
}

/**
 * BossGatePanel displays chapter boss gate information:
 * - Boss identity and portrait
 * - Keys held
 * - Chapter switcher over fightable chapters
 * - Fight / Rematch button
 * - Refusal reasons mirroring the server's check order
 */
export function BossGatePanel({
  state,
  chapter,
  nowS,
  busy,
  onFight,
  onSelectChapter,
}: BossGatePanelProps) {
  const status = bossGateStatus(state, chapter, nowS);
  const label = bossLabel(chapter);
  const chapters = fightableChapters(state);

  const theme = CHAPTER_THEME_COLORS[chapter];
  const themeStyle = theme?.color
    ? ({ '--chapter-theme-color': theme.color } as CSSProperties)
    : undefined;

  const handleFight = () => {
    if (busy || status.kind !== 'ready') return;
    onFight(chapter);
  };

  const isReady = status.kind === 'ready';
  const isRematch = isReady && status.rematch;

  const buttonText = busy
    ? 'Fighting...'
    : isRematch
      ? 'Rematch'
      : 'Fight';

  const visibleStatusText = getVisibleStatusText(status);
  const liveRegionText = getLiveAnnouncement(status);

  return (
    <section
      className="boss-gate-panel"
      data-status={status.kind}
      style={themeStyle}
      aria-label="Boss Gate"
    >
      <header className="boss-gate-header">
        <h2 className="boss-gate-boss-name">{label.name}</h2>
        <div className="boss-gate-chapter-sub">
          Chapter {chapter}: {label.chapterName}
        </div>
      </header>

      <div className="boss-gate-body">
        <div className="boss-portrait-container">
          <BossPortrait chapter={chapter} />
        </div>

        <div className="boss-gate-keys">
          <PixelIcon name="key" size={2} title="Cat Key" />
          <span>Keys: {state.currencies?.keys ?? 0}</span>
        </div>
      </div>

      <nav className="boss-gate-chapters" aria-label="Chapter selection">
        {chapters.map((ch) => (
          <button
            key={ch}
            type="button"
            className={`boss-chapter-btn ${ch === chapter ? 'is-active' : ''}`}
            aria-current={ch === chapter ? 'true' : undefined}
            onClick={() => onSelectChapter(ch)}
          >
            Chapter {ch}
          </button>
        ))}
      </nav>

      <div className="boss-gate-actions">
        <button
          type="button"
          className="boss-fight-btn"
          disabled={busy || !isReady}
          aria-busy={busy ? 'true' : 'false'}
          onClick={handleFight}
        >
          {buttonText}
        </button>

        <div className="boss-gate-status">
          <span className="boss-gate-live sr-only" aria-live="polite">
            {liveRegionText}
          </span>
          {visibleStatusText && (
            <span className="boss-gate-status-text">
              {visibleStatusText}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
