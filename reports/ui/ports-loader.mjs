// Port-only adapter for the read-only inherited audit tools. Their assertions,
// fixtures, source files, timeouts and output contracts remain unchanged.
import { registerHooks } from 'node:module';
const port = Number(process.env.UI_AUDIT_PORT);
if (!Number.isInteger(port) || port < 5300 || port > 5397) throw new Error('UI_AUDIT_PORT must be 5300–5397');
registerHooks({
  load(url, context, next) {
    const result = next(url, context);
    let before, after;
    if (url.endsWith('/apps/web/tools/ui-audit.mjs')) {
      before = 'const port = signedIn ? 4175 : 5199, apiPort = 4176;';
      after = `const port = ${port}, apiPort = ${port + 1};`;
    } else if (url.endsWith('/apps/web/tools/effects-test.mjs')) {
      before = 'const port = 5198, base =';
      after = `const port = ${port}, base =`;
    } else return result;
    const source = result.source.toString();
    if (!source.includes(before)) throw new Error('Inherited audit port declaration changed; review the adapter.');
    return { ...result, source: source.replace(before, after) };
  },
});
