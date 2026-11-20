import { createRoot } from 'react-dom/client';
import { CONFIG } from '@taskbar-hero/game-rules';
import Art2Preview from '../../src/art/Art2Preview';
import '../../src/styles.css';
import '../../src/theme.css';
import '../../src/original-preview/originalCatalog.css';

// Isolated test bundle only: exercise the one existing flag without changing its default.
Object.assign(CONFIG.features, { originalEconomy: true });
createRoot(document.getElementById('root')!).render(<main data-game-v2="stage-v2-enabled" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <h1 style={{ margin: '8px 16px', fontSize: 18 }}>Taskbar Hero</h1><Art2Preview />
</main>);
