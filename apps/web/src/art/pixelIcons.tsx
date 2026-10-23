/** Pixel icons drawn from string maps (like StripScene's pixelTexture), no image assets. */

/** Colour per map character. Theme variables where one exists, hex fallbacks otherwise. */
const PALETTE: Record<string, string> = {
  o: '#f59b3d',
  d: '#c9701a',
  k: '#000000',
  w: '#ffffff',
  p: 'var(--key, #ff7a9a)',
  q: '#c04468',
  g: 'var(--gold, #ffd34e)',
  y: 'var(--gold, #ffd34e)',
  b: '#8b5a3c',
  f: '#ffe3ee',
  r: '#e0527a',
  h: '#ffb3b3',
  s: 'var(--shard, #8fd8ff)',
  v: '#bb74ff',
  m: '#6b3b1a',
  x: '#d8d8e8',
};

const MAPS = {
  paw: ['.o..o.', 'oo..oo', '.oooo.', 'oooooo', 'oooooo', '.oooo.'],
  bag: ['..mm..', '.mmmm.', 'mmmmmm', 'mgmmgm', 'mmmmmm', 'mmmmmm'],
  sword: ['......x', '.....xx', '....xx.', 'x..xx..', 'xxxx...', '.xx....', 'm..x...'],
  flask: ['..ss..', '..ss..', '.ssss.', 'ssssss', 'ssssss', '.ssss.'],
  shop: ['yyyyyyy', 'y.y.y.y', 'mmmmmmm', 'm.....m', 'm.....m', 'mmmmmmm'],
  fish: ['...dddd...', '.ooooooodd', 'oowkooooodd', '.ooooooodd', '...dddd...'],
  yarn: ['..pppp..', '.pwppqp.', 'pppqpppp', 'pqpppqpp', 'ppqpppqp', '.pppqpp.', '..pppp..'],
  key: ['.gggg...', 'g....g..', 'g....g..', '.gggg...', '..g.....', '..gg....', '..g.gg..'],
  wand: ['.......ff', '......fff', '.....fff.', '....bf...', '...b.....', '..b......', '.b.......', 'b........'],
  ears: ['.o.....o.', 'ohh...hho', 'ohhooohho', '.bbbbbbb.'],
  collar: ['.rrrrrrrr.', 'r........r', 'r........r', '.rrrrrrrr.', '....yy....', '....yy....'],
  bell: ['..yyy..', '.yyyyy.', 'yyyyyyy', 'ywyyyyy', 'yyyyyyy', 'yyyyyyy', 'ooooooo', '..ooo..'],
  moon: ['.vvv.', 'vv...', 'v....', 'v....', 'vv...', '.vvv.'],
  heart: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof MAPS;
export const ICON_NAMES = Object.keys(MAPS) as IconName[];

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

const SHAPES = Object.fromEntries(ICON_NAMES.map((n) => [n, shapes(MAPS[n])])) as Record<IconName, { color: string; d: string }[]>;

export interface PixelIconProps {
  name: IconName;
  /** Screen pixels per art pixel. */
  size?: number;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  title?: string;
}

/** An inline pixel-art SVG icon. */
export function PixelIcon({ name, size = 3, title }: PixelIconProps) {
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
