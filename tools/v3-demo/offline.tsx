import {createRoot} from 'react-dom/client';
import App from '../../apps/web/src/game/cardrpg/depth/App';
import {Gate} from '../../apps/web/src/game/cardrpg/shell/Entrance';
import {ShellPages} from '../../apps/web/src/game/cardrpg/shell/ShellPages';
import ChainRoot from '../../apps/web/src/game/cardrpg/chain/ChainRoot';
import {AudioControls} from '../../apps/web/src/audio/AudioControls';
import {installAudio} from '../../apps/web/src/audio/engine';
import '../../apps/web/src/ui/typography.css';

// The saved demo has local gameplay and the real wallet panel, without a chain backend.
export function renderOfflineDemo() {
  installAudio();
  createRoot(document.getElementById('root')!).render(
    <ChainRoot embedded><Gate><App offline gameplayV4 skillsV5/></Gate><AudioControls/><ShellPages/></ChainRoot>,
  );
}
