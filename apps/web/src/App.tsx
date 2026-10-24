import { useState } from 'react';
import { CafeBoard } from './CafeBoard';
import { GameCanvas } from './GameCanvas';
import { getSessionStore } from './game/store';
import { isGameV2 } from './layout/flag';
import { StageLayout } from './layout/StageLayout';
import { useMiniMode } from './layout/useMiniMode';
import { HowToPlay } from './onboarding/HowToPlay';
import type { HintTab } from './onboarding/nextStep';
import { Panel, type TabName } from './Panel';
import { WalletButton } from './wallet/WalletButton';
import { WalletProvider } from './wallet/WalletProvider';

const PANEL_ID = 'game-panel';

/** The classic page: café board above a 96 px strip with a drawer. Also the v2 "Mini mode". */
function ClassicLayout({ onStageMode }: { onStageMode?: () => void }) {
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
        {onStageMode && (
          <button className="stage-toggle" onClick={onStageMode}>
            Stage
          </button>
        )}
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

/** Cat RPG v2 (VITE_GAME_V2=1): stage-first layout, or the classic strip when the player chose Mini mode. */
function StageApp() {
  const [mini, setMini] = useMiniMode();
  return mini ? (
    <ClassicLayout onStageMode={() => setMini(false)} />
  ) : (
    <StageLayout onMiniMode={() => setMini(true)} />
  );
}

export function App() {
  return (
    <WalletProvider store={getSessionStore()}>
      {isGameV2() ? <StageApp /> : <ClassicLayout />}
    </WalletProvider>
  );
}
