import { ROSTER_EFFECT_RECIPES } from './card-roster-effects';
import type { Direction } from './effect-direction';
import type { CardEffectPrimitive } from './card-effect-primitives';

export type CardEffectMotion = 'hold' | 'expand' | 'orbit' | 'projectile' | 'burst'
  | 'fall' | 'rise' | 'cross' | 'pour' | 'sweep' | 'pulse';
export type CardEffectAnchor = 'caster' | 'target' | 'all-targets';
export interface CardEffectLayer {
  primitive: CardEffectPrimitive;
  motion: CardEffectMotion;
  anchor: CardEffectAnchor;
  start: number;
  end: number;
  count: number;
  size: number;
  spread: number;
  height: number;
  turns: number;
  offset: [number, number, number];
  aspect: [number, number, number];
  ground: boolean;
  accent: boolean;
  opacity: number;
}
export interface CardEffectRecipe {
  name: string;
  color: string;
  accent: string;
  element: string;
  shot: Direction['shot'];
  target: 'hostile' | 'friendly';
  ultimate: boolean;
  durations: [number, number, number, number, number];
  shake: number;
  layers: CardEffectLayer[];
}

function layer(primitive: CardEffectPrimitive, motion: CardEffectMotion,
  anchor: CardEffectAnchor, options: Partial<CardEffectLayer> = {}): CardEffectLayer {
  return { primitive, motion, anchor, start: .32, end: .94, count: 1, size: .8,
    spread: .7, height: .25, turns: .25, offset: [0, 0, 0], aspect: [1, 1, 1],
    ground: false, accent: false, opacity: .85, ...options };
}
function recipe(name: string, color: string, accent: string, element: string,
  shot: Direction['shot'], target: CardEffectRecipe['target'], layers: CardEffectLayer[],
  options: Partial<CardEffectRecipe> = {}): CardEffectRecipe {
  return { name, color, accent, element, shot, target, layers, ultimate: false,
    durations: [600, 240, 90, 260, 320], shake: target === 'friendly' ? 0 : .5, ...options };
}

/** Existing rule statuses receive small foot-level cues with protected faces. */
export const CARD_STATUS_LOOKS: Record<string, { color: string; layer: CardEffectLayer }> = {
  scald: { color: '#efaa73', layer: layer('flame', 'rise', 'target', { count: 3, size: .24, spread: .46, height: .08, opacity: .5 }) },
  tangle: { color: '#c19ada', layer: layer('knot', 'orbit', 'target', { count: 2, size: .35, spread: .48, height: .13, opacity: .5 }) },
  decoy: { color: '#efbc73', layer: layer('knock-ring', 'pulse', 'target', { size: .95, height: .06, ground: true, opacity: .45 }) },
  crumb: { color: '#c7a777', layer: layer('ink-stain', 'pulse', 'target', { count: 3, size: .17, spread: .44, height: .05, ground: true, opacity: .45 }) },
  sprout: { color: '#a3dba3', layer: layer('sprout', 'rise', 'target', { count: 2, size: .30, spread: .51, height: .10, opacity: .45 }) },
  shelter: { color: '#f4db95', layer: layer('shield-facet', 'orbit', 'target', { count: 3, size: .28, spread: .59, height: .17, opacity: .35 }) },
};

