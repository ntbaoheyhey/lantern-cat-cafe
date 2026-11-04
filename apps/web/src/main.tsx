import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './theme.css';
import './motion.css';
import { initializeOfflineDemo } from './demo/profiles';

initializeOfflineDemo();

const root = createRoot(document.getElementById('root')!);

// Dev sprite preview at /?dev=sprites, only in dev builds or with VITE_GAME_V2=1. In a normal
// production build the condition is constant false, so the preview is left out of the bundle.
if ((import.meta.env.DEV || import.meta.env.VITE_GAME_V2 === '1') && new URLSearchParams(window.location.search).get('dev') === 'sprites') {
  void import('./dev/SpritePreview').then(({ SpritePreview }) => root.render(<StrictMode><SpritePreview /></StrictMode>));
} else if ((import.meta.env.DEV || import.meta.env.VITE_GAME_V2 === '1') && new URLSearchParams(window.location.search).get('dev') === 'arena') {
  void import('./dev/ArenaPreview').then(({ ArenaPreview }) => root.render(<StrictMode><ArenaPreview /></StrictMode>));
} else if ((import.meta.env.DEV || import.meta.env.VITE_GAME_V2 === '1') && new URLSearchParams(window.location.search).get('dev') === 'art-pilot') {
  void import('./dev/ArtPilot').then(({ ArtPilot }) => root.render(<StrictMode><ArtPilot /></StrictMode>));
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
