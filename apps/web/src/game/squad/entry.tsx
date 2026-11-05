import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './entry.css';
import SquadApp from './SquadApp';

createRoot(document.getElementById('root')!).render(<StrictMode><SquadApp /></StrictMode>);
