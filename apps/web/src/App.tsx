import { useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { getSessionStore } from './game/store';
import { HowToPlay } from './onboarding/HowToPlay';
import { Panel } from './Panel';
import { WalletButton } from './wallet/WalletButton';
import { WalletProvider } from './wallet/WalletProvider';

const PANEL_ID = 'game-panel';

export function App() {
  const [open, setOpen] = useState(false);
  return (
    <WalletProvider store={getSessionStore()}>
      <main className="page">
        <h1>Taskbar Hero</h1>
        <p>An idle RPG that lives in the strip at the bottom of this page. Your hero fights on its own.</p>
      </main>
      {open && <Panel id={PANEL_ID} />}
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
