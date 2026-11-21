import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONFIG, relicIdFor } from '@taskbar-hero/game-rules';
import { describe, expect, it } from 'vitest';
import { LABELS } from '../theme/labels';
import { relicImageUrl } from './marketText';

const PUBLIC = resolve(__dirname, '../../public');
const IMAGE_ORIGIN = 'https://taskbarhero-eight.vercel.app';

describe.each(CONFIG.rarities.map((rarity) => [rarity, relicIdFor(rarity)] as const))('%s relic (id %i)', (rarity, id) => {
  const hexName = `${id.toString(16).padStart(64, '0')}.json`;
  const read = (name: string) => JSON.parse(readFileSync(resolve(PUBLIC, 'relics', name), 'utf8'));

  it('has identical decimal and 64-hex metadata files', () => {
    expect(read(hexName)).toEqual(read(`${id}.json`));
  });

  it('has the ERC-1155 metadata fields', () => {
    const name = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    const meta = read(`${id}.json`);
    expect(meta.name).toBe(LABELS.relics[rarity]);
    expect(meta.description).toMatch(/Lantern Cat Café/);
    expect(meta.description).toMatch(/Fuji testnet/);
    expect(meta.image).toBe(`${IMAGE_ORIGIN}${relicImageUrl(id)}`);
    expect(meta.external_url).toBe('https://lantern-cat-cafe.vercel.app');
    expect(meta.attributes).toEqual([{ trait_type: 'Rarity', value: name }]);
  });

  it('has an SVG image', () => {
    const file = resolve(PUBLIC, relicImageUrl(BigInt(id)).slice(1));
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  });
});
