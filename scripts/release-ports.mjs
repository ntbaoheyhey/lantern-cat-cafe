// Port-only adaptation for the read-only local test API's Vite middleware socket.
import { registerHooks } from 'node:module';
registerHooks({ load(url, context, next) {
  const result = next(url, context);
  if (!url.endsWith('/scripts/local-server.mjs')) return result;
  const port = Number(process.env.E2E_PORT_API) + 1;
  if (!Number.isInteger(port) || port < 5300 || port > 5399) throw new Error('UI middleware socket requires an owned5300–5399port');
  const before = 'server: { middlewareMode: true, hmr: false, watch: null }';
  const source = result.source.toString();
  if (!source.includes(before)) throw new Error('Read-only test middleware changed; review port adapter');
  return { ...result, source: source.replace(before, `server: { middlewareMode: true, hmr: { port: ${port} }, watch: null }`) };
}});
