/** Pixel UI frames drawn from string maps for v2 equipment screen. */

/** Colour per map character. Theme variables where one exists, hex fallbacks otherwise. */
export const PALETTE: Record<string, string> = {
  k: '#000000', // 1-pixel dark outline / dashed outline / keyhole
  w: '#ffffff', // pure white glint / sparkle
  // Rarity theme tokens
  c: 'var(--rarity-common, #b9b6c9)', // common grey
  x: '#d8d8e8', // light silver highlight / shackle highlight
  z: '#5a556d', // dark slate shadow / dim frame / shackle shadow
  u: 'var(--good, #6be08a)', // uncommon green
  e: '#a8f5bc', // light green highlight
  n: '#1f6937', // deep emerald shadow
  r: 'var(--rarity-rare, #4aa8ff)', // rare blue
  s: 'var(--shard, #8fd8ff)', // cyan magic shard highlight
  b: '#1d437a', // dark blue shadow
  p: 'var(--rarity-epic, #bb74ff)', // epic purple
  j: '#e5ccff', // pale lilac highlight
  i: '#5c2b8c', // deep violet shadow
  o: 'var(--rarity-legendary, #ff9a3c)', // legendary gold-orange
  g: 'var(--gold, #ffd34e)', // bright gold / lock body
  y: 'var(--focus, #ffd75e)', // pale warm yellow sparkle
  d: '#c9701a', // dark amber shadow / lock shadow
  f: 'var(--border, #5b4572)', // faint silhouette outline
  h: 'var(--surface-2, #3a2c4a)', // faint silhouette depth
};

