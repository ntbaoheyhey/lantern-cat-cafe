// Port-only test adaptation; no assertion, fixture or timeout changes.
import { registerHooks } from 'node:module';
registerHooks({ load(url, context, next) {
  const result = next(url, context);
  const source = result.source?.toString();
  const port = Number(process.env.OVN_AUX_PORT);
  if (!Number.isInteger(port) || port < 5173 || port > 5299) throw new Error('SYS test port must be 5173–5299');
  if (url.endsWith('/scripts/local-server.mjs')) {
    const before = 'server: { middlewareMode: true, hmr: false, watch: null }';
    if (!source.includes(before)) throw new Error('Review changed local test server port wiring');
    return { ...result, source: source.replace(before, `server: { middlewareMode: true, hmr: { port: ${port} }, watch: null }`) };
  }
  if (url.endsWith('/apps/web/tools/ui-audit.mjs')) {
    const before = 'const port = signedIn ? 4175 : 5199, apiPort = 4176;';
    if (!source.includes(before)) throw new Error('Review changed audit port wiring');
    return { ...result, source: source.replace(before, `const port = ${port}, apiPort = ${port + 1};`) };
  }
  return result;
}});
