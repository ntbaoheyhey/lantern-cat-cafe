import { PixelIcon } from '../art/pixelIcons';
import { STEPS } from '../onboarding/HowToPlay';

/** How to play as a tab: the same steps as the dialog, always in view. */
export function HelpTab() {
  return (
    <ol className="help-steps">
      {STEPS.map((step, i) => (
        <li key={step.icon} className="help-step-item">
          <div className="help-step-lead">
            <span className="help-step-badge" aria-hidden="true">
              {i + 1}
            </span>
            <span className="help-step-icon" aria-hidden="true">
              <PixelIcon name={step.icon} size={3} />
            </span>
          </div>
          <div className="help-step-text">{step.text}</div>
        </li>
      ))}
    </ol>
  );
}
