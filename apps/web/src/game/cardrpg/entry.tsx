import {StrictMode} from 'react';import {createRoot} from 'react-dom/client';import CardRpgApp from './App';
import {chainFlags} from './chain/flags';
const root=createRoot(document.getElementById('root')!);
if(chainFlags().guestWallet){void import('./chain/ChainRoot').then(({default:ChainRoot})=>root.render(<StrictMode><ChainRoot><CardRpgApp/></ChainRoot></StrictMode>));}
else root.render(<StrictMode><CardRpgApp/></StrictMode>);
