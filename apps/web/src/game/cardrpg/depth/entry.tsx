import { createRoot } from 'react-dom/client';
import DepthApp from './App';
import { chainFlags } from '../chain/flags';
const root = createRoot(document.getElementById('root')!);
if (chainFlags().guestWallet) {
  void import('../chain/ChainRoot').then(({default: ChainRoot}) => root.render(<ChainRoot><DepthApp /></ChainRoot>));
} else root.render(<DepthApp />);
