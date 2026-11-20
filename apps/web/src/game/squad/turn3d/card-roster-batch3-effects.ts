import type { CardEffectLayer, CardEffectRecipe } from './card-effect-data';
import type { CardEffectPrimitive } from './card-effect-primitives';
const l = (primitive: CardEffectPrimitive, motion: CardEffectLayer['motion'], anchor: CardEffectLayer['anchor'], o: Partial<CardEffectLayer> = {}): CardEffectLayer => ({ primitive, motion, anchor, start: .32, end: .94, count: 1, size: .8, spread: .7, height: .25, turns: .25, offset: [0, 0, 0], aspect: [1, 1, 1], ground: false, accent: false, opacity: .85, ...o });
const r = (name: string, color: string, accent: string, element: string, shot: CardEffectRecipe['shot'], target: CardEffectRecipe['target'], layers: CardEffectLayer[], ultimate = false): CardEffectRecipe => ({ name, color, accent, element, shot, target, layers, ultimate, durations: ultimate ? [670, 250, 105, 280, 280] : [600, 240, 90, 260, 320], shake: target === 'friendly' ? 0 : ultimate ? 1 : .4 });
export const BATCH3_EFFECT_RECIPES: Record<string, CardEffectRecipe> = {
  'brioche-1': r('Bell patrol', '#b3acd7', '#fff1bc', 'moon', 'right', 'hostile', [
    l('night-bell', 'sweep', 'caster', { start: .05, end: .43, size: .6, offset: [.6, 0, 0] }),
    l('night-bell', 'projectile', 'target', { start: .34, end: .63, size: .9 }),
    l('collar', 'cross', 'target', { start: .49, count: 2, size: .85, spread: .7 }),
    l('star', 'orbit', 'caster', { start: .60, count: 4, size: .28, spread: .7, height: .08, accent: true }),
  ]),
  'brioche-2': r('Borrowed blanket', '#aca6d7', '#e8e4ff', 'moon', 'left', 'friendly', [
    l('blanket', 'hold', 'caster', { start: .05, end: .44, size: .60, offset: [-.65, 0, 0] }),
    l('blanket', 'projectile', 'target', { start: .34, end: .64, size: 1.3 }),
    l('collar', 'rise', 'target', { start: .49, size: .9, height: .16, offset: [.7, 0, 0] }),
    l('crescent', 'pour', 'target', { start: .58, count: 5, size: .30, height: .8, spread: .8, accent: true }),
  ]),
  'brioche-3': r('Starched collar', '#b7afdb', '#f8eed2', 'moon', 'push', 'hostile', [
    l('collar', 'pulse', 'caster', { start: .06, end: .43, size: .6, offset: [.6, 0, 0] }),
    l('collar', 'expand', 'target', { start: .34, size: 1.5, ground: true, height: .06 }),
    l('shield-facet', 'cross', 'target', { start: .46, count: 3, size: .75, spread: 1.0 }),
    l('night-bell', 'burst', 'target', { start: .59, count: 3, size: .5, spread: 1.05, accent: true }),
  ]),
  'brioche-4': r('Constellation apron', '#b2a2d4', '#fff3c6', 'moon', 'wide', 'friendly', [
    l('constellation', 'rise', 'caster', { start: .04, end: .46, size: .8, offset: [-.7, 0, 0] }),
    l('constellation', 'hold', 'all-targets', { start: .32, size: 1.45, height: .2, offset: [.65, 0, 0] }),
    l('blanket', 'cross', 'all-targets', { start: .44, count: 2, size: .8, spread: 1.0 }),
    l('night-bell', 'orbit', 'all-targets', { start: .55, count: 3, size: .4, spread: .9, height: .13, accent: true }),
    l('apron', 'pulse', 'all-targets', { start: .64, size: 1.5, ground: true, height: .05 }),
  ], true),
  'velvet-1': r('Silk nick', '#b18dce', '#ecd6ff', 'slash', 'left', 'hostile', [
    l('spindle', 'hold', 'caster', { start: .05, end: .43, size: .65, offset: [-.6, 0, 0] }),
    l('spindle', 'projectile', 'target', { start: .34, end: .58, size: 1.0, turns: -.45 }),
    l('veil', 'sweep', 'target', { start: .47, size: 1.05, height: .12, turns: .65 }),
    l('ink-drop', 'burst', 'target', { start: .59, count: 5, size: .3, spread: .9, accent: true }),
  ]),
  'velvet-2': r('Candle bounce', '#af98d9', '#ffe2b5', 'tide', 'right', 'hostile', [
    l('wick', 'rise', 'caster', { start: .04, end: .44, size: .65, offset: [.6, 0, 0] }),
    l('night-bell', 'projectile', 'all-targets', { start: .34, end: .66, size: .8 }),
    l('flame', 'fall', 'all-targets', { start: .44, count: 3, size: .5, spread: .65, height: .7 }),
    l('spindle', 'cross', 'all-targets', { start: .58, count: 2, size: .7, spread: .8, accent: true }),
    l('wave', 'pulse', 'all-targets', { start: .65, size: 1.15, ground: true, height: .05 }),
  ]),
  'velvet-3': r('Stolen flame', '#a695d7', '#e5d9f8', 'tide', 'push', 'hostile', [
    l('veil', 'pulse', 'caster', { start: .06, end: .42, size: .65, offset: [.6, 0, 0] }),
    l('spindle', 'orbit', 'target', { start: .34, count: 3, size: .6, spread: .9, height: .14 }),
    l('flame', 'projectile', 'caster', { start: .49, end: .74, count: 2, size: .6, spread: .45 }),
    l('collar', 'burst', 'target', { start: .55, count: 3, size: .5, spread: .95 }),
    l('crescent', 'expand', 'caster', { start: .66, size: 1.1, ground: true, height: .055, accent: true }),
  ]),
  'velvet-4': r('Velvet curtain', '#ac8bc6', '#f8d9ee', 'slash', 'wide', 'hostile', [
    l('spindle', 'cross', 'caster', { start: .05, end: .45, count: 2, size: .6, spread: .65 }),
    l('veil', 'fall', 'target', { start: .33, end: .80, count: 2, size: 1.35, spread: .9, height: .7 }),
    l('spindle', 'sweep', 'target', { start: .47, size: 1.4, turns: -.7, height: .14 }),
    l('paper-cat', 'rise', 'caster', { start: .56, size: 1.0, offset: [.75, 0, 0] }),
    l('constellation', 'burst', 'target', { start: .64, count: 3, size: .6, spread: 1.1, accent: true }),
  ], true),
  'marigold-1': r('Seed stitch', '#b1c98b', '#f9e8a9', 'garden', 'push', 'hostile', [
    l('seed-pod', 'hold', 'caster', { start: .05, end: .43, size: .55, offset: [.6, 0, 0] }),
    l('seed-pod', 'projectile', 'target', { start: .34, end: .62, size: .95 }),
    l('needle', 'cross', 'target', { start: .48, count: 3, size: .8, spread: .8, ground: true, height: .055 }),
    l('flower-bell', 'rise', 'caster', { start: .59, count: 2, size: .5, spread: .65, height: .13, accent: true }),
  ]),
  'marigold-2': r('Garden bell', '#b4ce8e', '#ffe9ac', 'garden', 'rise', 'friendly', [
    l('flower-bell', 'sweep', 'caster', { start: .05, end: .45, size: .65, offset: [-.6, 0, 0] }),
    l('flower-bell', 'rise', 'all-targets', { start: .34, size: 1.0, offset: [.65, 0, 0], height: .12 }),
    l('petal', 'fall', 'all-targets', { start: .45, count: 5, size: .35, spread: .9, height: .85 }),
    l('seed-pod', 'orbit', 'all-targets', { start: .59, count: 3, size: .4, spread: .8, height: .10, accent: true }),
  ]),
  'marigold-3': r('Spring pruning', '#9eb987', '#f0d9a2', 'garden', 'left', 'hostile', [
    l('shears', 'pulse', 'caster', { start: .05, end: .43, size: .65, offset: [.6, 0, 0] }),
    l('shears', 'cross', 'target', { start: .34, count: 2, size: 1.05, spread: .75 }),
    l('leaf', 'burst', 'target', { start: .47, count: 5, size: .45, spread: 1.05 }),
    l('seed-pod', 'pour', 'target', { start: .56, count: 3, size: .4, spread: .7, height: .75, accent: true }),
    l('stem', 'sweep', 'target', { start: .64, size: 1.25, ground: true, height: .06 }),
  ]),
  'marigold-4': r('First tea blossom', '#bad49a', '#fff1bc', 'garden', 'wide', 'friendly', [
    l('watering-can', 'rise', 'caster', { start: .05, end: .45, size: .75, offset: [.65, 0, 0] }),
    l('watering-can', 'pour', 'all-targets', { start: .33, end: .75, size: 1.0, height: .65, offset: [.8, 0, 0] }),
    l('flower-bell', 'rise', 'all-targets', { start: .45, count: 2, size: .85, spread: .9, height: .18 }),
    l('droplet', 'fall', 'all-targets', { start: .52, count: 5, size: .28, spread: .65, height: .9 }),
    l('seed-pod', 'cross', 'all-targets', { start: .61, count: 3, size: .5, spread: 1.0, accent: true }),
    l('wreath', 'pulse', 'all-targets', { start: .67, size: 1.8, ground: true, height: .055 }),
  ], true),
  'brioche-passive': r('Night watch', '#b3aad7', '#fbe7bb', 'moon', 'push', 'friendly', [
    l('night-bell', 'rise', 'caster', { start: .1, size: .65, offset: [.65, 0, 0] }),
    l('constellation', 'expand', 'caster', { start: .25, size: .95, ground: true, height: .055 }),
    l('collar', 'orbit', 'caster', { start: .39, count: 3, size: .4, spread: .75, height: .13, accent: true }),
  ]),
  'velvet-passive': r('Lost flame', '#b096d1', '#f8dced', 'tide', 'right', 'friendly', [
    l('spindle', 'fall', 'caster', { start: .1, size: .65, offset: [-.6, 0, 0], height: .6 }),
    l('veil', 'orbit', 'caster', { start: .24, count: 2, size: .50, spread: .75, height: .13 }),
    l('wick', 'cross', 'caster', { start: .38, count: 3, size: .40, spread: .8, accent: true }),
  ]),
  'marigold-passive': r('First leaf', '#abc68c', '#fff0b8', 'garden', 'rise', 'friendly', [
    l('seed-pod', 'pulse', 'caster', { start: .1, size: .65, offset: [.6, 0, 0] }),
    l('flower-bell', 'orbit', 'caster', { start: .25, count: 2, size: .55, spread: .75, height: .1 }),
    l('watering-can', 'expand', 'caster', { start: .39, size: .9, ground: true, height: .055, accent: true }),
  ]),
};
