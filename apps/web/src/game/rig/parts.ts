import { sprite } from './spriteMap';
import type { ClassId, Markings, Point, SpriteMap } from './types';

/*
 * Body parts of the shared chibi cat, facing right. Characters come from the class's BodyPalette:
 * o fur, d dark fur, w light fur, n inner ear / nose, e eye colour, k outline / pupils.
 * Arms and legs are not maps: compose.ts draws them as 2 px lines from the shoulder or hip to the
 * paw or foot, so a pose only has to say where the paws and feet are.
 * Every pivot here is (0, 0): a part's position in a pose is its top-left pixel.
 */

export const HEAD = sprite([
  '.wo......oo..',
  '.wno....ond..',
  '.wnnowooonnd.',
  'owwwwoooooodd',
  'owwoooooooood',
  'owooooooooood',
  'ooooooooooood',
  'oowoowwwwwodd',
  'oowwwwwnwwwwd',
  '.oowwwkwkwdd.',
  '..odddddddd..',
]);
/** Skull top centre inside HEAD: where a helmet's pivot lands. */
export const HEAD_TOP: Point = { x: 6, y: 3 };

export type Face = 'open' | 'blink' | 'focus' | 'squint' | 'happy' | 'ko';
export const FACES: readonly Face[] = ['open', 'blink', 'focus', 'squint', 'happy', 'ko'];
/** Eyes drawn over the head: [back eye, front eye], each placed at its pivot inside HEAD. */
export const EYES: Readonly<Record<Face, readonly [SpriteMap, SpriteMap]>> = {
  open: [sprite(['kw', 'ek'], { x: 0, y: 0 }), sprite(['kw', 'ek'], { x: 0, y: 0 })],
  blink: [sprite(['kk'], { x: 0, y: -1 }), sprite(['kk'], { x: 0, y: -1 })],
  focus: [sprite(['kk', 'ek'], { x: 0, y: 0 }), sprite(['kk', 'ek'], { x: 0, y: 0 })],
  squint: [sprite(['k.', '.k', 'k.'], { x: 0, y: 0 }), sprite(['.k', 'k.', '.k'], { x: 0, y: 0 })],
  happy: [sprite(['.k.', 'k.k'], { x: 1, y: 0 }), sprite(['.k.', 'k.k'], { x: 0, y: 0 })],
  ko: [sprite(['k.k', '.k.', 'k.k'], { x: 1, y: 0 }), sprite(['k.k', '.k.', 'k.k'], { x: 0, y: 0 })],
};
/** Where each eye's pivot sits inside HEAD. */
export const EYE_SPOTS: readonly [Point, Point] = [{ x: 5, y: 5 }, { x: 9, y: 5 }];

export type TorsoShape = 'stand' | 'crouch' | 'flat';
export const TORSO: Readonly<Record<TorsoShape, SpriteMap>> = {
  stand: sprite([
    '.ooooooo.',
    'ooooooooo',
    'oooowwwoo',
    'ooowwwwwo',
    'ooowwwwwo',
    'ooowwwwwo',
    'oooowwwoo',
    '.ooooooo.',
  ]),
  crouch: sprite([
    '.ooooooo.',
    'ooooooooo',
    'ooowwwwoo',
    'ooowwwwwo',
    'ooowwwwwo',
    'oooowwwoo',
    '.ooooooo.',
  ]),
  flat: sprite([
    '..ooooooooo',
    '.oooooooooo',
    'oooooowwwoo',
    'ooooowwwwwo',
    '.ooooooooo.',
  ]),
};
/** Offsets inside the torso (same for every shape, measured from its top-left). */
export const SHOULDER_FRONT: Point = { x: 6, y: 2 };
export const SHOULDER_BACK: Point = { x: 3, y: 2 };
export const HIP_FRONT: Point = { x: 6, y: 6 };
export const HIP_BACK: Point = { x: 2, y: 6 };
export const TAIL_ROOT: Point = { x: 1, y: 4 };

export type TailPose = 'up' | 'mid' | 'down' | 'flat';
/** Tails grow up and left from the pivot, which sits on the torso's TAIL_ROOT. */
export const TAILS: Readonly<Record<TailPose, SpriteMap>> = {
  up: sprite([
    '.dd...',
    'ooo...',
    'oo....',
    'oo....',
    'oo....',
    'ooo...',
    '.oooo.',
    '..oooo',
  ], { x: 5, y: 7 }),
  mid: sprite([
    'dd....',
    'ooo...',
    '.oo...',
    '.ooo..',
    '..ooo.',
    '...ooo',
  ], { x: 5, y: 5 }),
  down: sprite([
    '....oo',
    '..oooo',
    '.ooo..',
    'oo....',
    'dd....',
  ], { x: 5, y: 0 }),
  flat: sprite([
    '..oooo',
    'dooo..',
  ], { x: 5, y: 0 }),
};

