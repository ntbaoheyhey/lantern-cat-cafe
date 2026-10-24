#!/usr/bin/env node
// Scans a built web bundle for secret-looking strings. It builds nothing: run
//   pnpm --filter @taskbar-hero/web build && node scripts/check-bundle.mjs [dir]
// `dir` defaults to apps/web/dist. Exits 1 and lists every hit, 0 when clean, 2 on a usage error.
// Matches are masked in the output so the report itself does not leak a secret. See docs/security-web.md.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(process.argv[2] ?? join(root, 'apps/web/dist'));

if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  console.error(`check-bundle: ${dist} not found. Build the web app first (pnpm --filter @taskbar-hero/web build).`);
  process.exit(2);
}

// Names that mean "server only". Anything in .env.example that is not VITE_ is added below.
const SECRET_NAMES = new Set([
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE',
  'SERVICE_ROLE',
  'SUPABASE_JWT_SECRET',
  'VOUCHER_SIGNER_PRIVATE_KEY',
  'DEPLOYER_PRIVATE_KEY',
  'GAME_SEED_SECRET',
  'SNOWTRACE_API_KEY',
]);
const SECRET_LIKE = /KEY|SECRET|TOKEN|PASSWORD|PASSPHRASE|MNEMONIC|SEED|PRIVATE|SERVICE_ROLE/i;
const PUBLIC_NAMES = new Set(['VITE_SUPABASE_ANON_KEY', 'VOUCHER_SIGNER_ADDRESS']);

/** KEY=value pairs from an env-style file (comments and blank lines skipped, quotes stripped). */
function parseEnvFile(path) {
  const out = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    out.push([m[1], m[2].replace(/^(['"])(.*)\1$/, '$2')]);
  }
  return out;
}

const examplePath = join(root, '.env.example');
if (existsSync(examplePath)) {
  for (const [name] of parseEnvFile(examplePath)) {
    if (!name.startsWith('VITE_') && !PUBLIC_NAMES.has(name)) SECRET_NAMES.add(name);
  }
}

// Real values to look for: secret-looking variables from local env files and this process's environment.
const envFiles = [];
for (const dir of [root, join(root, 'apps/web'), join(root, 'supabase')]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (/^\.env(\..+)?$/.test(f) && f !== '.env.example') envFiles.push(join(dir, f));
}
const secretValues = new Map(); // value -> where it came from
const viteNamedLikeSecrets = [];
const consider = (name, value, from) => {
  if (name.startsWith('VITE_') && SECRET_LIKE.test(name) && !PUBLIC_NAMES.has(name)) viteNamedLikeSecrets.push(`${name} (${from})`);
  if (PUBLIC_NAMES.has(name) || name.startsWith('VITE_')) return;
  if (value.length >= 8 && (SECRET_NAMES.has(name) || SECRET_LIKE.test(name))) secretValues.set(value, `${name} from ${from}`);
};
for (const file of envFiles) for (const [name, value] of parseEnvFile(file)) consider(name, value, relative(root, file));
for (const [name, value] of Object.entries(process.env)) if (value) consider(name, value, 'process environment');

const mask = (s) => (s.length <= 12 ? '*'.repeat(s.length) : `${s.slice(0, 4)}…${s.slice(-2)} (${s.length} chars)`);
const decodeJwtPayload = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

const names = [...SECRET_NAMES].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const RULES = [
  { id: 'secret variable name', re: new RegExp(`(?<![A-Za-z0-9_])(?:${names.join('|')})(?![A-Za-z0-9_])`, 'g') },
  { id: 'Supabase secret key (sb_secret_)', re: /sb_secret_[A-Za-z0-9_-]{10,}/g },
  { id: 'PEM private key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { id: 'mnemonic / seed phrase', re: /mnemonic|seed phrase|recovery phrase/gi },
  // A 32-byte hex value assigned to something key-like. Bare 64-hex values are everywhere in web3 code
  // (curve constants, bytecode), so only a nearby key-ish name counts.
  { id: 'private key hex next to a key-like name', re: /(?:private|secret|signer|deployer)[A-Za-z_ ]{0,12}["'`\s:=,(]{1,8}(?:0x)?[0-9a-fA-F]{64}(?![0-9a-fA-F])/gi },
  { id: 'cloud or git token', re: /AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|xox[abprs]-[A-Za-z0-9-]{10,}/g },
];
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

const hits = [];
const notes = [];
let scanned = 0;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

for (const file of walk(dist)) {
  const buf = readFileSync(file);
  if (buf.includes(0)) continue; // binary (png, fonts)
  scanned++;
  const text = buf.toString('utf8');
  const where = (i) => `${relative(dist, file)}:${lineOf(text, i)}`;

  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) hits.push({ at: where(m.index), rule: rule.id, found: mask(m[0]) });
  }
  for (const m of text.matchAll(JWT)) {
    const payload = decodeJwtPayload(m[0]);
    if (payload?.role === 'service_role' || payload?.role === 'supabase_admin') {
      hits.push({ at: where(m.index), rule: `JWT with role "${payload.role}"`, found: mask(m[0]) });
    } else if (payload?.role === 'anon') {
      notes.push(`${where(m.index)}  Supabase anon key (public by design, protected by row-level security)`);
    } else {
      hits.push({ at: where(m.index), rule: 'JWT (not the anon key): check what it grants', found: mask(m[0]) });
    }
  }
  for (const [value, from] of secretValues) {
    for (let i = text.indexOf(value); i !== -1; i = text.indexOf(value, i + value.length)) {
      hits.push({ at: where(i), rule: `value of ${from}`, found: mask(value) });
    }
  }
}
for (const v of viteNamedLikeSecrets) {
  hits.push({ at: 'environment', rule: 'VITE_ variable named like a secret (Vite ships every VITE_ variable to the browser)', found: v });
}

console.log(`check-bundle: scanned ${scanned} text files in ${relative(root, dist) || dist}`);
for (const n of notes) console.log(`note  ${n}`);
if (hits.length === 0) {
  console.log('check-bundle: no secret-looking strings found.');
  process.exit(0);
}
for (const h of hits) console.log(`HIT   ${h.at}  ${h.rule}  ${h.found}`);
console.error(`check-bundle: ${hits.length} hit${hits.length === 1 ? '' : 's'}. Do not deploy this build until each one is explained.`);
process.exit(1);
