import { CatPortrait } from '../CatPortrait';
import { BackdropView } from '../art/backdrops/BackdropView';
import { backdropFor } from '../art/backdrops';
import './landing.css';

const STEPS = [
  { n: '1', title: 'Pick a class', copy: 'Seven cat classes, each with its own passive.' },
  { n: '2', title: 'Let your cat fight', copy: 'It explores on its own, even when you look away.' },
  { n: '3', title: 'Gear up, beat bosses', copy: 'Craft, salvage and upgrade gear to push further.' },
] as const;

/** First-visit poster shown beside the class picker. Presentation only; no game state. */
export function LandingHero({ onStart }: { onStart: () => void }) {
  return (
    <section className="landing" aria-labelledby="landing-title" data-testid="landing-hero">
      <div className="landing__art" aria-hidden="true">
        <BackdropView art={backdropFor(1)} className="landing__backdrop" />
        <div className="landing__cat">
          <CatPortrait size={96} />
        </div>
      </div>
      <h2 id="landing-title" className="landing__title">
        A cat RPG that plays itself
      </h2>
      <p className="landing__hook">
        Your cat lives in a thin strip above your taskbar. Collect fish, upgrade gear and beat the bosses.
      </p>
      <button type="button" className="landing__cta" onClick={onStart} data-testid="landing-start">
        Choose your class
      </button>
      <ol className="landing__steps">
        {STEPS.map((s) => (
          <li key={s.n}>
            <span className="landing__step-n" aria-hidden="true">
              {s.n}
            </span>
            <span>
              <strong>{s.title}</strong>
              <span className="landing__step-copy">{s.copy}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
