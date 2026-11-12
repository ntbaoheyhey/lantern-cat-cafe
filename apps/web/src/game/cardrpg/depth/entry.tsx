import {ShellPages} from '../shell/ShellPages';
import {Entrance} from '../shell/Entrance';
import {AudioControls} from '../../../audio/AudioControls';
import "../../../ui/typography.css";
import {installAudio} from '../../../audio/engine';
installAudio();
import { createRoot } from 'react-dom/client';
import DepthApp from './App';
import { chainFlags } from '../chain/flags';
import { gameplayA6 } from '../gate';
import { uiV3Enabled } from '../ui-v3/flag';
const root = createRoot(document.getElementById('root')!);
if (Object.values(chainFlags()).some(Boolean)) {
  void import('../chain/ChainRoot').then(({default: ChainRoot}) => root.render(<ChainRoot embedded={uiV3Enabled()||gameplayA6()}><><Entrance><DepthApp /></Entrance><AudioControls/><ShellPages/></></ChainRoot>));
} else root.render(<><Entrance><DepthApp /></Entrance><AudioControls/><ShellPages/></>);
