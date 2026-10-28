// Give each Playwright-owned preview an isolated process, using the same Vite API
// and strict ports as the CLI. A global `pkill -f "vite preview"` from another
// checkout must not terminate an active suite on an unrelated pair of ports.
import { preview } from 'vite';

const [outDir, portText] = process.argv.slice(2);
const port = Number(portText);
if (!outDir || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Usage: node e2e/support/serve.mjs <outDir> <port>');
}
process.title = `taskbar-hero-e2e-${port}`;
const server = await preview({ build: { outDir }, preview: { port, strictPort: true } });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.httpServer.close(() => process.exit(0)));
}
