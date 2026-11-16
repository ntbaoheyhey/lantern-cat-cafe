import {createRoot} from 'react-dom/client';
import App from '../../../apps/web/src/game/cardrpg/depth/App';
import {Gate} from '../../../apps/web/src/game/cardrpg/shell/Entrance';
import {ShellPages} from '../../../apps/web/src/game/cardrpg/shell/ShellPages';
import {AudioControls} from '../../../apps/web/src/audio/AudioControls';
import {installAudio} from '../../../apps/web/src/audio/engine';
import {setLookV2} from '../../../apps/web/src/game/squad/turn3d/look-v2';
import {WalletProvider,OfflineWallet} from './adapter';
import '../../../apps/web/src/ui/typography.css';
import '../../ui-v3/offline.css';
import './offline.css';
installAudio();setLookV2(true);
createRoot(document.getElementById('root')!).render(<WalletProvider>
  <Gate guest={async()=>{}}><App offline gameplayV4 skillsV5/></Gate><AudioControls/><ShellPages/><OfflineWallet/>
</WalletProvider>);
