// Generates the site favicon (apps/web/public/favicon.svg) and the 1200x630 share image
// (apps/web/public/og.png): the strip scene with Mochi, a yarn ball and the title in a pixel font.
// No external assets or dependencies: the PNG is encoded here. Run: node scripts/gen-og.mjs
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/public');
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));

// Palette matches game/StripScene.ts and theme.css.
const P = { o: '#f0a040', d: '#c66a1a', w: '#fff0d8', k: '#2a1a10', n: '#ff8fb1', s: '#dfe6f2', g: '#7a5a3a' };

// ---- Favicon: Mochi's head, drawn as a mirrored 8x12 half so it stays symmetric. ----
const HALF = [
  '........',
  '........',
  '.dd.....',
  '.dnd....',
  '.doooooo',
  '.dooodoo',
  'dooooooo',
  'dookkooo',
  'dookkooo',
  'dooowwww',
  'dooowwwn',
  '.dooowww',
  '..doowww',
  '....dddd',
  '........',
  '........',
];
const HEAD = HALF.map((r) => r + [...r].reverse().join(''));
const rects = [];
HEAD.forEach((row, y) =>
  [...row].forEach((c, x) => {
    if (c !== '.') rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${P[c]}"/>`);
  }),
);
writeFileSync(
  `${pub}/favicon.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="64" height="64" shape-rendering="crispEdges">
<title>Mochi the cat</title>
${rects.join('\n')}
</svg>
`,
);

// ---- Share image ----
const W = 1200;
const H = 630;
const buf = Buffer.alloc(W * H * 3);
function rect(x, y, w, h, color) {
  const [r, g, b] = hex(color);
  for (let j = Math.max(0, y); j < Math.min(H, y + h); j++)
    for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) {
      const o = (j * W + i) * 3;
      buf[o] = r;
      buf[o + 1] = g;
      buf[o + 2] = b;
    }
}
function sprite(rows, palette, x, y, px) {
  rows.forEach((row, j) => [...row].forEach((c, i) => palette[c] && rect(x + i * px, y + j * px, px, px, palette[c])));
}

// Dusk sky bands, stars, ground.
const GROUND = 150;
const bands = ['#1f1630', '#2a1f40', '#3a2a55', '#55356a', '#7a4478', '#a85a7e', '#d4747a'];
const bandH = Math.ceil((H - GROUND) / bands.length);
bands.forEach((c, i) => rect(0, i * bandH, W, bandH, c));
[[60, 40], [180, 110], [330, 60], [470, 150], [610, 30], [760, 120], [900, 50], [1040, 100], [1130, 30], [250, 230], [980, 210]].forEach(([x, y]) =>
  rect(x, y, 8, 8, '#fff3c4'),
);
rect(0, H - GROUND, W, GROUND, '#6b4a32');
rect(0, H - GROUND, W, 20, '#7bb661');
for (let x = 20; x < W; x += 130) rect(x, H - GROUND + 20, 14, 10, '#5c9a4a');
for (let x = 70; x < W; x += 170) rect(x, H - GROUND + 70, 20, 10, '#553a26');

// Mochi (same art as the strip) and a yarn ball.
const HERO = [
  '.d....d...s.',
  '.oooooo...s.',
  '.okooko...s.',
  '.owwnww...s.',
  '..owwo...gg.',
  '.ooooooogg..',
  'doododoo.o..',
  'doooooooo...',
  '.ow.wo.wo...',
  '.dd.dd.dd...',
];
const YARN = [
  '...pppp...',
  '..pPPPPp..',
  '.pPqpPPPp.',
  '.pPPPqPPp.',
  '.pqPPPPqp.',
  '.pPPqPPPp.',
  '..pPPPPp..',
  '...pppp...',
  '.pPP......',
];
const GROUND_Y = H - GROUND;
sprite(HERO, P, 180, GROUND_Y - 10 * 14 + 8, 14);
sprite(YARN, { p: '#d9578a', P: '#ff8fb1', q: '#ffc2d6' }, 880, GROUND_Y - 9 * 12 + 8, 12);

// Title in a 5x7 pixel font with a hard drop shadow.
const GLYPH = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'],
  s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110'],
  k: ['10000', '10000', '10010', '10100', '11000', '10100', '10010'],
  b: ['10000', '10000', '10110', '11001', '10001', '11001', '10110'],
  r: ['00000', '00000', '10110', '11001', '10000', '10000', '10000'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
};
function text(str, x0, y0, px, color) {
  let x = x0;
  for (const ch of str) {
    const g = GLYPH[ch];
    if (g) g.forEach((row, j) => [...row].forEach((v, i) => v === '1' && rect(x + i * px, y0 + j * px, px, px, color)));
    x += (g ? 6 : 4) * px;
  }
}
const TITLE = 'Taskbar Hero';
const PX = 16;
const width = [...TITLE].reduce((n, ch) => n + (GLYPH[ch] ? 6 : 4) * PX, 0) - PX;
const x0 = Math.round((W - width) / 2);
text(TITLE, x0 + 8, 108 + 8, PX, '#000000');
text(TITLE, x0, 108, PX, '#ffb86b');

// ---- PNG encoder (8-bit RGB) ----
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b) => {
  let c = 0xffffffff;
  for (const byte of b) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // RGB
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) buf.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
writeFileSync(
  `${pub}/og.png`,
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
console.log('wrote favicon.svg and og.png');
