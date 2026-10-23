import { useGameSnapshot } from '../game/store';
import { nextStep, type HintTab } from './nextStep';

/** One line above the tabs with the next useful action; clicking it opens that tab. */
export function NextStepHint({ onGo }: { onGo: (tab: HintTab) => void }) {
  const { server, gold } = useGameSnapshot();
  if (!server) return null;
  const step = nextStep(server, gold);
  return (
    <div className="next-hint" data-testid="next-hint">
      {step.tab ? (
        <button type="button" className="next-hint-btn" onClick={() => onGo(step.tab!)}>
          Next: {step.text} →
        </button>
      ) : (
        <span>{step.text}</span>
      )}
    </div>
  );
}
