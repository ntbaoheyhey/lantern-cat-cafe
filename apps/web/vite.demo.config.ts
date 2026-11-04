import { mergeConfig, type Plugin } from 'vite';
import standard from './vite.config';

/** Env files and inherited VITE_* variables are intentionally not exposed. */
const offlineHtml: Plugin = {
  name: 'offline-demo-html',
  transformIndexHtml: {
    order: 'pre',
    handler: html => html
      .replace(/<link\b[^>]*href="https?:[^>]*>\s*/g, '')
      .replace(/<meta\b[^>]*content="https?:[^>]*>\s*/g, '')
      .replace('<title>Taskbar Hero</title>', '<title>Taskbar Hero · offline candidate · not live</title>')
      .replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws://localhost:5199 ws://127.0.0.1:5199; object-src 'none'; base-uri 'self'; form-action 'none'">`),
  },
};

export default mergeConfig(standard, {
  envDir: false,
  envPrefix: [],
  plugins: [offlineHtml],
  define: {
    'import.meta.env.VITE_OFFLINE_DEMO': JSON.stringify('1'),
    'import.meta.env.VITE_GAME_V2': JSON.stringify('1'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
    'import.meta.env.VITE_FUJI_RPC_URL': JSON.stringify(''),
    'import.meta.env.VITE_ALLOW_MOCK_AUTH': JSON.stringify('0'),
  },
  server: { host: 'localhost', port: 5199, strictPort: true, open: false },
  build: { outDir: '../../docs/demo/dist', emptyOutDir: true, sourcemap: false },
});
