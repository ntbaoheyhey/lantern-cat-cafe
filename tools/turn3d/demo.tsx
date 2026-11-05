import React from 'react';
import {createRoot} from 'react-dom/client';
import TurnApp from '../../apps/web/src/game/squad/turn3d/TurnApp';
createRoot(document.getElementById('turn3d-game')!).render(<TurnApp offline/>);
