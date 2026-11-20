import type { CardEffectLayer, CardEffectRecipe } from './card-effect-data';
import type { CardEffectPrimitive } from './card-effect-primitives';
const layer = (primitive: CardEffectPrimitive, motion: CardEffectLayer['motion'], anchor: CardEffectLayer['anchor'], options: Partial<CardEffectLayer> = {}): CardEffectLayer => ({
  primitive, motion, anchor, start: .32, end: .94, count: 1, size: .8, spread: .7, height: .25,
  turns: .25, offset: [0, 0, 0], aspect: [1, 1, 1], ground: false, accent: false, opacity: .85, ...options,
});
const recipe = (name: string, color: string, accent: string, element: string, shot: CardEffectRecipe['shot'], target: CardEffectRecipe['target'], layers: CardEffectLayer[], ultimate = false): CardEffectRecipe => ({
  name, color, accent, element, shot, target, layers, ultimate,
  durations: ultimate ? [670, 250, 105, 280, 280] : [600, 240, 90, 260, 320],
  shake: target === 'friendly' ? 0 : ultimate ? 1 : .45,
});
export const ROSTER_EFFECT_RECIPES: Record<string, CardEffectRecipe> = {
  'panko-1': recipe('Pan reply', '#e4aa65', '#fff0ba', 'blunt', 'right', 'hostile', [
    layer('pan', 'pulse', 'caster', { start: .06, end: .42, size: .65, offset: [.6, 0, 0] }),
    layer('pan', 'sweep', 'target', { start: .35, end: .67, size: 1.05, turns: -.4, height: .18 }),
    layer('tray', 'expand', 'caster', { start: .53, size: 1.1, ground: true, height: .06 }),
    layer('spark', 'cross', 'target', { start: .5, count: 4, size: .25, spread: .8, accent: true }),
  ]),
  'panko-2': recipe('Bread cover', '#d7a56c', '#ffebaa', 'hearth', 'push', 'friendly', [
    layer('bread', 'rise', 'caster', { start: .06, end: .5, size: .6, offset: [-.6, 0, 0] }),
    layer('bread', 'hold', 'target', { start: .36, size: 1.5, height: .4, offset: [0, 0, -.5] }),
    layer('shield-facet', 'cross', 'target', { start: .49, count: 2, size: .6, height: .2, spread: .9 }),
    layer('ember', 'orbit', 'target', { start: .56, count: 5, size: .16, height: .12, spread: .8, accent: true }),
  ]),
  'panko-3': recipe('Crust return', '#e3b780', '#fff3ca', 'blunt', 'wide', 'friendly', [
    layer('pan', 'orbit', 'caster', { start: .06, end: .46, count: 2, size: .45, spread: .8 }),
    layer('tray', 'cross', 'all-targets', { start: .34, count: 2, size: .8, spread: .8, height: .2 }),
    layer('bread', 'orbit', 'all-targets', { start: .48, count: 3, size: .45, spread: .75, height: .1 }),
    layer('seam', 'burst', 'all-targets', { start: .62, count: 4, size: .25, spread: .9, accent: true }),
  ]),
  'panko-4': recipe('Oven door', '#e7a34f', '#fff0b1', 'hearth', 'push', 'friendly', [
    layer('handle', 'fall', 'caster', { start: .06, end: .45, count: 2, size: .55, spread: .7 }),
    layer('oven', 'rise', 'caster', { start: .33, size: 1.8, height: .5, offset: [0, 0, -.7] }),
    layer('pan', 'orbit', 'caster', { start: .47, count: 3, size: .6, spread: .95, height: .14 }),
    layer('flame', 'pulse', 'caster', { start: .56, count: 4, size: .45, spread: .85, height: .1, accent: true }),
    layer('tray', 'expand', 'caster', { start: .50, size: 1.9, ground: true, height: .05 }),
  ], true),
  'mallow-1': recipe('Whisk flare', '#f59571', '#ffe4a3', 'ember', 'left', 'hostile', [
    layer('whisk', 'orbit', 'caster', { start: .04, end: .45, size: .7, height: .3, spread: .55, turns: .65 }),
    layer('whisk', 'projectile', 'target', { start: .36, end: .60, size: .85, turns: -.5 }),
    layer('flame', 'sweep', 'target', { start: .49, count: 3, size: .55, spread: .9 }),
    layer('ember', 'fall', 'target', { start: .62, count: 5, size: .17, height: .65, accent: true }),
  ]),
  'mallow-2': recipe('Split ember', '#f49c80', '#fff2bc', 'ember', 'wide', 'hostile', [
    layer('ember', 'hold', 'caster', { start: .07, end: .42, size: .5, offset: [.55, 0, 0] }),
    layer('flame', 'cross', 'all-targets', { start: .35, count: 2, size: 1.05, spread: 1.1, height: .18 }),
    layer('shield-facet', 'burst', 'all-targets', { start: .50, count: 5, size: .32, spread: .9 }),
    layer('whisk', 'expand', 'all-targets', { start: .59, size: .7, ground: true, height: .06, accent: true }),
  ]),
  'mallow-3': recipe('Burnt sugar', '#e87a5d', '#ffdb96', 'ember', 'push', 'hostile', [
    layer('shield-facet', 'pour', 'caster', { start: .05, end: .44, count: 4, size: .35, height: .9, spread: .4 }),
    layer('ember', 'fall', 'target', { start: .34, end: .61, size: 1.25, height: 1.2 }),
    layer('ink-stain', 'pulse', 'target', { start: .48, size: 1.45, ground: true, height: .055 }),
    layer('whisk', 'burst', 'target', { start: .52, count: 3, size: .5, spread: 1.1 }),
    layer('spark', 'rise', 'target', { start: .61, count: 7, size: .2, height: .45, spread: .8, accent: true }),
  ]),
  'mallow-4': recipe('Closing blaze', '#f79070', '#fff1b2', 'ember', 'right', 'hostile', [
    layer('whisk', 'rise', 'caster', { start: .05, end: .48, count: 3, size: .6, spread: .8 }),
    layer('oven', 'fall', 'all-targets', { start: .34, end: .74, size: 1.2, height: 1.0, offset: [0, 0, -.5] }),
    layer('flame', 'cross', 'all-targets', { start: .46, count: 3, size: .8, spread: 1.05, height: .25 }),
    layer('ember', 'orbit', 'all-targets', { start: .55, count: 5, size: .26, height: .15, spread: 1.0, turns: .8, accent: true }),
    layer('wick', 'sweep', 'all-targets', { start: .62, count: 2, size: 1.0, ground: true, height: .06 }),
  ], true),
  'sorrel-1': recipe('Moon spoon', '#9abbdc', '#edf2ff', 'moon', 'left', 'hostile', [
    layer('spoon', 'rise', 'caster', { start: .05, end: .44, size: .55, offset: [-.6, 0, 0] }),
    layer('spoon', 'projectile', 'target', { start: .36, end: .63, size: .8, turns: .35 }),
    layer('crescent', 'sweep', 'target', { start: .50, size: 1.1, height: .13, ground: true }),
    layer('droplet', 'projectile', 'caster', { start: .65, count: 3, size: .2, spread: .45, accent: true }),
  ]),
  'sorrel-2': recipe('Cold brew', '#7ecbd8', '#dbf2ff', 'tide', 'right', 'hostile', [
    layer('teapot', 'pulse', 'caster', { start: .05, end: .43, size: .65, offset: [.6, 0, 0] }),
    layer('wave', 'projectile', 'target', { start: .34, end: .64, count: 2, size: .7, spread: .35 }),
    layer('droplet', 'fall', 'target', { start: .45, count: 7, size: .32, spread: .8, height: .9 }),
    layer('crescent', 'cross', 'target', { start: .55, count: 2, size: .65, spread: .6, accent: true }),
    layer('bubble', 'pulse', 'target', { start: .64, size: 1.25, ground: true, height: .06 }),
  ]),
  'sorrel-3': recipe('Decanted moon', '#a0b8e6', '#fff4c7', 'moon', 'rise', 'friendly', [
    layer('crescent', 'hold', 'caster', { start: .05, end: .48, size: .65, offset: [-.6, 0, 0] }),
    layer('teapot', 'pour', 'target', { start: .35, end: .70, size: .9, height: .8, offset: [.6, 0, 0] }),
    layer('crescent', 'projectile', 'target', { start: .40, end: .66, size: .75 }),
    layer('shield-facet', 'expand', 'target', { start: .53, size: 1.3, height: .07, ground: true }),
    layer('spoon', 'orbit', 'target', { start: .63, count: 3, size: .36, spread: .75, height: .16, accent: true }),
  ]),
  'sorrel-4': recipe('Shared pot', '#91c5d7', '#f1eecc', 'tide', 'wide', 'friendly', [
    layer('spoon', 'cross', 'caster', { start: .06, end: .46, count: 2, size: .65, spread: .6 }),
    layer('teapot', 'rise', 'caster', { start: .32, end: .80, size: 1.4, height: .5, offset: [.8, 0, 0] }),
    layer('cup', 'rise', 'all-targets', { start: .41, size: .8, height: .25, offset: [.65, 0, 0] }),
    layer('wave', 'pour', 'all-targets', { start: .48, count: 3, size: .5, height: .7, spread: .4 }),
    layer('crescent', 'orbit', 'all-targets', { start: .57, count: 3, size: .45, spread: .85, height: .15, accent: true }),
    layer('tray', 'pulse', 'all-targets', { start: .63, size: 1.3, ground: true, height: .06 }),
  ], true),
  'panko-passive': recipe('Warm crust', '#dfad70', '#ffe7b1', 'hearth', 'push', 'friendly', [
    layer('bread', 'orbit', 'caster', { start: .1, count: 2, size: .35, spread: .7, height: .15 }),
    layer('pan', 'pulse', 'caster', { start: .24, size: .8, ground: true, height: .06 }),
    layer('spark', 'fall', 'caster', { start: .36, count: 4, size: .12, height: .5, accent: true }),
  ]),
  'mallow-passive': recipe('Hot whisk', '#ed916c', '#ffebb5', 'ember', 'left', 'friendly', [
    layer('whisk', 'sweep', 'caster', { start: .1, size: .65, height: .15 }),
    layer('flame', 'orbit', 'caster', { start: .22, count: 3, size: .3, spread: .7, height: .1 }),
    layer('comet', 'rise', 'caster', { start: .35, count: 4, size: .2, height: .4, accent: true }),
  ]),
  'sorrel-passive': recipe('Measured pour', '#94bedc', '#f7eec9', 'tide', 'rise', 'friendly', [
    layer('teapot', 'orbit', 'caster', { start: .1, size: .45, height: .2, spread: .6 }),
    layer('spoon', 'pulse', 'caster', { start: .24, size: .65, ground: true, height: .07 }),
    layer('droplet', 'cross', 'caster', { start: .36, count: 4, size: .2, height: .15, accent: true }),
  ]),
};
