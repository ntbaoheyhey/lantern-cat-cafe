// Generate decimal and ERC-1155 hex metadata for Lantern Cat Café Relics.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://taskbarhero-eight.vercel.app';
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/relics');

// IDs follow CONFIG.rarities. tools/art/gameplay-relics.py generates the linked artwork.
const RELICS = [
  { name: 'Paw Charm', label: 'Common', description: 'A cozy paw-print charm carried by the cats of Lantern Cat Café on the Avalanche Fuji testnet.' },
  { name: 'Silver Bell', label: 'Rare', description: 'A tiny silver bell that rings on each Lantern Cat Café patrol on the Avalanche Fuji testnet.' },
  { name: 'Moon Collar', label: 'Epic', description: 'A moonlit collar worn on midnight patrols in Lantern Cat Café on the Avalanche Fuji testnet.' },
  { name: 'Golden Maneki', label: 'Legendary', description: 'A golden lucky cat that brings good fortune to Lantern Cat Café on the Avalanche Fuji testnet.' },
];

mkdirSync(out, { recursive: true });
RELICS.forEach((r, i) => {
  const id = i + 1;
  const meta = {
    name: r.name,
    description: r.description,
    image: `${SITE}/relics/${id}.svg`,
    external_url: SITE,
    attributes: [{ trait_type: 'Rarity', value: r.label }],
  };
  const json = `${JSON.stringify(meta, null, 2)}\n`;
  writeFileSync(`${out}/${id}.json`, json);
  writeFileSync(`${out}/${id.toString(16).padStart(64, '0')}.json`, json);
});
console.log(`wrote ${RELICS.length} relics to ${out}`);
