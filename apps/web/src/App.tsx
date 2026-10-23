import { useState } from 'react';
import { CatPortrait } from './CatPortrait';
import { GameCanvas } from './GameCanvas';
import { getSessionStore, useGameSnapshot } from './game/store';
import { HowToPlay } from './onboarding/HowToPlay';
import { NextStepHint } from './onboarding/NextStepHint';
import type { HintTab } from './onboarding/nextStep';
import { Panel, type TabName } from './Panel';
import { WalletButton } from './wallet/WalletButton';
import { WalletProvider } from './wallet/WalletProvider';

const PANEL_ID = 'game-panel';

export function App() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabName>('Hero');
  const snapshot = useGameSnapshot();

  const handleGo = (targetTab: HintTab) => {
    setTab(targetTab);
    setOpen(true);
  };

  const bossLevel = snapshot.server?.bossLevel ?? 1;

  return (
    <WalletProvider store={getSessionStore()}>
      <main className="page">
        <header className="page-header">
          <h1 className="page-title">Taskbar Hero</h1>
          <p className="page-copy">
            Your cat fights on its own. Collect fish, upgrade gear, beat the bosses.
          </p>
        </header>

        <section className="cat-card pixel-card" aria-label="Mochi the cat">
          <div className="cat-portrait-wrap">
            <CatPortrait size={72} />
          </div>
          <div className="cat-info">
            <h2 className="cat-name">Mochi the cat</h2>
            <div className="cat-stats">
              <span className="chip cat-chip">
                <span className="cat-stat-label">Cat power:</span>{' '}
                <strong className="cat-stat-val" data-testid="cat-card-power">{Math.round(snapshot.power)}</strong>
              </span>
              <span className="chip cat-chip">
                <span className="cat-stat-label">Boss level:</span>{' '}
                <strong className="cat-stat-val" data-testid="cat-card-boss-level">{bossLevel}</strong>
              </span>
            </div>
          </div>
        </section>

        <NextStepHint onGo={handleGo} />
      </main>

      {open && <Panel id={PANEL_ID} tab={tab} onTabChange={setTab} />}
      <HowToPlay />
      <div role="region" aria-label="Taskbar strip" className="strip">
        <GameCanvas />
        <WalletButton />
        <button
          className="toggle"
          aria-expanded={open}
          aria-controls={PANEL_ID}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
    </WalletProvider>
  );
}
