import { createRoot } from 'react-dom/client';
import { CONFIG } from '@taskbar-hero/game-rules';
import FeatureSamples from '../../src/runes/FeatureSamples';
import '../../src/styles.css';
import '../../src/theme.css';
import '../../src/original-preview/originalCatalog.css';
Object.assign(CONFIG.features, { originalEconomy: !new URLSearchParams(location.search).has('off') });
createRoot(document.getElementById('root')!).render(<main data-game-v2="stage-v2-enabled" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <h1 style={{ margin: '8px 16px', fontSize: 18 }}>Taskbar Hero</h1><FeatureSamples />
</main>);
