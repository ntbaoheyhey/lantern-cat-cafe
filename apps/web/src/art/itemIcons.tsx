/**
 * Pixel icons for Cat RPG v2 armor sets and accessories.
 * Drawn from string maps, scaled crisply as SVGs.
 */
import type { JSX } from 'react';
import { PALETTE } from './v2Icons';

export const ITEM_ICON_MAPS = {
  // Armor sets: 3 sets x 4 slots (12)
  'arm.cozy.helmet': [
    '....kwwk...',
    '...kwttwk..',
    '...kttxzk..',
    '..kkkkkkkk.',
    '.kwoooooook',
    'kwoaooaoodk',
    'koaoooaoodk',
    'kooaoooaodk',
    'ktttttttttk',
    'ktdatdaatdk',
    '.kkkkkkkkk.',
  ],
  'arm.cozy.armor': [
    '...kttttk..',
    '.kkkttttkk.',
    'kwooooooodk',
    'kwaatwwtaak',
    'kwootwwtook',
    'kwootwwtook',
    'kwaatwwtaak',
    'kwkktwwtkdk',
    'ktkktwwtkdk',
    '.ktttttttk.',
    '..kkkkkkk..',
  ],
  'arm.cozy.gloves': [
    '...kttttk..',
    '.kk......kk',
    'kwwok.kowwk',
    'kwook.koodk',
    'kwook.koodk',
    'kwoak.kaodk',
    'kddkk.kkddk',
    'ktttk.ktttk',
    'ktatk.ktadk',
    'ktttk.ktttk',
    '.kkk...kkk.',
  ],
  'arm.cozy.boots': [
    '..kkk...kkk.',
    '.kwwwk.kwwwk',
    '.ktwtk.ktwtk',
    '.kttxk.kttxk',
    '.kkkzk.kzkkk',
    '..kwoa.aodk.',
    '.kwoookkoodk',
    'kwooookkoook',
    'kwaaok.koaad',
    'kddddk.kdddd',
    '.kkkkk.kkkkk',
  ],
  'arm.ranger.helmet': [
    '..kwk......',
    '.kwwk......',
    '.kwsek.....',
    '..ksekkkkk.',
    '..knkeeeenk',
    '.kneeeeeenk',
    'kneeeeeeemk',
    'kmmmmmmmmmk',
    'kmcmgygmcmk',
    'kccccccccck',
    '.kkkkkkkkk.',
  ],
  'arm.ranger.armor': [
    'kmmk...kmmk',
    'kmemk.kmemk',
    'kmeeekkeeek',
    'kmmmeeeemmk',
    '.kmmeeemmk.',
    '.kmmeemmck.',
    'kmmmeeemcck',
    'kmmmmmmmmmk',
    'kmmgyygmcck',
    'kccgddgccck',
    '.kkkkkkkkk.',
  ],
  'arm.ranger.gloves': [
    'kptpk.kptpk',
    'kpppk.kpppk',
    'kmmmk.kmmmk',
    'kmwmk.kmwmk',
    'kmmmk.kmmmk',
    'kgygk.kgygk',
    'kmmmk.kmmmk',
    'kmemk.kmemk',
    'kmemk.kmemk',
    'kccck.kccck',
    '.kkk...kkk.',
  ],
  'arm.ranger.boots': [
    'kneek.kneek',
    'kmemk.kmemk',
    '.kmmk.kmmk.',
    '.kgyk.kgyk.',
    '.kmmk.kmmk.',
    'kmmmk.kmmmk',
    'kwmmk.kwmmk',
    'kmmmmkmmmmk',
    'kccck.kccck',
    'kccck.kccck',
    '.kkk...kkk.',
  ],
  'arm.moon.helmet': [
    '...kyyk....',
    '..kywgyk...',
    '.kkkgykkk..',
    '.kxsuuuxzk.',
    'kxxsuuuuxzk',
    'kxxsuuuuxzk',
    'kzzkkkkkzzk',
    'kxxkxbkxuxk',
    'kxuuubuuuxk',
    '.kzuubuuuk.',
    '..kkkkkkk..',
  ],
  'arm.moon.armor': [
    '...kxxsxk..',
    '.kkkxxsxkk.',
    'kxxkxxsxkzk',
    'kxssuuuuuzk',
    'kxsukgykuzk',
    '.ksukgykzk.',
    '.ksuukuzk..',
    '.kzuuuuzk..',
    '.kzuuuuzk..',
    'ksssuuuubzk',
    '.kkkkkkkkk.',
  ],
  'arm.moon.gloves': [
    '.kxk...kxk.',
    'kxxsk.kxxsk',
    'kssuk.kssuk',
    'ksgyk.kgyuk',
    'kzuuk.kzuuk',
    '.kuuk.kuuk.',
    'kxsuk.kuuxk',
    'kxssk.kssxk',
    'kxxsk.ksxzk',
    'kzzbk.kbzzk',
    '.kkk...kkk.',
  ],
  'arm.moon.boots': [
    '.kyk...kyk.',
    'kxyxk.kyxxk',
    'kssuk.kssuk',
    '.ksuk.ksuk.',
    '.ksuk.ksuk.',
    '.kzuk.kzuk.',
    'kssuk.kssuk',
    'kxsskkkssxk',
    'kxxsk.ksxzk',
    'kxssukkuuxk',
    'kzzkk.kkzzk',
  ],

  // Accessories: 12 designs
  'acc.bell': [
    '.kkkkkkkkk.',
    'krrrrrrrrrk',
    'krrhkkkhrrk',
    '.kk.kyk.kk.',
    '...kgygk...',
    '..kgyyyygk.',
    '.kywyyyyydk',
    '.kyyykkyydk',
    '.kgyyyyygdk',
    '..kggddgk..',
    '...kkkkk...',
  ],
  'acc.ribbon': [
    '.kkkkkkkkk.',
    'kpppppppppk',
    'kpqkkkkkqpk',
    'kwwpkkkpwwk',
    'kpwwpkpwwpk',
    'kppqpkpqppk',
    '.kqqkkkqqk.',
    '...kpppk...',
    '..kpk.kpk..',
    '.kpqk.kqpk.',
    '.kk.....kk.',
  ],
  'acc.studded': [
    '..kkkkkkk..',
    '.kmmmmmmmk.',
    'kmmkkkkkmmk',
    'kwk.....kzk',
    'kwwk...kzzk',
    '.kwk...kzk.',
    'kccccccccck',
    'kckkxkkxkkk',
    '.kxwk.kzxk.',
    '..kxk.kzk..',
    '...k...k...',
  ],
  'acc.fishhook': [
    '.......kkk.',
    '......ky.yk',
    '.......kyk.',
    '.......kkk.',
    '......kwwk.',
    '....kkkgyk.',
    '..kkywkgyk.',
    '.kgykkkgyk.',
    'kgyk...kgdk',
    '.kgyyyygk..',
    '..kkkkkk...',
  ],
  'acc.feather': [
    '...kkk.....',
    '..ky.yk....',
    '...kyk.....',
    '...kkk.....',
    '.kwwsskk...',
    'kwwssussek.',
    'ksssuuwseek',
    'ksuueewseek',
    '.kueewneek.',
    '..keenek...',
    '...knk.....',
  ],
  'acc.pearl': [
    '...kkkkk...',
    '..kyyyykk..',
    '.kkkwwtkkk.',
    'kwwwwwtttvk',
    'kwwwttjjvvk',
    'kwtjjvvviik',
    'kwtjvvviiik',
    'kvvviiiikkk',
    '.kgviiikgyk',
    '..kgyyyyk..',
    '...kkkkk...',
  ],
  'acc.paw': [
    '.kpk.kpk.kpk',
    '.kpk.kpk.kpk',
    '..kkk...kkk.',
    '..kpppppkk..',
    '.kppwwpppk..',
    '.kkqqqqqkk..',
    'kggykkkkyggk',
    'kgyk....kygk',
    'kgyk....kygk',
    'kgdk....kdgk',
    '..kkkkkkkk..',
  ],
  'acc.hunter': [
    '..kk.......',
    '.kwwk......',
    'kwwtk......',
    '.kwwtxkk...',
    '..ktwxxxkk.',
    '.kkrrhrrkkk',
    'kggykkkyggk',
    'kgyk...kygk',
    'kgyk...kygk',
    'kgdk...kdgk',
    '.kkkkkkkkk.',
  ],
  'acc.lucky': [
    '...keek....',
    '..kewnek...',
    '..kennenk..',
    '.kekkwwkkek',
    'keenkwwnnek',
    '.kenkzzkkek',
    'kggykkkyggk',
    'kgyk...kygk',
    'kgyk...kygk',
    'kgdk...kdgk',
    '.kkkkkkkkk.',
  ],
  'acc.catnip': [
    '...kkk..w..',
    '..ky.yk.w..',
    '...kyk.www.',
    '...kmk..w..',
    '.kekkek....',
    'kweeeenkkk.',
    'kenneekwekk',
    '.kknkewneek',
    '...kenneek.',
    '....knnk...',
    '.....kk....',
  ],
  'acc.mouse': [
    '...kkk.....',
    '..ky.yk.kk.',
    '...kykkkppk',
    '...kkttxppk',
    '..ktwttxxkk',
    'kpttwwtxxxk',
    '..ktwwtxxzk',
    '...kttxxzkk',
    '....kkk.kmk',
    '.......kmk.',
    '......kk...',
  ],
  'acc.star': [
    '....kkk....',
    '...ky.yk...',
    '....kyk....',
    '....kwk....',
    '...kwwyk...',
    'kkkkywwykkk',
    'kyywwwwyyyk',
    '.kgyysyygk.',
    '..kgyyyygk.',
    '.kgyk..kygk',
    '.kkk....kkk',
  ],
} as const;

