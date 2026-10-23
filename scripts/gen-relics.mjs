// Generates the Cat Café Quest Relic artwork (128x128 pixel-art SVG icons) and ERC-1155 metadata
// into apps/web/public/relics/. Art is original to this repo. Single source of truth: rerunning
// `node scripts/gen-relics.mjs` reproduces every file in that folder (output is committed).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://web-zeta-tan-13.vercel.app';
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/relics');

// Order matches CONFIG.rarities, so relicId = index + 1 (relicIdFor). `base` is the --rarity-* token
// from theme.css; `bg` is a dark tint of it; `dark`/`light` shade the icon.
const RELICS = [
  { rarity: 'common', name: 'Paw Charm', article: 'a', label: 'Common', base: '#b9b6c9', dark: '#7d7a92', light: '#efedf7', bg: '#38344a' },
  { rarity: 'rare', name: 'Silver Bell', article: 'a', label: 'Rare', base: '#4aa8ff', dark: '#2368b0', light: '#cde8ff', bg: '#1f3a5e' },
  { rarity: 'epic', name: 'Moon Collar', article: 'an', label: 'Epic', base: '#bb74ff', dark: '#6d38b0', light: '#ecd5ff', bg: '#43296b' },
  { rarity: 'legendary', name: 'Golden Maneki', article: 'a', label: 'Legendary', base: '#ff9a3c', dark: '#b3560f', light: '#ffe0b0', bg: '#5e3414' },
];

const DESCRIPTIONS = [
  'A cozy paw-print charm that keeps the strip cat purring in Taskbar Hero, on the Avalanche Fuji testnet.',
  'A tiny silver bell that jingles whenever the strip cat pounces in Taskbar Hero, on the Avalanche Fuji testnet.',
  'A moonlit collar worn by the strip cat on midnight patrols in Taskbar Hero, on the Avalanche Fuji testnet.',
  'A golden lucky-cat statue that beckons good fortune in Taskbar Hero, on the Avalanche Fuji testnet.',
];

// 16x16 pixel grids. B base, D dark, L light, K ink, . empty (K is near-black for eyes and outlines).
const ICONS = [
  // Paw print
  [
    '................',
    '................',
    '....BB....BB....',
    '...BLBB..BBBB...',
    '...BBBB..BBBB...',
    '.BB.BBBB.BBB.BB.',
    'BLBB..BB..BB.BBB',
    'BBBB..........BB',
    '.BB...BBBBBB.BB.',
    '.....BLBBBBBB...',
    '....BBBBBBBBBB..',
    '....BBBBBBBBDD..',
    '....BBBBBBBDDD..',
    '.....BBBBBDDD...',
    '......DDDDDD....',
    '................',
  ],
  // Bell on a ribbon
  [
    '......DDDD......',
    '.....D....D.....',
    '.....D....D.....',
    '.......BB.......',
    '......BLBB......',
    '.....BLBBBD.....',
    '....BLBBBBBD....',
    '....BLBBBBBD....',
    '...BLBBBBBBBD...',
    '...BBBBBBBBBD...',
    '..BBBBBBBBBBBD..',
    '..DDDDDDDDDDDD..',
    '.......DD.......',
    '......LDDL......',
    '......DDDD......',
    '................',
  ],
  // Collar band with a crescent moon pendant
  [
    '................',
    '.BB..........BB.',
    '.BBB........BBB.',
    '..BBB......BBB..',
    '..BLBBB..BBBBB..',
    '...BBBBBBBBBB...',
    '....DDDDDDDD....',
    '.......DD.......',
    '......LLLL......',
    '.....LLL........',
    '.....LL.....L...',
    '.....LL.........',
    '.....LLL........',
    '......LLLL......',
    '.L..............',
    '................',
  ],
  // Maneki-neko with a raised paw
  [
    '..BB........BB..',
    '..BLB......BBB..',
    '..BBBBBBBBBBBB..',
    '..BKKBBBBBBKKB..',
    '..BBBBBKKBBBBB..',
    '..BBBBBBBBBBBB..',
    '.BB.DDDDDDDDDD..',
    '.BB.BBBBBBBBBB..',
    '.BL.BBLBBBBBBD..',
    '....BBLBBBBBBD..',
    '....BBBBBBBBBD..',
    '...BBBBBBBBBBD..',
    '...BBBBBBBBBDD..',
    '...DDDDDDDDDDD..',
    '................',
    '................',
  ],
];

const KEY = (r) => ({ B: r.base, D: r.dark, L: r.light, K: '#1b1224' });

function svg(r, grid) {
  const fill = KEY(r);
  const rects = [];
  grid.forEach((row, y) => {
    if (row.length !== 16) throw new Error(`${r.name}: row ${y} has ${row.length} cells, expected 16`);
    [...row].forEach((c, x) => {
      if (c !== '.') rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill[c]}"/>`);
    });
  });
  if (grid.length !== 16) throw new Error(`${r.name}: ${grid.length} rows, expected 16`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="128" height="128" shape-rendering="crispEdges">
<title>${r.name}</title>
<rect width="16" height="16" fill="${r.bg}"/>
${rects.join('\n')}
</svg>
`;
}

mkdirSync(out, { recursive: true });
RELICS.forEach((r, i) => {
  const id = i + 1;
  writeFileSync(`${out}/${id}.svg`, svg(r, ICONS[i]));
  const meta = {
    name: r.name,
    description: DESCRIPTIONS[i],
    image: `${SITE}/relics/${id}.svg`,
    external_url: SITE,
    attributes: [{ trait_type: 'Rarity', value: r.label }],
  };
  const json = `${JSON.stringify(meta, null, 2)}\n`;
  writeFileSync(`${out}/${id}.json`, json);
  writeFileSync(`${out}/${id.toString(16).padStart(64, '0')}.json`, json);
});
console.log(`wrote ${RELICS.length} relics to ${out}`);
