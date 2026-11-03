import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ScreenFrame } from '../../src/shell';
import { WalletProvider } from '../../src/wallet/WalletProvider';
import { sampleStateV2 } from '../../src/layout/sampleState';
import { RecentLootCard } from '../../src/layout/home/RecentLootCard';
import { useMotionCue } from '../../src/motion/useMotionCue';
import '../../src/styles.css';
import '../../src/theme.css';
import '../../src/motion.css';
import '../../src/layout/layout.css';
import '../../src/layout/home/home.css';

function Fixture() {
  const [step, setStep] = useState(0);
  const [panel, setPanel] = useState('home');
  const state = sampleStateV2();
  state.currencies.fish = step ? 240000 : 12;
  state.currencies.yarn = step ? 1200 : 9;
  state.cat.level = step ? 10 : 9;
  // An existing sample item receives a distinct local fixture identity, never persisted.
  if (step) state.inventory = state.inventory.map((item, i) => i === state.inventory.length - 1 ? { ...item, id: 'sample-loot-' + step } : item);
  const mint = useMotionCue<HTMLParagraphElement>(step ? String(step) : null, 'relic');
  return <ScreenFrame activeScreen="home" onSelectScreen={() => {}} hudProps={{ state, power: 360 }}>
    <section className="shell-panel-view" key={panel} style={{ display: 'flex', flexDirection: 'column', padding: 20, height: '100%' }}>
      <h2>Motion samples</h2><p>Local UI samples only. No reward, ownership or wallet write.</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <button className="pixel-btn" onClick={() => setStep(value => value + 1)}>Play sample cues</button>
        <button className="pixel-btn--secondary" onClick={() => setPanel(value => value === 'home' ? 'next' : 'home')}>Change sample panel</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '340px 340px', gridTemplateRows: 'minmax(0, 1fr)', flex: 1, minHeight: 0, gap: 24, marginTop: 24 }}>
        <RecentLootCard state={state} />
        <div className="home-card" style={{ padding: 16 }}>
          <h3>Relic confirmation sample</h3>
          <p ref={mint} className="motion-cue" data-testid="sample-mint-cue">{step ? 'Sample mint confirmed' : 'Sample waiting for confirmation'}</p>
          <div key={step} className={step ? 'forge-result-reveal forge-flash' : ''} data-testid="sample-forge-cue" style={{ height: 96, display: 'grid', placeItems: 'center' }}>
            <img src="/relics/1.svg" width="96" height="96" alt="Sample Relic artwork" />
          </div>
        </div>
      </div>
    </section>
  </ScreenFrame>;
}
createRoot(document.getElementById('root')!).render(<WalletProvider><Fixture /></WalletProvider>);
