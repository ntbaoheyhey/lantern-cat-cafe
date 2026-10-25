// Dependency-free helpers; importing this module performs no filesystem or network I/O.
import { readdirSync } from 'node:fs';

// Compared production builds with VITE_GAME_V2 unset / set to 1, both using the
// same dummy VITE_SUPABASE_URL. Layout class v2-shell survives in both builds.
// SpritePreview- is absent from all flag-off JS and present in the flag-on entry:
// main.tsx gates this dynamic import on DEV || VITE_GAME_V2 === '1' (DEV is false).
// Match the stable chunk prefix, not its generated hash. See reports/check-live-v2.md.
export const V2_MARKER = 'SpritePreview-';

export function v2FunctionNames(functionsDir) {
  return readdirSync(functionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('v2-'))
    .map((entry) => entry.name).sort();
}

export function classifyAnonPost(status, bodyJson) {
  if (status === 401) return { ok: true, detail: bodyJson?.error === 'unauthenticated' ? 'function' : 'gateway' };
  return { ok: false, detail: status === 404 ? 'not deployed' : `HTTP ${status}, expected 401` };
}

export function classifyPreflight(status, headers, site) {
  const origin = headers.get('access-control-allow-origin');
  const ok = status >= 200 && status < 300 && (origin === site || origin === '*');
  return { ok, detail: status === 404 ? 'not deployed' : `HTTP ${status}, access-control-allow-origin: ${origin ?? 'missing'}` };
}

export function moduleScriptsFromHtml(html, site) {
  const urls = new Set();
  const base = new URL(site);
  // Attribute order, single/double quotes, and unquoted HTML attributes are supported.
  const uncommented = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const tag of uncommented.matchAll(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi)) {
    const attrs = new Map();
    for (const attr of tag[1].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      const name = attr[1].toLowerCase();
      if (!attrs.has(name)) attrs.set(name, attr[2] ?? attr[3] ?? attr[4]);
    }
    if (attrs.get('type')?.toLowerCase() !== 'module' || !attrs.has('src')) continue;
    try {
      const url = new URL(attrs.get('src'), `${base.href.replace(/\/$/, '')}/`);
      if (url.origin !== base.origin || url.username || url.password || !/^\/assets\/[^/]+\.js$/.test(url.pathname)) continue;
      urls.add(url.href);
      if (urls.size === 10) break;
    } catch { /* Ignore malformed script URLs. */ }
  }
  return [...urls];
}

export function bundleUsesRealApi(jsText, supabaseUrl) {
  return jsText.includes(new URL(supabaseUrl).host);
}

export function v2MarkerVerdict(jsText, marker, mode) {
  if (!marker || mode === 'off') return 'skip';
  return jsText.includes(marker) === (mode === 'post') ? 'pass' : 'fail';
}
