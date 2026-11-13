import "../../ui/typography.css";
import {AudioControls} from '../../audio/AudioControls';
import {installAudio} from '../../audio/engine';
installAudio();
import {StrictMode} from 'react';import {createRoot} from 'react-dom/client';import CardRpgApp from './App';
import {chainFlags} from './chain/flags';
const root=createRoot(document.getElementById('root')!);
if(Object.values(chainFlags()).some(Boolean)){void import('./chain/ChainRoot').then(({default:ChainRoot})=>root.render(<StrictMode><ChainRoot><><CardRpgApp/><AudioControls/></></ChainRoot></StrictMode>));}
else root.render(<StrictMode><><CardRpgApp/><AudioControls/></></StrictMode>);
