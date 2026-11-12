import { createRoot } from 'react-dom/client';
import DepthApp from './App';
import { chainFlags } from '../chain/flags';
import { gameplayA6 } from '../gate';
import { uiV3Enabled } from '../ui-v3/flag';
const root = createRoot(document.getElementById('root')!);
if (Object.values(chainFlags()).some(Boolean)) {
  void import('../chain/ChainRoot').then(({default: ChainRoot}) => root.render(<ChainRoot embedded={uiV3Enabled()||gameplayA6()}><DepthApp /></ChainRoot>));
} else root.render(<DepthApp />);