export type ItemIconKey = keyof typeof ITEM_ICON_MAPS;
export const ITEM_ICON_KEYS = Object.keys(ITEM_ICON_MAPS) as ItemIconKey[];

/** 'arm.cozy.helmet.rare' -> 'arm.cozy.helmet'; 'acc.collar.bell.epic' -> 'acc.bell'; weapons and unknown ids -> null. */
export function itemIconKey(itemKey: string): ItemIconKey | null {
  if (itemKey in ITEM_ICON_MAPS) {
    return itemKey as ItemIconKey;
  }
  const parts = itemKey.split('.');
  if (parts[0] === 'arm' && parts.length === 4) {
    const key = `arm.${parts[1]}.${parts[2]}`;
    if (key in ITEM_ICON_MAPS) {
      return key as ItemIconKey;
    }
  }
  if (parts[0] === 'acc' && parts.length === 4) {
    const key = `acc.${parts[2]}`;
    if (key in ITEM_ICON_MAPS) {
      return key as ItemIconKey;
    }
  }
  return null;
}

/** One SVG path per colour: a unit square for every pixel of that colour. */
function shapes(rows: readonly string[]): { color: string; d: string }[] {
  const byChar = new Map<string, string>();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!PALETTE[ch]) return;
      byChar.set(ch, `${byChar.get(ch) ?? ''}M${x} ${y}h1v1h-1z`);
    });
  });
  return [...byChar].map(([ch, d]) => ({ color: PALETTE[ch]!, d }));
}

const SHAPES = Object.fromEntries(
  ITEM_ICON_KEYS.map((k) => [k, shapes(ITEM_ICON_MAPS[k])]),
) as Record<ItemIconKey, { color: string; d: string }[]>;

export interface ItemPixelIconProps {
  itemKey: string;
  size?: number;
  title?: string;
}

/**
 * Same SVG output style as V2PixelIcon (crispEdges, one path per colour,
 * data-icon attribute = the icon key, aria-hidden without a title, role img + aria-label with one).
 * Renders null when itemIconKey(itemKey) is null.
 */
export function ItemPixelIcon({ itemKey, size = 3, title }: ItemPixelIconProps): JSX.Element | null {
  const key = itemIconKey(itemKey);
  if (!key) return null;
  const rows = ITEM_ICON_MAPS[key];
  const w = rows[0]?.length ?? 0;
  const h = rows.length;
  return (
    <svg
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
      data-icon={key}
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {title && <title>{title}</title>}
      {SHAPES[key].map(({ color, d }, i) => (
        <path key={i} d={d} style={{ fill: color }} />
      ))}
    </svg>
  );
}
