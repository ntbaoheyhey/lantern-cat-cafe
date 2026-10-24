/** Pixel icons drawn from string maps for v2 (Cat Café Quest style). */

/** Colour per map character. Theme variables where one exists, hex fallbacks otherwise. */
export const PALETTE: Record<string, string> = {
  k: '#000000', // 1-pixel dark outline
  w: '#ffffff', // pure white highlight / sparkle
  t: 'var(--text, #fff3e0)', // warm cream / light fluff / fur
  x: 'var(--rarity-common, #b9b6c9)', // silver steel / soft grey fluff shadow
  z: '#5a556d', // dark steel / deep slate shadow
  g: 'var(--gold, #ffd34e)', // bright gold / starlight scale
  y: 'var(--focus, #ffd75e)', // pale warm yellow highlight / glint
  d: '#c9701a', // dark amber / gold shadow
  a: 'var(--accent, #ffb86b)', // warm orange accent / light wood / paw pad
  o: '#f59b3d', // warm orange / tabby orange
  m: '#734120', // warm brown wood / leather
  c: '#3d200e', // dark wood shadow / deep leather
  s: 'var(--shard, #8fd8ff)', // cyan magic shard / glass shine / button reflection
  u: 'var(--rarity-rare, #4aa8ff)', // vivid blue button / blue potion / blade glow
  b: '#1d437a', // dark blue shadow
  e: 'var(--good, #6be08a)', // catnip emerald crystal / green potion
  n: '#1f6937', // deep emerald shadow
  p: 'var(--key, #ff8fb1)', // pink key / ribbon / rose gem / ear / paw
  q: '#af2e52', // deep rose / dark pink shadow
  v: 'var(--rarity-epic, #bb74ff)', // violet moon pearl / magic orb
  j: '#e5ccff', // pale lilac pearl highlight
  i: '#5c2b8c', // deep violet shadow
  r: 'var(--bad, #ff6b6b)', // ruby red / health potion
  h: '#a61c36', // deep crimson shadow
};