export const MAPS = {
  // 5 Rarity borders (16x16, with transparent 8x8 centre)
  frameCommon: [
    '.kkkkkkkkkkkkkk.',
    'kxxcccccccccccck',
    'kxc..........cck',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kc............zk',
    'kcz..........zzk',
    'kzzzzzzzzzzzzzzk',
    '.kkkkkkkkkkkkkk.',
  ],
  frameUncommon: [
    '.kkkkkkkkkkkkkk.',
    'keeuuuuuuuuuuuuk',
    'keu..........uuk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'ku............nk',
    'kun..........nnk',
    'knnnnnnnnnnnnnnk',
    '.kkkkkkkkkkkkkk.',
  ],
  frameRare: [
    '.kkkkkkkkkkkkkk.',
    'kssrrrrrrrrrrrrk',
    'ksr..........rrk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'kr............bk',
    'krb..........bbk',
    'kbbbbbbbbbbbbbbk',
    '.kkkkkkkkkkkkkk.',
  ],
  frameEpic: [
    '.kkkkkkkkkkkkkk.',
    'kwjppppppppppppk',
    'kjp..........ppk',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kp............ik',
    'kpi..........iik',
    'kiiiiiiiiiiiiiik',
    '.kkkkkkkkkkkkkk.',
  ],
  frameLegendary: [
    '..wkkkkkkkkkkkk.',
    'kwygoooooooooogk',
    'kgo..........odk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'ko............dk',
    'kdo..........dyk',
    'kddddddddddddywk',
    '.kkkkkkkkkkkkwk.',
  ],

  // 9 Empty slot outlines (16x16, dashed dark outline with faint silhouette)
  emptyWeapon: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k......ff......k',
    '.......ff.......',
    'k......ff......k',
    '.......ff.......',
    'k......ff......k',
    '.....ffffff.....',
    '....ffffffff....',
    'k......ff......k',
    '.......ff.......',
    'k.....ffff.....k',
    '................',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyHelmet: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '.....f....f.....',
    'k...ff....ff...k',
    '...ffffffffff...',
    'k..ffffffffff..k',
    '...ffffffffff...',
    '...ff......ff...',
    'k..ffffffffff..k',
    '....ffffffff....',
    'k....ffffff....k',
    '................',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyArmor: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '....f......f....',
    'k..fff....fff..k',
    '..ffffffffffff..',
    'k..ffffffffff..k',
    '...ffffffffff...',
    '....ffffffff....',
    'k...ffffffff...k',
    '....ffffffff....',
    'k..ffffffffff..k',
    '...ff..ff..ff...',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyGloves: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '....f..f..f.....',
    'k..ffffffffff..k',
    '..ffffffffffff..',
    'k.ffffffffffff.k',
    '..ffffffffffff..',
    '..fffffffffff...',
    'k.fffffffffff..k',
    '...ffffffffff...',
    'k...ffffffff...k',
    '....ffffffff....',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyBoots: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '...ffff..ffff...',
    'k..ffff..ffff..k',
    '...ffff..ffff...',
    'k..ffff..ffff..k',
    '...ffff..ffff...',
    '...ffff..ffff...',
    'k.ffffffffffff.k',
    '..ffffffffffff..',
    'k..ffff..ffff..k',
    '................',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyCollar: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '..ffffffffffff..',
    'k.ffffffffffff.k',
    '..ff........ff..',
    'k.ff........ff.k',
    '..fff......fff..',
    '.....ffffff.....',
    'k...ffffffff...k',
    '....ffffffff....',
    'k....ffffff....k',
    '................',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyEarring: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '......ffff......',
    'k....ff..ff....k',
    '.....ff..ff.....',
    'k.....ffff.....k',
    '.......ff.......',
    '......ffff......',
    'k....ffffff....k',
    '.....ffffff.....',
    'k.....ffff.....k',
    '.......ff.......',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyRing: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '......ffff......',
    'k....ffffff....k',
    '......ffff......',
    'k...ffffffff...k',
    '...fff....fff...',
    'k..ff......ff..k',
    '..ff........ff..',
    'k..ff......ff..k',
    '...fff....fff...',
    'k...ffffffff...k',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],
  emptyCharm: [
    'k.k.k.k..k.k.k.k',
    '................',
    'k..............k',
    '.......ff.......',
    'k.....f..f.....k',
    '.......ff.......',
    'k....ff..ff....k',
    '....ffffffff....',
    'k..ffffffffff..k',
    '..ffffffffffff..',
    'k..ffffffffff..k',
    '....ffffffff....',
    '.....ff..ff.....',
    'k..............k',
    '................',
    'k.k.k.k..k.k.k.k',
  ],

  // 1 Locked slot (padlock on dim frame)
  lockedSlot: [
    '.kkkkkkkkkkkkkk.',
    'kzzzzzzzzzzzzzzk',
    'kz............zk',
    'kz....kkkk....zk',
    'kz...kxxxxk...zk',
    'kz...kx..xk...zk',
    'kz...kx..xk...zk',
    'kz..kkkkkkkk..zk',
    'kz..kggggggk..zk',
    'kz..kggkkgdk..zk',
    'kz..kggkkddk..zk',
    'kz..kgdddddk..zk',
    'kz..kkkkkkkk..zk',
    'kz............zk',
    'kzzzzzzzzzzzzzzk',
    '.kkkkkkkkkkkkkk.',
  ],
} as const satisfies Record<string, readonly string[]>;

export type V2FrameName = keyof typeof MAPS;
export const V2_FRAME_NAMES = Object.keys(MAPS) as V2FrameName[];

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
  V2_FRAME_NAMES.map((n) => [n, shapes(MAPS[n])]),
) as Record<V2FrameName, { color: string; d: string }[]>;

export interface V2PixelFrameProps {
  name: V2FrameName;
  /** Screen pixels per art pixel. */
  size?: number;
  /** Accessible name. Without it the frame is decorative (aria-hidden). */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** An inline pixel-art SVG UI frame for v2 equipment screen. */
export function V2PixelFrame({ name, size = 3, title, className, style }: V2PixelFrameProps) {
  const rows = MAPS[name];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: 'block', ...style }}
      data-frame={name}
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {title && <title>{title}</title>}
      {SHAPES[name].map(({ color, d }, i) => (
        <path key={i} d={d} style={{ fill: color }} />
      ))}
    </svg>
  );
}
