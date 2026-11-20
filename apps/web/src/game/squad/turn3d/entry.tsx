import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '../entry.css';
import TurnApp from './TurnApp';
createRoot(document.getElementById('root')!).render(<StrictMode><TurnApp/></StrictMode>);
