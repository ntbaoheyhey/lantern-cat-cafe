import {createRoot} from 'react-dom/client';
import App from '../../apps/web/src/game/cardrpg/depth/App';
import {setLookV2} from '../../apps/web/src/game/squad/turn3d/look-v2';
import '../ui-v3/offline.css';
setLookV2(new URLSearchParams(location.search).get('look')!=='off');
if (import.meta.env.VITE_REVIEW_DEMO === '1') {
  void import('../v3-demo/offline').then(({renderOfflineDemo})=>renderOfflineDemo());
} else createRoot(document.getElementById('root')!).render(<App offline gameplayV4 skillsV5/>);
