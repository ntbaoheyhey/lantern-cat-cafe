import { useEffect, useState } from 'react';
import { CafeBoard } from './CafeBoard';
import { GameCanvas } from './GameCanvas';
import { getSessionStore } from './game/store';
import { isGameV2 } from './layout/flag';
import { StageLayout } from './layout/StageLayout';
import { HowToPlay } from './onboarding/HowToPlay';
import type { HintTab } from './onboarding/nextStep';
import { Panel, type TabName } from './Panel';
import { WalletButton } from './wallet/WalletButton';
import { WalletProvider } from './wallet/WalletProvider';

import { isOfflineDemo } from './demo/mode';
import { OfflineDemoBanner } from './demo/OfflineDemoBanner';

const PANEL_ID = 'game-panel';

// Clean up legacy mini mode key on load so saved choice never persists.
try {
  localStorage.removeItem('taskbar-hero.miniMode');
} catch {
  // Browser storage can be unavailable.
}

/** The classic page: café board above a 96 px strip with a drawer. */
function ClassicLayout() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabName>('Hero');

  const handleGo = (targetTab: HintTab) => {
    setTab(targetTab);
    setOpen(true);
  };

  return (
    <>
      <main className="page">
        <header className="page-header">
          <h1 className="page-title">Taskbar Hero</h1>
          <p className="page-copy">
            Your cat fights on its own. Collect fish, upgrade gear, beat the bosses.
          </p>
        </header>

        <CafeBoard onGo={handleGo} />
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
    </>
  );
}

export function App() {
  useEffect(() => {
    try {
      localStorage.removeItem('taskbar-hero.miniMode');
    } catch {
      // Browser storage can be unavailable.
    }
  }, []);

  return (
    <WalletProvider store={getSessionStore()}>
      {isOfflineDemo() && <OfflineDemoBanner />}
      {isGameV2() ? <StageLayout /> : <ClassicLayout />}
    </WalletProvider>
  );
}