/** Each composition is authored from the existing skill's cafe action and intent. */
export const CARD_EFFECT_RECIPES: Record<string, CardEffectRecipe> = {
  ...ROSTER_EFFECT_RECIPES,
  'mochi-1': recipe('Door knock', '#efba65', '#fff1bb', 'blunt', 'push', 'hostile', [
    layer('handle', 'pulse', 'caster', { start: .04, end: .42, size: .42, height: .35, offset: [.6, 0, 0] }),
    layer('door', 'rise', 'target', { size: 1.35, height: .42, offset: [.65, 0, .25] }),
    layer('knock-ring', 'expand', 'target', { start: .44, end: .71, count: 2, size: .85, height: .2, spread: .18 }),
    layer('seam', 'burst', 'target', { start: .54, count: 5, size: .22, spread: 1.0, accent: true }),
  ]),
  'mochi-2': recipe('Warm welcome', '#ffc777', '#fff3c6', 'hearth', 'rise', 'friendly', [
    layer('lantern', 'pulse', 'caster', { start: .05, end: .44, size: .55, height: .55, offset: [-.6, 0, 0] }),
    layer('lantern', 'projectile', 'target', { start: .34, end: .62, size: .65, height: .4 }),
    layer('light-pool', 'expand', 'target', { start: .47, end: .97, size: 1.6, ground: true, height: .05 }),
    layer('spark', 'rise', 'target', { start: .54, count: 7, size: .12, spread: .85, height: .4, accent: true }),
  ]),
  'mochi-3': recipe('Apron crossing', '#e6bb8b', '#ffe8b4', 'thread', 'right', 'friendly', [
    layer('seam', 'pulse', 'caster', { start: .06, end: .42, size: .8, ground: true, height: .06 }),
    layer('apron', 'cross', 'target', { size: .85, count: 2, spread: .65, height: .25 }),
    layer('bow', 'rise', 'target', { start: .56, size: .8, height: .25, offset: [.65, 0, 0], accent: true }),
    layer('seam', 'sweep', 'target', { start: .49, size: .6, count: 3, ground: true, height: .07, spread: 1.2 }),
  ]),
  'mochi-4': recipe('Last light shelter', '#f6c46a', '#fff4cf', 'holy', 'wide', 'friendly', [
    layer('window', 'orbit', 'caster', { start: .06, end: .48, size: .4, count: 3, spread: .85, height: .3 }),
    layer('roof', 'rise', 'all-targets', { start: .36, end: .95, size: 1.2, height: .4, offset: [0, 0, -.45] }),
    layer('lantern', 'hold', 'all-targets', { start: .45, size: .45, height: .4, offset: [.65, 0, 0] }),
    layer('shield-facet', 'orbit', 'all-targets', { start: .49, count: 3, size: .48, spread: .7, height: .18, accent: true }),
    layer('light-pool', 'expand', 'all-targets', { start: .45, size: 1.4, ground: true, height: .06 }),
  ], { ultimate: true, durations: [650, 250, 105, 280, 280] }),
  'soot-1': recipe('Cocoa spark', '#cd875f', '#ffd5a0', 'ember', 'left', 'hostile', [
    layer('ember', 'pulse', 'caster', { start: .06, end: .42, size: .4, height: .3, offset: [-.5, 0, 0] }),
    layer('ember', 'projectile', 'target', { start: .36, end: .59, size: .5, height: .5 }),
    layer('spark', 'burst', 'target', { start: .48, count: 9, size: .25, spread: 1.1, height: .22, accent: true }),
    layer('ink-stain', 'expand', 'target', { start: .58, size: .6, ground: true, height: .055, opacity: .4 }),
  ]),
  'soot-2': recipe('Black cup', '#9a81cb', '#d7b5f0', 'ink', 'right', 'hostile', [
    layer('crescent', 'pulse', 'caster', { start: .05, end: .40, size: .6, height: .3, offset: [.6, 0, 0] }),
    layer('cup', 'projectile', 'target', { start: .32, end: .62, size: .85, height: .5 }),
    layer('ink-drop', 'pour', 'target', { start: .44, count: 5, size: .24, spread: .45, height: .9 }),
    layer('ink-stain', 'expand', 'target', { start: .50, size: 1.25, ground: true, height: .06 }),
    layer('steam', 'rise', 'target', { start: .64, size: .55, height: .25, offset: [.65, 0, 0], accent: true }),
  ]),
  'soot-3': recipe('Lantern wick', '#dc8d70', '#ffe0a1', 'ember', 'push', 'hostile', [
    layer('wick', 'rise', 'caster', { start: .03, end: .45, size: .7, height: .5, offset: [-.6, 0, 0] }),
    layer('flame', 'projectile', 'target', { start: .35, end: .6, size: .65, height: .25 }),
    layer('lantern', 'expand', 'target', { start: .47, end: .78, size: 1.2, height: .35, offset: [.7, 0, 0] }),
    layer('flame', 'rise', 'target', { start: .53, count: 4, size: .55, spread: .85, height: .4 }),
    layer('comet', 'burst', 'target', { start: .52, count: 6, size: .25, spread: 1.3, accent: true }),
  ], { shake: .9, durations: [630, 230, 105, 270, 340] }),
  'soot-4': recipe('Midnight service', '#b396eb', '#ffe5ad', 'moon', 'left', 'hostile', [
    layer('tray', 'rise', 'caster', { start: .04, end: .49, size: 1.25, height: .4, offset: [-.6, 0, 0] }),
    layer('star', 'orbit', 'caster', { start: .10, end: .52, count: 5, size: .25, spread: 1.0, height: .4, accent: true }),
    layer('lantern', 'fall', 'all-targets', { start: .35, end: .78, count: 3, size: .58, spread: .95, height: 1.1 }),
    layer('crescent', 'expand', 'all-targets', { start: .5, size: 1.2, height: .15, ground: true }),
    layer('comet', 'burst', 'all-targets', { start: .53, count: 7, size: .25, spread: 1.1, accent: true }),
  ], { ultimate: true, durations: [680, 250, 110, 280, 280], shake: 1.1 }),
  'clover-1': recipe('Leaf tap', '#89c99a', '#e8efb7', 'garden', 'right', 'hostile', [
    layer('stem', 'rise', 'caster', { start: .06, end: .42, size: .65, height: .3, offset: [.55, 0, 0] }),
    layer('leaf', 'projectile', 'target', { start: .32, end: .61, count: 2, size: .55, spread: .3, height: .38 }),
    layer('leaf', 'burst', 'target', { start: .50, count: 5, size: .37, spread: .9, accent: true }),
    layer('sprout', 'rise', 'caster', { start: .63, size: .5, height: .16, offset: [-.5, 0, 0] }),
  ]),
  'clover-2': recipe('Patient steep', '#92cba9', '#f5e6b8', 'tide', 'rise', 'friendly', [
    layer('cup', 'pulse', 'caster', { start: .03, end: .44, size: .65, height: .3, offset: [.6, 0, 0] }),
    layer('droplet', 'pour', 'target', { start: .34, end: .68, count: 5, size: .3, spread: .35, height: .8 }),
    layer('cup', 'hold', 'target', { start: .42, size: .9, height: .27, offset: [.65, 0, 0] }),
    layer('steam', 'rise', 'target', { start: .52, size: .65, height: .4, offset: [.65, 0, 0], accent: true }),
    layer('bubble', 'orbit', 'target', { start: .59, count: 4, size: .22, spread: .7, height: .16 }),
  ]),
  'clover-3': recipe('Clearleaf rinse', '#8ed6c4', '#e6f1c3', 'tide', 'left', 'friendly', [
    layer('wreath', 'pulse', 'caster', { start: .04, end: .45, size: .8, ground: true, height: .07 }),
    layer('wave', 'sweep', 'all-targets', { start: .34, count: 2, size: 1.0, spread: 1.1, height: .18 }),
    layer('wreath', 'expand', 'all-targets', { start: .52, size: 1.5, ground: true, height: .07 }),
    layer('droplet', 'burst', 'all-targets', { start: .50, count: 6, size: .24, spread: .9, accent: true }),
    layer('petal', 'rise', 'all-targets', { start: .64, count: 4, size: .25, spread: .7, height: .3 }),
  ]),
  'clover-4': recipe('Greenhouse morning', '#91c990', '#fff0b6', 'garden', 'rise', 'friendly', [
    layer('stem', 'rise', 'caster', { start: .05, end: .48, count: 3, size: .7, spread: .8, height: .18 }),
    layer('greenhouse', 'rise', 'all-targets', { start: .34, size: 1.4, height: .35, offset: [0, 0, -.5] }),
    layer('sprout', 'rise', 'all-targets', { start: .47, count: 4, size: .6, spread: .8, height: .13 }),
    layer('petal', 'orbit', 'all-targets', { start: .54, count: 7, size: .27, spread: 1.0, height: .36, accent: true }),
    layer('window', 'expand', 'all-targets', { start: .42, size: 1.4, ground: true, height: .06, opacity: .4 }),
  ], { ultimate: true, durations: [670, 250, 90, 280, 280] }),
  'enemy:button-guard': recipe('Button brace', '#d9b47c', '#f7e4aa', 'hearth', 'push', 'friendly', [
    layer('button', 'pulse', 'caster', { start: .04, end: .45, size: .8, height: .35, offset: [.6, 0, 0] }),
    layer('button', 'expand', 'all-targets', { start: .4, size: 1.2, height: .18, ground: true }),
    layer('shield-facet', 'rise', 'all-targets', { start: .48, count: 3, size: .52, spread: .7, height: .22 }),
    layer('seam', 'orbit', 'all-targets', { start: .56, count: 4, size: .3, spread: .8, height: .16, accent: true }),
  ]),
  'enemy:sock-skipper': recipe('Pocket skip', '#dca2b1', '#ffe1bc', 'slash', 'right', 'hostile', [
    layer('sock', 'pulse', 'caster', { start: .04, end: .44, size: .6, height: .25, offset: [-.6, 0, 0] }),
    layer('sock', 'cross', 'target', { start: .35, count: 2, size: .65, height: .25, spread: 1.0 }),
    layer('bow', 'burst', 'target', { start: .50, count: 4, size: .3, spread: .8 }),
    layer('comet', 'sweep', 'caster', { start: .65, count: 3, size: .28, spread: .9, height: .16, accent: true }),
  ]),
  'enemy:spool-ram': recipe('Spool charge', '#cba7ce', '#f6d7af', 'blunt', 'push', 'hostile', [
    layer('spool', 'pulse', 'caster', { start: .02, end: .45, size: .85, height: .3, offset: [.6, 0, 0] }),
    layer('spool', 'projectile', 'target', { start: .36, end: .60, size: 1.1, height: .2, turns: 1.0 }),
    layer('seam', 'sweep', 'target', { start: .48, count: 5, size: .6, spread: 1.4, height: .07, ground: true }),
    layer('knock-ring', 'burst', 'target', { start: .54, count: 3, size: .35, spread: 1.1, accent: true }),
  ], { shake: 1.0, durations: [700, 250, 105, 270, 320] }),
  'enemy:needle-moth': recipe('Needle rain', '#86c7dd', '#dce8fb', 'pierce', 'left', 'hostile', [
    layer('wing', 'pulse', 'caster', { start: .03, end: .44, size: .8, height: .35, offset: [-.65, 0, 0] }),
    layer('needle', 'fall', 'target', { start: .35, count: 7, size: .55, spread: 1.0, height: 1.2, turns: -.3 }),
    layer('spark', 'expand', 'target', { start: .51, count: 3, size: .45, spread: .6, height: .14, ground: true }),
    layer('wing', 'rise', 'target', { start: .64, count: 3, size: .3, spread: .85, height: .25, accent: true }),
  ]),
  'enemy:teacup-healer': recipe('Teacup refill', '#a9d9b7', '#fff1cc', 'tide', 'rise', 'friendly', [
    layer('steam', 'pulse', 'caster', { start: .04, end: .42, size: .75, height: .35, offset: [.6, 0, 0] }),
    layer('cup', 'orbit', 'target', { start: .34, count: 2, size: .58, spread: .8, height: .3 }),
    layer('droplet', 'rise', 'target', { start: .46, count: 6, size: .25, spread: .7, height: .7, accent: true }),
    layer('bubble', 'expand', 'target', { start: .52, size: 1.6, ground: true, height: .06 }),
  ]),
  'enemy:yarn-giant': recipe('Loomfall', '#c29491', '#f2ca9b', 'thread', 'wide', 'hostile', [
    layer('spool', 'orbit', 'caster', { start: .03, end: .46, count: 2, size: .8, spread: 1.1, height: .4 }),
    layer('yarn-fan', 'fall', 'all-targets', { start: .35, size: 1.7, height: 1.2 }),
    layer('knot', 'cross', 'all-targets', { start: .48, count: 2, size: .65, spread: .8, height: .16 }),
    layer('seam', 'expand', 'all-targets', { start: .54, size: 1.8, ground: true, height: .07, accent: true }),
  ], { shake: 1.1, durations: [780, 260, 110, 290, 330] }),
  'enemy:binding-thread': recipe('Tightening knot', '#ba9bd1', '#eccee7', 'thread', 'right', 'hostile', [
    layer('knot', 'pulse', 'caster', { start: .05, end: .43, size: .6, height: .18, offset: [.55, 0, 0] }),
    layer('wick', 'projectile', 'target', { start: .35, end: .59, size: .7, height: .18 }),
    layer('knot', 'orbit', 'target', { start: .48, count: 3, size: .48, spread: .65, height: .15 }),
    layer('seam', 'cross', 'target', { start: .56, count: 2, size: 1.0, spread: .55, ground: true, height: .08, accent: true }),
  ]),
  'enemy:practice-cushion': recipe('Cushion bump', '#d9b4a1', '#f8e2bf', 'blunt', 'push', 'hostile', [
    layer('cushion', 'pulse', 'caster', { start: .05, end: .44, size: .8, height: .15, offset: [-.6, 0, 0] }),
    layer('cushion', 'projectile', 'target', { start: .35, end: .61, size: .85, height: .15 }),
    layer('bubble', 'burst', 'target', { start: .51, count: 7, size: .23, spread: .85, height: .3, accent: true }),
    layer('petal', 'fall', 'target', { start: .63, count: 4, size: .28, spread: .7, height: .5 }),
  ], { shake: .18 }),
  'mochi-passive': recipe('Door keeper', '#e8b565', '#fff0bf', 'hearth', 'push', 'friendly', [
    layer('handle', 'rise', 'caster', { start: .12, end: .93, size: .52, height: .25, offset: [.6, 0, 0] }),
    layer('shield-facet', 'pulse', 'caster', { start: .20, size: .65, ground: true, height: .07 }),
    layer('spark', 'orbit', 'caster', { start: .30, count: 3, size: .16, spread: .6, height: .16, accent: true }),
  ]),
  'soot-passive': recipe('Ash reader', '#ad8fd5', '#f7d9a9', 'ember', 'left', 'friendly', [
    layer('ember', 'rise', 'caster', { start: .10, end: .94, count: 4, size: .2, spread: .6, height: .35 }),
    layer('wick', 'orbit', 'caster', { start: .22, count: 2, size: .48, spread: .7, height: .2 }),
    layer('crescent', 'pulse', 'caster', { start: .28, size: .8, ground: true, height: .07, accent: true }),
  ]),
  'clover-passive': recipe('Second steep', '#91cfa5', '#ecf4c9', 'garden', 'rise', 'friendly', [
    layer('leaf', 'sweep', 'caster', { start: .10, count: 3, size: .3, spread: .7, height: .22 }),
    layer('bubble', 'rise', 'caster', { start: .22, count: 4, size: .18, spread: .6, height: .4, accent: true }),
    layer('stem', 'pulse', 'caster', { start: .29, size: .5, height: .25, offset: [-.65, 0, 0] }),
  ]),
};

