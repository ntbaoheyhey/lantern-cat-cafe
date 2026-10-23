// Generates the Relic artwork (pixel-art SVG) and ERC-1155 metadata into apps/web/public/relics/.
// Art is original to this repo. Run: node scripts/gen-relics.mjs  (output is committed)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://web-zeta-tan-13.vercel.app';
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/relics');

// Order matches CONFIG.rarities, so relicId = index + 1 (relicIdFor). Colours match inventory.css.
const RELICS = [
  { rarity: 'common', name: 'Common', base: '#c8c8d0', dark: '#7a7a86', light: '#f2f2f6', glow: null },
  { rarity: 'rare', name: 'Rare', base: '#5b9dff', dark: '#2a5bb0', light: '#cfe2ff', glow: null },
  { rarity: 'epic', name: 'Epic', base: '#c07bff', dark: '#6f35b0', light: '#ecd6ff', glow: '#c07bff' },
  { rarity: 'legendary', name: 'Legendary', base: '#ffb341', dark: '#b06a10', light: '#fff0c8', glow: '#ffe08a' },
];

// 16x16 crystal on a stone pedestal. B base, D dark, L light, S stone, s stone shadow, . empty.
const CRYSTAL = [
  '................',
  '.......LL.......',
  '......LLBD......',
  '.....LLBBBD.....',
  '....LLBBBBDD....',
  '....LBBBBBDD....',
  '...LLBBBBBBDD...',
  '...LBBBBBBBDD...',
  '...LBBBBBBBDD...',
  '....BBBBBBDD....',
  '.....BBBBDD.....',
  '......BBDD......',
  '....SSSSSSSS....',
  '...SSSSSSSSss...',
  '...ssssssssss...',
  '................',
];
// Extra pixels for higher tiers: G glow sparkles (epic+), C crown band (legendary).
const SPARKLES = ['1,2', '14,3', '2,9', '13,10', '12,1'];
const CROWN = ['5,0', '7,0', '8,0', '10,0', '5,1', '10,1'];

function svg(r, tier) {
  const fill = { B: r.base, D: r.dark, L: r.light, S: '#5a5466', s: '#3a3544' };
  const px = [];
  CRYSTAL.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (fill[c]) px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill[c]}"/>`);
    }),
  );
  if (tier >= 2) for (const p of SPARKLES) { const [x, y] = p.split(','); px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${r.glow}"/>`); }
  if (tier >= 3) for (const p of CROWN) { const [x, y] = p.split(','); px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#ffe08a"/>`); }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="256" height="256" shape-rendering="crispEdges">
<title>${r.name} Relic</title>
<rect width="16" height="16" fill="#1b1a24"/>
${px.join('\n')}
</svg>
`;
}

mkdirSync(out, { recursive: true });
RELICS.forEach((r, i) => {
  const id = i + 1;
  writeFileSync(`${out}/${id}.svg`, svg(r, i));
  const meta = {
    name: `${r.name} Relic`,
    description: `A ${r.rarity} Relic forged in Taskbar Hero, an idle RPG on the Avalanche Fuji testnet.`,
    image: `${SITE}/relics/${id}.svg`,
    external_url: SITE,
    attributes: [{ trait_type: 'Rarity', value: r.name }],
  };
  const json = `${JSON.stringify(meta, null, 2)}\n`;
  writeFileSync(`${out}/${id}.json`, json);
  writeFileSync(`${out}/${id.toString(16).padStart(64, '0')}.json`, json);
});
console.log(`wrote ${RELICS.length} relics to ${out}`);
