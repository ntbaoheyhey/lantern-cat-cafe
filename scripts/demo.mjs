import { createRequire } from 'node:module';
import { createServer as createNetServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, 'apps/web');
const requireWeb = createRequire(resolve(web, 'package.json'));
const { createServer, build } = await import(pathToFileURL(requireWeb.resolve('vite')).href);
const options = { root: web, configFile: resolve(web, 'vite.demo.config.ts'), mode: 'offline-demo' };
const args = process.argv.slice(2);
if (args.length && !(args.length === 1 && args[0] === '--build')) throw new Error('Usage: pnpm demo [--build]');
if (args[0] === '--build') {
  await build(options);
} else {
  // Vite also uses strictPort, closing the race between the check and listen.
  const probe = createNetServer();
  try {
    await new Promise((ok, fail) => { probe.once('error', fail); probe.listen({ port: 5199, host: 'localhost' }, ok); });
    await new Promise(ok => probe.close(ok));
  } catch (error) {
    console.error(`Cannot start demo: port 5199 is busy or unavailable (${error.code}). Stop the process using that port yourself; no process was killed.`);
    process.exit(1);
  }
  const server = await createServer(options);
  try { await server.listen(); }
  catch (error) { await server.close(); console.error(`Cannot start demo on port 5199: ${error.message}`); process.exit(1); }
  console.log('\nCandidate build (stack tip 1eefc3e), not live.\nOffline guest demo: no backend, no wallet, no chain requests.\nOpen http://localhost:5199\nPress Ctrl+C to stop this demo.\n');
  let closing = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
    if (closing) return; closing = true;
    await server.close(); process.exit(0);
  });
}
