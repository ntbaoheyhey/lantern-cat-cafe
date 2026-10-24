import { useGameSnapshot } from '../game/store';
import { nextStep, type HintTab } from '../onboarding/nextStep';

/** The next useful action as a one-line chip in the top bar. */
export function HintChip({ onGo }: { onGo: (tab: HintTab) => void }) {
  const { server, gold } = useGameSnapshot();
  if (!server) return null;
  const step = nextStep(server, gold);
  return (
    <div className="v2-hint chip" data-testid="next-hint" role="group" aria-label="Next step recommendation">
      <span className="v2-hint-lead">Next:</span>
      {step.tab ? (
        <button type="button" className="v2-hint-btn" onClick={() => onGo(step.tab!)}>
          {step.text} →
        </button>
      ) : (
        <span className="v2-hint-text">{step.text}</span>
      )}
    </div>
  );
}
