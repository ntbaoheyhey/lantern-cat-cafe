import {createRoot} from 'react-dom/client';
import App from '../../apps/web/src/game/cardrpg/depth/App';
import {setLookV2} from '../../apps/web/src/game/squad/turn3d/look-v2';
setLookV2(new URLSearchParams(location.search).get('look') !== 'off');
createRoot(document.getElementById('root')!).render(<App offline gameplayV4 skillsV5 />);