/** Palette, numeric parameters and layer count cannot create a new signature. */
export function cardEffectSignature(recipe: CardEffectRecipe) {
  return [...new Set(recipe.layers.map(item =>
    `${item.primitive}/${item.motion}/${item.anchor}/${item.ground ? 'ground' : 'upright'}`))].sort().join('|');
}

const enemyBasics: [string, string, CardEffectPrimitive, CardEffectPrimitive][] = [
  ['button-guard', 'Button tap', 'button', 'seam'],
  ['sock-skipper', 'Sock kick', 'sock', 'comet'],
  ['spool-ram', 'Spool bump', 'spool', 'spark'],
  ['needle-moth', 'Needle stitch', 'needle', 'wing'],
  ['teacup-healer', 'Saucer tap', 'tray', 'droplet'],
  ['yarn-giant', 'Yarn sweep', 'yarn-fan', 'knot'],
  ['binding-thread', 'Thread tug', 'knot', 'wick'],
  ['practice-cushion', 'Soft nudge', 'cushion', 'petal'],
];
for (const [owner, name, primary, residue] of enemyBasics) {
  const signature = CARD_EFFECT_RECIPES[`enemy:${owner}`]!;
  CARD_EFFECT_RECIPES[`enemy:${owner}:basic`] = { ...signature, name, target: 'hostile',
    durations: [600, 200, 80, 220, 250], shake: .3,
    layers: [
      layer(primary, 'pulse', 'caster', { start: .08, end: .45, size: .45, height: .2, offset: [.55, 0, 0] }),
      layer(primary, 'projectile', 'target', { start: .40, end: .66, size: .6, height: .2 }),
      layer(residue, 'expand', 'target', { start: .55, end: .92, size: .7, height: .08, ground: true, accent: true }),
    ],
  };
}
