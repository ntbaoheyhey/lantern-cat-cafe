const CAT_PIXELS = [
  '....................',
  '...dd..........dd...',
  '..dppd........dppd..',
  '..dpppd......dpppd..',
  '..dppppddddddppppd..',
  '.dooooodoodoodoooood',
  '.dooddooodooooddood.',
  'dooodoooooooooooodod',
  'ooooddooodooooddoooo',
  'oookksdooodoooodskko',
  'oookksdooodoooodskko',
  'w.oooddoowwooddood.w',
  'ww.ooddwwppwwddoo.ww',
  '.w.ooddwwwpwwwddo.w.',
  '...ooodww..wwdoood..',
  '....ddwwwwwwwwdd....',
  '.....dpppppppd......',
  '......dgggggd.......',
  '.......dgggd........',
  '........ddd.........',
];

const CAT_PALETTE: Record<string, string> = {
  o: '#ffb86b', // orange tabby base (var(--gold) / var(--accent))
  d: '#c66a1a', // tabby stripes & ears
  p: '#ff8fb1', // pink ear inner & nose (var(--key))
  w: '#fff3e0', // cream muzzle, whiskers & chest (var(--text))
  k: '#1a1220', // dark eyes (var(--bg))
  s: '#ffffff', // bright eye shine
  g: '#ffd75e', // golden bell (var(--focus))
};

export function CatPortrait({ size = 72, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Portrait of Mochi the cat"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', display: 'block' }}
    >
      {CAT_PIXELS.flatMap((row, y) =>
        row.split('').map((char, x) => {
          const fill = CAT_PALETTE[char];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}
