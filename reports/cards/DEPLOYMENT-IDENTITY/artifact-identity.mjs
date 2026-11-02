import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, readdir, writeFile, access } from 'node:fs/promises';
import { resolve, join, relative, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);
const sha256 = value => createHash('sha256').update(value).digest('hex');

/** Same-origin build entry points; inline scripts and remote services are not build identity. */
export function entryPaths(html, site) {
  const entries = [];
  for (const tag of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const source = tag[0].match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!source) continue;
    const url = new URL(source, site);
    if (url.origin === new URL(site).origin && /\.(?:js|css)$/.test(url.pathname)) entries.push(url.pathname);
  }
  return [...new Set(entries)].sort();
}

/** Content equality proves artifact equivalence, never a provider's hidden commit metadata. */
export function classifyIdentity(localEntries, liveEntries, assets, endEntries) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!localEntries.length || !same(localEntries, liveEntries) || !same(liveEntries, endEntries)) return 'ENTRY_MISMATCH';
  if (!assets.length || assets.some(asset => asset.status !== 200 || asset.localSha256 !== asset.liveSha256)) return 'ASSET_MISMATCH';
  return 'ARTIFACT_MATCH';
}

async function filesUnder(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(path));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}

async function publicGet(url, site) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (new URL(response.url).origin !== new URL(site).origin) throw new Error('Cross-origin redirect refused');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 20 * 1024 * 1024) throw new Error('Unexpected public artifact size');
  return { status: response.status, bytes };
}

async function main() {
  const [rootArg, expectedHead, outArg, mode] = process.argv.slice(2);
  if (!rootArg || !/^[a-f0-9]{40}$/.test(expectedHead ?? '') || !outArg || !['0', '1'].includes(mode)) throw new Error('Usage: node artifact-identity.mjs REPO EXACT_SHA NEW_OUT_DIR 0|1');
  const root = resolve(rootArg), out = resolve(outArg);
  const site = 'https://taskbarhero-eight.vercel.app';
  const expectedProject = 'https://qoalewtxflagoprrxrgh.supabase.co';
  const head = (await run('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  if (head !== expectedHead) throw new Error('Checkout HEAD differs from expected SHA');
  const cleanArgs = ['diff', '--quiet', 'HEAD', '--', '.', ':!reports'];
  await run('git', cleanArgs, { cwd: root });
  for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
    let exists = true;
    try { await access(join(root, 'apps/web', file)); } catch { exists = false; }
    if (exists) throw new Error('Local Vite environment file present; isolated build required');
  }
  await mkdir(out, { recursive: false });
  const first = await publicGet(site, site);
  if (first.status !== 200) throw new Error(`Live HTML HTTP ${first.status}`);
  const liveEntries = entryPaths(first.bytes.toString(), site);
  let anon, urlObserved = false;
  for (const path of liveEntries.filter(path => path.endsWith('.js'))) {
    const asset = await publicGet(new URL(path, site), site);
    if (asset.status !== 200) throw new Error(`Live entry HTTP ${asset.status}`);
    const source = asset.bytes.toString();
    urlObserved ||= source.includes(expectedProject);
    for (const match of source.matchAll(/eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g)) {
      try {
        const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString());
        if (payload.role === 'anon' && payload.ref === 'qoalewtxflagoprrxrgh') anon = match[0];
      } catch { /* Unrelated token-shaped public data. */ }
    }
  }
  if (!urlObserved || !anon) throw new Error('Public configuration not observed; refusing guessed values');
  const env = { ...process.env };
  for (const name of Object.keys(env)) if (name.startsWith('VITE_')) delete env[name];
  Object.assign(env, { NODE_ENV: 'production', VITE_GAME_V2: mode, VITE_ALLOW_MOCK_AUTH: '0', VITE_SUPABASE_URL: expectedProject, VITE_SUPABASE_ANON_KEY: anon });
  const dist = join(root, 'apps/web/dist', `identity-${head.slice(0, 12)}-${mode}-${basename(out)}`);
  try { await access(dist); throw new Error('Identity build output already exists; use a fresh checkout'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const build = await run('pnpm', ['--filter', '@taskbar-hero/web', 'exec', 'vite', 'build', '--outDir', dist], { cwd: root, env, maxBuffer: 16 * 1024 * 1024 });
  await writeFile(join(out, 'build.log'), `HEAD=${head}\nMODE=${mode}\nPUBLIC_CONFIG=observed, values withheld\n${build.stdout}${build.stderr}\nEXIT_CODE=0\n`);
  const localEntries = entryPaths(await readFile(join(dist, 'index.html'), 'utf8'), site);
  const assets = [];
  if (JSON.stringify(localEntries) === JSON.stringify(liveEntries)) {
    for (const path of (await filesUnder(dist)).filter(path => path !== join(dist, 'index.html'))) {
      const assetPath = '/' + relative(dist, path).split('\\').join('/');
      const local = await readFile(path), live = await publicGet(new URL(assetPath, site), site);
      assets.push({ path: assetPath, status: live.status, localBytes: local.length, liveBytes: live.bytes.length, localSha256: sha256(local), liveSha256: sha256(live.bytes) });
    }
  }
  const last = await publicGet(site, site);
  const endEntries = last.status === 200 ? entryPaths(last.bytes.toString(), site) : [];
  await run('git', cleanArgs, { cwd: root });
  const status = classifyIdentity(localEntries, liveEntries, assets, endEntries);
  const result = { status, expectedHead: head, site, observedAt: new Date().toISOString(), mode, publicConfigObserved: true, keysRecorded: false, providerCommitMetadata: 'NOT_OBSERVED', htmlSha256: sha256(first.bytes), localEntries, liveEntries, endEntries, assets, limitation: 'An artifact match establishes byte equivalence to this clean commit build. Pair with GitHub Vercel success on this SHA; identical-content commits cannot be distinguished without deployment metadata.' };
  await writeFile(join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status, head, comparedAssets: assets.length, out }));
  if (status !== 'ARTIFACT_MATCH') process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
