import { createRoot } from 'react-dom/client';
import DepthApp from '../../apps/web/src/game/cardrpg/depth/App';
createRoot(document.getElementById('root')!).render(<DepthApp offline />);
