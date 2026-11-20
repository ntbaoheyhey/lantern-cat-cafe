import type { CardEffectLayer, CardEffectRecipe } from './card-effect-data';
import type { CardEffectPrimitive } from './card-effect-primitives';
const l = (primitive: CardEffectPrimitive, motion: CardEffectLayer['motion'], anchor: CardEffectLayer['anchor'], o: Partial<CardEffectLayer> = {}): CardEffectLayer => ({ primitive, motion, anchor, start: .32, end: .94, count: 1, size: .8, spread: .7, height: .25, turns: .25, offset: [0, 0, 0], aspect: [1, 1, 1], ground: false, accent: false, opacity: .85, ...o });
const r = (name: string, color: string, accent: string, element: string, shot: CardEffectRecipe['shot'], target: CardEffectRecipe['target'], layers: CardEffectLayer[], ultimate = false): CardEffectRecipe => ({ name, color, accent, element, shot, target, layers, ultimate, durations: ultimate ? [670, 250, 110, 280, 275] : [600, 240, 90, 260, 320], shake: target === 'friendly' ? 0 : ultimate ? .9 : .4 });
export const BATCH2_EFFECT_RECIPES: Record<string, CardEffectRecipe> = {
  'biscuit-1': r('Rolling pin', '#dca56d', '#fff0bd', 'blunt', 'push', 'hostile', [
    l('roller', 'hold', 'caster', { start: .06, end: .41, size: .75, offset: [.55, 0, 0] }),
    l('roller', 'sweep', 'target', { start: .34, end: .64, size: 1.35, turns: .7, height: .12 }),
    l('seam', 'cross', 'target', { start: .46, count: 3, size: .75, spread: .9, ground: true, height: .05 }),
    l('bread', 'burst', 'target', { start: .59, count: 5, size: .25, spread: 1.1, accent: true }),
  ]),
  'biscuit-2': r('Sideboard step', '#e1b67c', '#f9e9c8', 'hearth', 'left', 'friendly', [
    l('tray', 'pulse', 'caster', { start: .05, end: .44, size: .65, ground: true, height: .04 }),
    l('roller', 'cross', 'all-targets', { start: .34, count: 2, size: .9, spread: .8, height: .1 }),
    l('apron-cloth', 'sweep', 'target', { start: .48, size: 1.1, offset: [.65, 0, 0], turns: -.3 }),
    l('button', 'fall', 'all-targets', { start: .56, count: 4, size: .30, ground: true, height: .055, spread: .8, accent: true }),
  ]),
  'biscuit-3': r('Last crumb', '#d99259', '#ffe7a0', 'blunt', 'right', 'hostile', [
    l('crumb-crown', 'rise', 'caster', { start: .07, end: .43, size: .60, offset: [-.6, 0, 0] }),
    l('roller', 'fall', 'target', { start: .33, end: .57, size: 1.35, height: 1.2, turns: -.35 }),
    l('crumb-crown', 'burst', 'target', { start: .50, count: 3, size: .70, spread: 1.05 }),
    l('shield-facet', 'sweep', 'target', { start: .60, count: 2, size: 1.1, ground: true, height: .05, accent: true }),
  ]),
  'biscuit-4': r('Bakers procession', '#e5b57b', '#fff4c5', 'hearth', 'wide', 'hostile', [
    l('roller', 'rise', 'caster', { start: .06, end: .45, count: 2, size: .6, spread: .7 }),
    l('crumb-crown', 'projectile', 'all-targets', { start: .33, end: .66, count: 2, size: .85, spread: .75 }),
    l('bread', 'cross', 'all-targets', { start: .43, count: 3, size: .65, spread: 1.1 }),
    l('roller', 'orbit', 'all-targets', { start: .58, count: 2, size: .70, spread: .9, height: .14 }),
    l('button', 'pulse', 'all-targets', { start: .65, count: 4, size: .38, spread: 1.0, ground: true, height: .05, accent: true }),
  ], true),
  'inkcap-1': r('Ink thread', '#aa91c8', '#e5d4fa', 'thread', 'left', 'hostile', [
    l('ink-cap', 'hold', 'caster', { start: .05, end: .43, size: .5, offset: [-.6, 0, 0] }),
    l('knot', 'projectile', 'target', { start: .34, end: .60, count: 3, size: .5, spread: .4 }),
    l('ink-cap', 'sweep', 'target', { start: .48, size: 1.05, height: .12 }),
    l('yarn-fan', 'cross', 'target', { start: .58, count: 3, size: 1.0, spread: .7, ground: true, height: .07, accent: true }),
  ]),
  'inkcap-2': r('Quiet spores', '#b59bce', '#ecdfed', 'ink', 'rise', 'hostile', [
    l('ink-cap', 'pulse', 'caster', { start: .06, end: .45, size: .65, offset: [.6, 0, 0] }),
    l('ink-drop', 'pour', 'target', { start: .33, count: 7, size: .3, height: .8, spread: .9 }),
    l('ink-cap', 'fall', 'target', { start: .45, count: 2, size: .65, spread: .6, height: .65 }),
    l('crescent', 'hold', 'target', { start: .58, size: .9, offset: [.65, 0, 0], accent: true }),
    l('ink-stain', 'expand', 'target', { start: .62, size: 1.15, ground: true, height: .055 }),
  ]),
  'inkcap-3': r('Paper decoy', '#c1a3d4', '#fff0d0', 'thread', 'push', 'friendly', [
    l('apron-cloth', 'cross', 'caster', { start: .06, end: .43, count: 2, size: .5, spread: .5 }),
    l('paper-cat', 'rise', 'target', { start: .35, size: 1.4, offset: [.75, 0, 0], height: .15 }),
    l('knot', 'orbit', 'target', { start: .49, count: 3, size: .4, spread: .85, height: .12 }),
    l('seam', 'fall', 'target', { start: .60, count: 5, size: .35, height: .8, spread: .7, accent: true }),
  ]),
  'inkcap-4': r('Dreaming canopy', '#a694cf', '#eae3ff', 'moon', 'wide', 'hostile', [
    l('paper-cat', 'rise', 'caster', { start: .05, end: .45, count: 2, size: .5, spread: .75 }),
    l('ink-cap', 'hold', 'all-targets', { start: .32, end: .82, size: 1.5, height: .55, offset: [0, 0, -.65] }),
    l('crescent', 'fall', 'all-targets', { start: .43, count: 3, size: .5, spread: .8, height: 1.0 }),
    l('paper-cat', 'orbit', 'all-targets', { start: .53, count: 2, size: .60, spread: .95, height: .10 }),
    l('yarn-fan', 'pulse', 'all-targets', { start: .65, size: 1.7, ground: true, height: .055, accent: true }),
  ], true),
  'cinnamon-1': r('Spice pinch', '#e1a07f', '#ffe6bb', 'hearth', 'right', 'hostile', [
    l('spice-star', 'pulse', 'caster', { start: .05, end: .43, size: .50, offset: [-.55, 0, 0] }),
    l('spice-star', 'projectile', 'target', { start: .34, end: .62, count: 3, size: .50, spread: .6 }),
    l('ember', 'pour', 'target', { start: .46, count: 6, size: .20, height: .75, spread: .65 }),
    l('droplet', 'projectile', 'caster', { start: .62, count: 2, size: .3, accent: true }),
  ]),
  'cinnamon-2': r('Comfort cup', '#e7b58a', '#fff4cd', 'hearth', 'push', 'friendly', [
    l('serving-bell', 'hold', 'caster', { start: .06, end: .42, size: .6, offset: [.6, 0, 0] }),
    l('cup', 'rise', 'target', { start: .35, size: 1.15, offset: [.75, 0, 0] }),
    l('spice-star', 'fall', 'target', { start: .46, count: 4, size: .35, spread: .8, height: .7 }),
    l('handle', 'cross', 'target', { start: .55, count: 2, size: .9, spread: .75, height: .15, accent: true }),
    l('tray', 'pulse', 'target', { start: .64, size: 1.45, ground: true, height: .05 }),
  ]),
  'cinnamon-3': r('Clean apron', '#d7ad8c', '#f7f1db', 'hearth', 'left', 'friendly', [
    l('apron-cloth', 'hold', 'caster', { start: .06, end: .45, size: .65, offset: [.6, 0, 0] }),
    l('apron-cloth', 'sweep', 'target', { start: .34, end: .68, size: 1.35, height: .16, turns: -.55 }),
    l('wave', 'cross', 'target', { start: .48, count: 3, size: .8, spread: .75, ground: true, height: .06 }),
    l('spice-star', 'rise', 'target', { start: .60, count: 5, size: .3, spread: .85, height: .3, accent: true }),
  ]),
  'cinnamon-4': r('Second serving', '#e6b27a', '#fff7d5', 'holy', 'rise', 'friendly', [
    l('spice-star', 'orbit', 'caster', { start: .05, end: .45, count: 3, size: .4, spread: .7 }),
    l('serving-bell', 'rise', 'target', { start: .33, end: .72, size: 1.6, offset: [.85, 0, 0], height: .45 }),
    l('apron-cloth', 'cross', 'target', { start: .47, count: 2, size: .8, spread: 1.0 }),
    l('spice-star', 'burst', 'target', { start: .56, count: 7, size: .40, spread: 1.25, accent: true }),
    l('sprout', 'expand', 'target', { start: .65, size: 1.45, ground: true, height: .07 }),
  ], true),
  'biscuit-passive': r('Bakers resolve', '#d9ae77', '#fff0bb', 'hearth', 'push', 'friendly', [
    l('crumb-crown', 'rise', 'caster', { start: .1, size: .7, offset: [.6, 0, 0] }),
    l('roller', 'orbit', 'caster', { start: .25, count: 2, size: .5, spread: .65, height: .12 }),
    l('bread', 'pulse', 'caster', { start: .4, size: .95, ground: true, height: .055, accent: true }),
  ]),
  'inkcap-passive': r('Soft landing', '#ab92c4', '#e8dff3', 'thread', 'left', 'friendly', [
    l('paper-cat', 'fall', 'caster', { start: .1, size: .75, offset: [.65, 0, 0], height: .4 }),
    l('ink-cap', 'expand', 'caster', { start: .26, size: .95, ground: true, height: .06 }),
    l('knot', 'cross', 'caster', { start: .4, count: 3, size: .4, spread: .75, accent: true }),
  ]),
  'cinnamon-passive': r('Ground spice', '#dba17d', '#fff0c2', 'hearth', 'rise', 'friendly', [
    l('spice-star', 'sweep', 'caster', { start: .1, size: .8, height: .12 }),
    l('serving-bell', 'pulse', 'caster', { start: .26, size: .7, offset: [.65, 0, 0] }),
    l('apron-cloth', 'orbit', 'caster', { start: .39, count: 2, size: .4, spread: .75, height: .1, accent: true }),
  ]),
};
