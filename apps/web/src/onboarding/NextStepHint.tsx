import { useGameSnapshot } from '../game/store';
import { nextStep, type HintTab } from './nextStep';

/** Next useful action as a highlighted pixel-card. */
export function NextStepHint({ onGo }: { onGo: (tab: HintTab) => void }) {
  const { server, gold } = useGameSnapshot();
  if (!server) return null;
  const step = nextStep(server, gold);
  return (
    <aside className="next-hint pixel-card" data-testid="next-hint" aria-label="Next step recommendation">
      <div className="next-hint-content">
        <span className="next-hint-lead">Next step:</span>
        {step.tab ? (
          <button type="button" className="next-hint-btn pixel-btn" onClick={() => onGo(step.tab!)}>
            {step.text} →
          </button>
        ) : (
          <span className="next-hint-text">{step.text}</span>
        )}
      </div>
    </aside>
  );
}
