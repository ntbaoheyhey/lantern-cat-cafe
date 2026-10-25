import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './theme.css';
import './motion.css';

const root = createRoot(document.getElementById('root')!);

// Dev sprite preview at /?dev=sprites, only in dev builds or when v2 is enabled. In an explicit classic
// production build the condition is constant false, so the preview is left out of the bundle.
if ((import.meta.env.DEV || import.meta.env.VITE_GAME_V2 !== '0') && new URLSearchParams(window.location.search).get('dev') === 'sprites') {
  void import('./dev/SpritePreview').then(({ SpritePreview }) => root.render(<StrictMode><SpritePreview /></StrictMode>));
} else if ((import.meta.env.DEV || import.meta.env.VITE_GAME_V2 !== '0') && new URLSearchParams(window.location.search).get('dev') === 'arena') {
  void import('./dev/ArenaPreview').then(({ ArenaPreview }) => root.render(<StrictMode><ArenaPreview /></StrictMode>));
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