/** Paws are drawn centred on the paw anchor, feet from their top-left (the foot anchor). */
export const PAW = sprite(['www', 'www', 'www'], { x: 1, y: 1 });
/** Dark ring drawn under the near paw, so it reads where it crosses the body. */
export const PAW_RING = sprite(['.kkk.', 'k...k', 'k...k', 'k...k', '.kkk.'], { x: 2, y: 2 });
export const FOOT = sprite(['ooo.', 'wwww']);
/** Where the leg line ends inside FOOT. */
export const ANKLE: Point = { x: 1, y: 0 };

/** Fur markings, drawn with 'd' over the head and torso (offsets inside each part). */
export const MARKINGS: Readonly<Record<Markings, { head: readonly [SpriteMap, Point][]; torso: readonly [SpriteMap, Point][] }>> = {
  plain: { head: [], torso: [] },
  tabby: {
    head: [[sprite(['d.d.d', 'd.d.d']), { x: 4, y: 3 }], [sprite(['dd', '..', 'dd']), { x: 0, y: 5 }]],
    torso: [[sprite(['dd', '..', 'dd']), { x: 0, y: 2 }]],
  },
  patches: {
    head: [[sprite(['ddd..', 'dddd.', 'ddddd', 'ddd..']), { x: 0, y: 2 }]],
    torso: [[sprite(['.dd', 'ddd', 'dd.']), { x: 1, y: 3 }]],
  },
  points: {
    head: [
      [sprite(['dd......dd', 'dnd....dnd']), { x: 1, y: 0 }],
      [sprite(['.ddddd.', 'dddnddd', '.ddkdkd']), { x: 4, y: 7 }],
    ],
    torso: [],
  },
};

/** Class silhouettes share the same attachment coordinates and HEAD, including helmet fit.
 * Only fur extends outside the standard torso; equipment and feet keep their anchors.
 */
const BROAD_TORSO = sprite([
  'ooooooooooo', 'ooooooooooo', 'ooooowwwooo', 'oooowwwwwoo',
  'oooowwwwwoo', 'oooowwwwwoo', 'ooooowwwooo', '.ooooooooo.',
], { x: 1, y: 0 });
const SLIM_TORSO = sprite([
  '..ooooo..', '..oooooo.', '..ooowoo.', '..ooowoo.',
  '..ooowoo.', '..ooowoo.', '..oooooo.', '..ooooo..',
]);
const RUFF_TORSO = sprite([
  'w.wwwww.w', 'wwwwwwwww', '.wwwwwww.', 'oowwwwwoo',
  'ooowwwwwo', 'ooowwwwwo', 'oooowwwoo', '.ooooooo.',
]);
const PLUME = sprite([
  '.ww....', 'woow...', 'woow...', 'woow...',
  '.woow..', '..woow.', '...woow',
], { x: 6, y: 6 });
const BOBTAIL = sprite(['.ww.', 'woow', '.oo.'], { x: 3, y: 2 });
const RINGED_TAIL = sprite([
  '.dd...', 'ooo...', 'dd....', 'oo....',
  'dd....', 'ooo...', '.dddd.', '..oooo',
], { x: 5, y: 7 });
const FINE_TAIL = sprite(['..dooo', 'ddd...'], { x: 5, y: 0 });
const THICK_TAIL = sprite([
  'ddd...', 'oooo..', '.ooo..', '.oooo.', '..oooo', '...ooo',
], { x: 5, y: 5 });

export function classTorso(id: ClassId, shape: TorsoShape): SpriteMap {
  if (shape !== 'stand') return TORSO[shape];
  if (id === 'guardian') return BROAD_TORSO;
  if (id === 'rogue' || id === 'archer') return SLIM_TORSO;
  if (id === 'witch') return RUFF_TORSO;
  return TORSO[shape];
}

/** Tail roots stay fixed through every pose, including recoil and defeat. */
export function classTail(id: ClassId, tail: TailPose): SpriteMap {
  if (id === 'alchemist') return BOBTAIL;
  if (tail === 'down' || tail === 'flat') return TAILS[tail];
  if (id === 'witch') return PLUME;
  if (id === 'guardian') return THICK_TAIL;
  if (id === 'rogue') return FINE_TAIL;
  if (id === 'hunter') return RINGED_TAIL;
  if (id === 'archer') return TAILS.mid;
  return TAILS[tail];
}

/** Colourpoints reach all four paws and the whole tail, not just the face mask. */
export const POINT_PAW = sprite(['ddd', 'ddd', 'ddd'], { x: 1, y: 1 });
export const POINT_FOOT = sprite(['ddd.', 'dddd']);
