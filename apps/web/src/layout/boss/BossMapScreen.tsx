import { ChapterMap } from '../../map/ChapterMap';
import type { BossRun } from '../bossPresentation';
import { BossGatePanel, type BossGatePanelProps } from './BossGatePanel';
import { bossRewardPreview } from './mapDetails';
import './BossMapScreen.css';
import { BossKeyHint } from './BossKeyHint';

export function BossMapScreen({ history, compact = false, ...props }: BossGatePanelProps & { history: readonly BossRun[]; compact?: boolean }) {
  const { state, chapter, onSelectChapter } = props;
  const clear = state.bosses.chapters.find((entry) => entry.chapter === chapter);
  const firstClear = !clear?.cleared;
  const runs = history.filter((run) => run.chapter === chapter).slice(0, 3);
  const map = <ChapterMap presentation={compact ? undefined : 'path'} currentChapter={state.progress.chapter} selectedChapter={chapter}
    round={state.progress.round} clearedChapters={state.bosses.chapters.filter((entry) => entry.cleared).map((entry) => entry.chapter)}
    onSelect={onSelectChapter} />;
  // Preserve the original scroll region and pinned action below the full Map's desktop breakpoint.
  if (compact) return <BossGatePanel {...props}>{map}</BossGatePanel>;
  return (
    <div className="boss-map-screen">
      <div className="boss-map-world">
      {map}
      {state.currencies.keys < 1 && <BossKeyHint keys={state.currencies.keys} />}
      </div>
      <div className="boss-map-sidebar">
        <BossGatePanel {...props} mapView />
        <section className="boss-map-card" aria-label="Boss rewards">
          <h3>Rewards <span>{firstClear ? 'First clear' : 'Rematch'} chest</span></h3>
          <ul className="boss-map-rewards">{bossRewardPreview(chapter, firstClear).map((reward) => (
            <li key={reward.label}><span>{reward.label}</span><span className="num">{reward.count} · {reward.chance}%</span></li>
          ))}</ul>
        </section>
        <section className="boss-map-card" aria-label="Past runs">
          <h3>Past runs <span>This session · latest 3</span></h3>
          <p className="boss-map-lifetime">Lifetime wins: {clear?.wins ?? 0}</p>
          {runs.length ? <ol className="boss-map-runs">{runs.map((run, index) => (
            <li key={index}><strong>{run.won ? 'Win' : 'Loss'}</strong><span>{run.firstClear ? 'First-clear attempt' : 'Rematch'} · {(run.durationMs / 1000).toFixed(1)}s</span></li>
          ))}</ol> : <p>No completed fights here this session. Select an available chapter and fight when ready.</p>}
        </section>
      </div>
    </div>
  );
}
