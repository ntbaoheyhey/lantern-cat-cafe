// A loopback-only PGlite server. Does not read .env, service keys or remote URLs.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createServer as httpServer } from 'node:http';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRequire = createRequire(resolve(root, 'apps/web/package.json'));
const testsRequire = createRequire(resolve(root, 'supabase/tests/package.json'));

export function localPort(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid ${name}`);
  return value;
}
export async function loadHarness() {
  const { createServer } = await import(pathToFileURL(webRequire.resolve('vite')).href);
  const loader = await createServer({ configFile: false, envDir: false, root, server: { middlewareMode: true, hmr: false, watch: null },
    resolve: { alias: [
      ...['game-rules', 'api-contract', 'chain'].map(name => ({ find: `@taskbar-hero/${name}`, replacement: resolve(root, `packages/${name}/src/index.ts`) })),
      { find: /^viem\/accounts$/, replacement: testsRequire.resolve('viem/accounts').replace('/_cjs/', '/_esm/') },
      { find: /^viem$/, replacement: testsRequire.resolve('viem').replace('/_cjs/', '/_esm/') },
    ] }, ssr: { noExternal: ['@taskbar-hero/game-rules', '@taskbar-hero/api-contract', '@taskbar-hero/chain'] } });
  try {
    const database = await loader.ssrLoadModule('/supabase/tests/src/standalone-db.ts');
    const runtime = await loader.ssrLoadModule('/supabase/tests/v2/local-runtime.ts');
    const helpers = await loader.ssrLoadModule('/supabase/tests/v2/helpers.ts');
    return { ...database, ...runtime, ...helpers, close: () => loader.close() };
  } catch (error) { await loader.close(); throw error; }
}
export async function startLocalServer({ db, harness, port = localPort('E2E_PORT_API', 4176), webPort = localPort('E2E_PORT_SERVER', 4175) } = {}) {
  const ownHarness = !harness, ownDb = !db;
  harness ??= await loadHarness();
  db ??= await harness.buildMigratedDb();
  const origin = `http://localhost:${webPort}`;
  const runtime = harness.localRuntime(db, origin);
  const log = [];
  // Controls wait for active handlers. Tests issue controls between actions.
  // Handlers run concurrently, retaining their actual SQL CAS races.
  let active = new Set();
  const server = httpServer(async (incoming, outgoing) => {
    const task = (async () => {
      try {
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(incoming.socket.remoteAddress)) { outgoing.writeHead(403).end(); return; }
        const host = incoming.headers.host;
        if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) { outgoing.writeHead(403).end(); return; }
        const reqOrigin = incoming.headers.origin;
        if (reqOrigin && reqOrigin !== origin) { outgoing.writeHead(403).end(); return; }
        const url = new URL(incoming.url, `http://127.0.0.1:${port}`);
        if (incoming.method === 'GET' && url.pathname === '/health') { outgoing.writeHead(200).end('local-pglite-v2'); return; }
        const buffers = []; let size = 0;
        for await (const chunk of incoming) { size += chunk.length; if (size > 8192) { outgoing.writeHead(413).end(); return; } buffers.push(chunk); }
        const body = Buffer.concat(buffers).toString();
        if (url.pathname.startsWith('/__test/')) {
          // Control requests must have no browser Origin; never expose CORS on controls.
          if (reqOrigin || incoming.method !== 'POST') { outgoing.writeHead(403).end(); return; }
          await Promise.all([...active]);
          const input = JSON.parse(body || '{}');
          let result;
          if (url.pathname === '/__test/session') result = await runtime.fixture(input.kind ?? 'fresh');
          else if (url.pathname === '/__test/advance') result = await runtime.advance(input.playerId, input.seconds) ?? {};
          else if (url.pathname === '/__test/inspect') result = { ...await runtime.inspect(input.playerId), requests: log.filter(entry => entry.playerId === input.playerId) };
          else { outgoing.writeHead(404).end(); return; }
          outgoing.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(result)); return;
        }
        const name = /^\/functions\/v1\/(v2-[a-z-]+)$/.exec(url.pathname)?.[1];
        if (!name) { outgoing.writeHead(404).end(); return; }
        const req = new Request(url, { method: incoming.method, headers: incoming.headers, ...(body ? { body } : {}) });
        const response = await runtime.handle(name, req);
        let playerId;
        // Logging is diagnostic only. Authentication always happens in runtime.handle.
        try { playerId = JSON.parse(Buffer.from((incoming.headers.authorization ?? '').split('.')[1] ?? '', 'base64url').toString()).sub; } catch { /* anonymous */ }
        let intent = null;
        try { intent = body ? JSON.parse(body) : null; } catch { /* malformed diagnostics must retain the handler's 400 */ }
        log.push({ name, playerId, method: incoming.method, status: response.status, body: intent });
        outgoing.writeHead(response.status, Object.fromEntries(response.headers)).end(Buffer.from(await response.arrayBuffer()));
      } catch (error) { console.error(error); if (!outgoing.headersSent) outgoing.writeHead(500); outgoing.end(); }
    })();
    if (incoming.url?.startsWith('/functions/')) { active.add(task); task.finally(() => active.delete(task)); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  console.log(`Local PGlite v2 API: http://127.0.0.1:${port} (test secret generated in memory)`);
  return { db, runtime, async close() { await new Promise(resolve => server.close(resolve)); await Promise.all(active); if (ownDb) await db.close(); if (ownHarness) await harness.close(); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startLocalServer();
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.close(); process.exit(0); });
}
