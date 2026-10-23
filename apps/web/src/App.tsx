import { useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { Panel } from './Panel';

const PANEL_ID = 'game-panel';

export function App() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <main className="page">
        <h1>Taskbar Hero</h1>
        <p>An idle RPG that lives in the strip at the bottom of this page. Your hero fights on its own.</p>
      </main>
      {open && <Panel id={PANEL_ID} />}
      <div role="region" aria-label="Taskbar strip" className="strip">
        <GameCanvas />
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
