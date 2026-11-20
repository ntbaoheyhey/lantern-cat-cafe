import React from 'react';
import { createRoot } from 'react-dom/client';
import SquadApp from '../apps/web/src/game/squad/SquadApp';
import * as squad from '../packages/game-rules/src/squad/index';
createRoot(document.getElementById('squad-game')!).render(<SquadApp offline />);
// Local opt-in evidence fixture; the normal production app never includes this global.
if (new URLSearchParams(location.search).get('squadDebug') === '1') Object.assign(window, { __squadHarness: squad });