export const MAPS = {
  // Materials
  fluffTuft: [
    '...kk..kk.',
    '..ktwkkwtk',
    '.ktwwtwwtk',
    'kwtwwwwttk',
    'kwtwwwwtxk',
    'ktwwtttxzk',
    '.ktttxxzzk',
    '.kxxxxzzk.',
    '..kxxxzk..',
    '...kkkk...',
  ],
  shinyButton: [
    '...kkkk...',
    '.kssssuuk.',
    'ksswwwwubk',
    'kswksskuuk',
    'kswwuuuubk',
    'ksuksskubk',
    'ksuuuuuubk',
    'kubbbbbubk',
    '.kubbbubk.',
    '...kkkk...',
  ],
  catnipCrystal: [
    '....kk....',
    '...kwwek..',
    '..kseeeek.',
    '.kswseeeek',
    'kssseeeenk',
    'kseeeennnk',
    'keeeeennnk',
    '.keeeennk.',
    '..keennk..',
    '...knnk...',
    '....kk....',
  ],
  starlightScale: [
    '...w.......',
    '.wwwww.....',
    '...w..kk...',
    '.kkkkyyykk.',
    'kyyywyyyyyk',
    'kyygggggydk',
    'kyggggggddk',
    '.kgggggddk.',
    '..kgggddk..',
    '...kdddk...',
    '....kkk....',
  ],
  moonPearl: [
    '...kkkk...',
    '..kwwtjjk.',
    '.kwwttjvvk',
    'kwtjjvvvik',
    'ktjjvvviik',
    'ktjvvviiik',
    'kjvvviiikk',
    '.kvviiikk.',
    '..kiiiik..',
    '...kkkk...',
  ],

  // Main slots
  slotWeapon: [
    '....kk....',
    '...kwwk...',
    '...kwxk...',
    '...kwxk...',
    '...kwxk...',
    '.kkgyygkk.',
    'kgyyyyyydk',
    '....kmk...',
    '....kmk...',
    '...kggk...',
    '....kk....',
  ],
  slotHelmet: [
    '.kk....kk.',
    'kwxk..kxzk',
    'kwwk..kzzk',
    'kwwkkkkzzk',
    'kwwwwxxxxk',
    'kwwkkkkxxk',
    'kwkkwwkkxk',
    'kxxkkkkxxk',
    '.kxxxxxxk.',
    '..kkkkkk..',
  ],
  slotArmor: [
    '.kk....kk.',
    'kwwk..kxxk',
    'kwwwkkxxxk',
    'kwwwwxxxxk',
    'kwwkppkxxk',
    'kwkppppkxk',
    'kxxkppkxxk',
    'kzzkxxkzzk',
    '.kzzxxzzk.',
    '..kkkkkk..',
  ],
  slotGloves: [
    '...kk.kk..',
    '..ktwktwk.',
    '.ktwptpwk.',
    'ktwptpwttk',
    'ktwtttwttk',
    'kwtkppktkk',
    'kwtkppkptk',
    'kxttppptxk',
    '.kxtttxxk.',
    '.kppxxppk.',
    '..kkkkkk..',
  ],
  slotBoots: [
    '.kkk...kkk.',
    'ktttk.ktttk',
    '.kmmk.kmmk.',
    '.kmwk.kmwk.',
    '.kmmk.kmmk.',
    'kmmmk.kmmmk',
    'kwmmk.kwmmk',
    'kmmmmkmmmmk',
    'kccck.kccck',
    '.kkk...kkk.',
  ],

  // Accessory slots
  slotCollar: [
    '..kkkkkk..',
    '.krrrrrrk.',
    'krrrrrrrrk',
    'krrkkkkrrk',
    'krkkyykkrk',
    '.kkyyyykk.',
    '..kywyyk..',
    '..kyyyyk..',
    '..kggdgk..',
    '...kkkk...',
  ],
  slotEarring: [
    '...kkk....',
    '..kyyyk...',
    '..ky.yk...',
    '...kyk....',
    '...kkk....',
    '..kpppk...',
    '.kpswppk..',
    '.kpwwppk..',
    '.kppppqk..',
    '..kqqqk...',
    '...kkk....',
  ],
  slotRing: [
    '...kkkk...',
    '..kswwuk..',
    '.ksuuuubk.',
    '.kkgddgkk.',
    'kggykkyggk',
    'kgyk..kygk',
    'kgyk..kygk',
    'kgdk..kdgk',
    '.kggddgk..',
    '..kkkkkk..',
  ],
  slotCharm: [
    '...kkk....',
    '..kp.pk...',
    '...kpk....',
    '...kyk....',
    '.kkkkkk...',
    'kwoooooodk',
    'kowkoododk',
    'kwoooooodk',
    '.kkkkkk...',
    '...kk.....',
  ],

  // Class weapons
  sword: [
    '........kkk',
    '.......kwwk',
    '......kwxxk',
    '.....kwxxk.',
    '....kwxxk..',
    '...kwxxk...',
    '.kkgyygkk..',
    'kgyyyyyydk.',
    '.kkkmmkkk..',
    '...kppk....',
    '....kk.....',
  ],
  hammer: [
    '.....kkkkk.',
    '....kxxxxxk',
    '...kxxxxzzk',
    '...kxxppxzk',
    '..kkxxppxzk',
    '.kgykkzkkk.',
    '..kmmk.....',
    '.kmmk......',
    'kmmk.......',
    'kggk.......',
    'kk.........',
  ],
  daggers: [
    'kk.......kk',
    'kwk.....kwk',
    'kxxk...kxxk',
    '.kxxk.kxxk.',
    '..kxxxxxk..',
    '.kkgygygkk.',
    '..kgk.kgk..',
    '.kmmk.kmmk.',
    'kmmk...kmmk',
    'kggk...kggk',
    'kk.......kk',
  ],
  spear: [
    '.........kk',
    '........kww',
    '.......kwxk',
    '......kwxxk',
    '.....kwxxk.',
    '....kgygk..',
    '...kppk....',
    '..kmmk.....',
    '.kmmk......',
    'kmmk.......',
    'kk.........',
  ],
  bow: [
    '...kkkk....',
    '..kmmmk.w..',
    '.kmmk...w..',
    '.kmk....w..',
    'kmmk....w..',
    'kmyowwwwwww',
    'kmmk....w..',
    '.kmk....w..',
    '.kmmk...w..',
    '..kmmmk.w..',
    '...kkkk....',
  ],
  staff: [
    '...kkkk...',
    '..kwwvvk..',
    '.kwwjvvik.',
    '.kvvviiik.',
    '..kkgkkk..',
    '.kkgyykk..',
    '...kmmk...',
    '...kmmk...',
    '...kmmk...',
    '...kmmk...',
    '...kkkk...',
  ],
  flasks: [
    '.kk...kk...',
    '.kmk..kmk..',
    'kkwkkkkwkk.',
    'krrk.kuuk..',
    'krwrkkuwuk.',
    'krrrkkuuuk.',
    'krrrkkuuuk.',
    'khrhkkuubk.',
    '.kkk..kkk..',
  ],

  // Chests
  chestWood: [
    '.kkkkkkkkk.',
    'kmmmmmmmmmk',
    'kmzmmmmzmzk',
    'kzzzzzzzzzk',
    'kmzmmykzmzk',
    'kmzmmgkzmzk',
    'kmzmmmmzmzk',
    'kmzmmmmzmzk',
    'kcczzzzcczk',
    '.kkkkkkkkk.',
  ],
  chestWoodOpen: [
    '.kkkkkkkkk.',
    'kmmmmmmmmmk',
    'kmzmmmmzmzk',
    'kzzzzzzzzzk',
    'kccccccccck',
    'kckkkckkkck',
    'kzzzzzzzzzk',
    'kmzmmykzmzk',
    'kmzmmmmzmzk',
    'kcczzzzcczk',
    '.kkkkkkkkk.',
  ],
  chestGold: [
    '.kkkkkkkkk.',
    'kyyyyyyyyyk',
    'kyggyyyggdk',
    'kdddddddddk',
    'kyggypyggdk',
    'kyggydyggdk',
    'kyggyyyggdk',
    'kggggggggdk',
    'kddggggdddk',
    '.kkkkkkkkk.',
  ],
  chestGoldOpen: [
    '.kkkkkkkkk.',
    'kyyyyyyyyyk',
    'kyggyyyggdk',
    'kdddddddddk',
    'kswwvyepwwk',
    'kyggsyyvggk',
    'kdddddddddk',
    'kyggypyggdk',
    'kggggggggdk',
    'kddggggdddk',
    '.kkkkkkkkk.',
  ],
} as const satisfies Record<string, readonly string[]>;

export type V2IconName = keyof typeof MAPS;
export const V2_ICON_NAMES = Object.keys(MAPS) as V2IconName[];

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

const SHAPES = Object.fromEntries(V2_ICON_NAMES.map((n) => [n, shapes(MAPS[n])])) as Record<
  V2IconName,
  { color: string; d: string }[]
>;

export interface V2PixelIconProps {
  name: V2IconName;
  /** Screen pixels per art pixel. */
  size?: number;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  title?: string;
}

export type PixelIconProps = V2PixelIconProps;

/** An inline pixel-art SVG icon. */
export function V2PixelIcon({ name, size = 3, title }: V2PixelIconProps) {
  const rows = MAPS[name];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
      data-icon={name}
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {title && <title>{title}</title>}
      {SHAPES[name].map(({ color, d }, i) => (
        <path key={i} d={d} style={{ fill: color }} />
      ))}
    </svg>
  );
}
