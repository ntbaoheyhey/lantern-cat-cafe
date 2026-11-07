/** Original night-watch, silk-stage and garden gestures. Neutral endpoints are explicit. */
import type { CardClipDefinition, CardPose } from './card-motion-data';
import type { Motion } from './choreography';
const c = (id: string, duration: number, keys: [number, CardPose][], motion: Partial<Motion> = {}): CardClipDefinition => ({ id, duration, keys: [[0, {}], ...keys, [1, {}]], travel: { travel: 0, arc: 0, float: 0, side: 0, hold: 75, ...motion } });
export const BATCH3_SKILL_CLIPS: Record<string, CardClipDefinition[]> = {
  brioche: [
    // A small bell is rung at the right hip twice, with a planted watchman's stance.
    c('brioche-1', 1.13, [
      [.19, { armR: [-.15, .2, -1.35], armL: [-.6, -.3, .35], head: [.05, .12, -.03], motion: [.04, -.18, .14], shift: [-.09, -.04, -.02] }],
      [.39, { armR: [-.75, -.15, -.4], motion: [-.06, .14, -.09], head: [-.03, -.08, .04], shift: [.08, .05, .08] }],
      [.57, { armR: [-.25, .4, -1.6], armL: [-.7, -.1, .2], motion: [.08, -.23, .12], shift: [-.12, -.02, .04] }],
      [.78, { armR: [-.65, -.1, -.45], motion: [-.03, .1, -.06], shift: [.035, .035, .02] }],
    ], { travel: .18, side: -.08 }),
    // Unfold a blanket below the chin, then tuck one corner around an ally.
    c('brioche-2', 1.48, [
      [.20, { armL: [-1.2, .2, .2], armR: [-1.2, -.2, -.2], head: [.18, 0, 0], motion: [.12, 0, 0], shift: [0, -.07, .02] }],
      [.41, { armL: [-1.1, -.8, 1.8], armR: [-1.1, .8, -1.8], head: [-.08, -.05, .02], motion: [-.07, .14, -.06], shift: [.04, .12, .02], stretch: [.96, 1.08, .98] }],
      [.62, { armL: [-1.4, .1, .7], armR: [-.45, -.5, .3], head: [.1, .14, -.05], motion: [.25, -.22, .10], shift: [-.14, -.09, .18] }],
      [.83, { armL: [-.6, -.1, .3], armR: [-.4, .1, -.2], motion: [-.02, .05, 0], shift: [.025, .035, 0] }],
    ], { travel: .07, side: -.09 }),
    // Straighten a collar with crossed paws, then snap both elbows out sharply.
    c('brioche-3', 1.63, [
      [.21, { armL: [-1.7, .65, -.35], armR: [-1.7, -.65, .35], head: [.15, 0, 0], motion: [.08, 0, 0], shift: [0, -.06, -.06] }],
      [.42, { armL: [-.4, -.6, 1.65], armR: [-.4, .6, -1.65], motion: [-.18, .10, -.03], head: [-.13, -.08, 0], shift: [.04, .18, .12], stretch: [.94, 1.12, .98] }],
      [.60, { armL: [-.65, -.35, 1.0], armR: [-.65, .35, -1.0], motion: [.16, -.15, .05], shift: [-.05, -.10, .07] }],
      [.82, { armL: [-.3, -.1, .35], armR: [-.3, .1, -.35], head: [.03, 0, 0], shift: [.01, .04, .02] }],
    ], { travel: .14, hold: 100 }),
    // Trace a constellation one point at a time, and draw its ends to the apron.
    c('brioche-4', 1.79, [
      [.16, { armR: [-2.2, -.2, -.35], armL: [-.5, -.1, .3], head: [-.20, .12, .03], motion: [-.08, -.2, .10], shift: [-.08, .09, -.03] }],
      [.34, { armR: [-1.8, .4, -1.15], armL: [-1.6, -.3, .75], head: [-.12, -.15, -.03], motion: [-.10, .23, -.12], shift: [.10, .14, .03] }],
      [.53, { armR: [-.7, -.5, .15], armL: [-2.1, -.2, .3], head: [-.17, .08, .04], motion: [-.04, -.12, .05], shift: [-.06, .20, .06] }],
      [.72, { armL: [-.75, .35, .15], armR: [-.75, -.35, -.15], motion: [.22, 0, 0], head: [.15, 0, 0], shift: [0, -.13, .11], stretch: [1.08, .86, 1.06] }],
      [.89, { armL: [-.45, -.1, .4], armR: [-.45, .1, -.4], head: [-.05, 0, 0], shift: [0, .045, 0] }],
    ], { float: .05, hold: 100 }),
  ],
  velvet: [
    // Low, sideways fencing nick with the left arm; head stays level.
    c('velvet-1', 1.10, [
      [.18, { armL: [-.25, -.8, .3], armR: [.3, .4, -.9], motion: [.06, .4, -.18], head: [0, -.17, .06], footL: [.25, .1, -.12], shift: [.13, -.05, -.06] }],
      [.40, { armL: [-1.45, .3, .15], armR: [-.15, .2, -1.1], motion: [.18, -.45, .16], head: [-.04, .18, -.05], shift: [-.18, -.11, .26], stretch: [1.08, .86, 1.04] }],
      [.62, { armL: [-.5, -.6, .7], armR: [.15, .1, -.6], motion: [-.06, .25, -.10], shift: [.09, .06, -.02] }],
      [.83, { armL: [-.2, -.1, .15], motion: [.015, -.06, .03], shift: [-.02, -.015, .015] }],
    ], { travel: .49, side: -.18, arc: .035 }),
    // A candle jumps from one paw to the other, then is tapped towards the foes.
    c('velvet-2', 1.47, [
      [.17, { armR: [-1.1, .25, -.85], armL: [-.25, -.2, .2], motion: [-.1, -.22, .1], head: [-.13, .14, -.03], shift: [-.10, .08, -.02] }],
      [.35, { armL: [-1.85, -.2, .65], armR: [-.45, .1, -.3], motion: [-.14, .20, -.10], head: [-.16, -.13, .04], shift: [.11, .20, .02] }],
      [.55, { armL: [-.65, .4, .3], armR: [-1.75, -.35, -.35], motion: [.18, -.12, .05], head: [.08, .08, -.02], shift: [-.07, -.065, .17] }],
      [.78, { armL: [-.15, -.1, .45], armR: [-.5, .2, -.5], motion: [-.04, .1, -.03], shift: [.035, .06, .015] }],
    ], { side: .12, arc: .08 }),
    // Reach with an open right claw, curl back at the wrist and hide the flame.
    c('velvet-3', 1.62, [
      [.20, { armR: [-1.75, -.55, .25], armL: [.25, -.2, .8], motion: [.28, -.24, .12], head: [.10, .15, -.05], shift: [-.12, -.08, .22] }],
      [.42, { armR: [-1.6, .55, -.85], armL: [-.35, -.5, .55], motion: [-.18, .32, -.17], head: [-.12, -.12, .04], shift: [.15, .13, -.08] }],
      [.63, { armR: [-1.1, -.65, .2], armL: [-1.2, .6, -.15], motion: [.06, -.12, .04], head: [.13, 0, 0], shift: [-.035, -.04, .03] }],
      [.83, { armR: [-.3, .1, -.4], armL: [-.2, -.1, .4], motion: [-.03, .05, -.02], shift: [.02, .03, 0] }],
    ], { travel: .20, side: -.15, hold: 90 }),
    // Pull one curtain high and one low, vanish into a crouch, then flourish.
    c('velvet-4', 1.79, [
      [.18, { armL: [-2.35, -.3, 1.2], armR: [-.25, .4, -1.4], motion: [-.13, .28, -.20], head: [-.12, -.15, .05], shift: [.12, .19, -.05], stretch: [.93, 1.12, .96] }],
      [.39, { armL: [-.9, .6, -.3], armR: [-1.8, -.65, .3], motion: [.35, -.32, .20], head: [.20, .17, -.06], shift: [-.17, -.24, .17], stretch: [1.15, .74, 1.10] }],
      [.60, { armL: [-1.9, -.7, 1.5], armR: [-.7, .5, -1.1], motion: [-.12, .38, -.14], head: [-.1, -.18, .03], footR: [.7, .1, .1], shift: [.16, .24, .10] }],
      [.79, { armL: [-.5, -.2, .7], armR: [-1.0, .3, -.6], motion: [.12, -.17, .07], head: [.05, .10, 0], shift: [-.065, -.07, .035] }],
      [.90, { head: [-.05, 0, -.03], shift: [0, .035, 0] }],
    ], { travel: .40, side: .20, arc: .10, hold: 110 }),
  ],
  marigold: [
    // Push a seed below the ground with two fingers, then lift the new stitch.
    c('marigold-1', 1.13, [
      [.20, { armL: [-.6, -.1, .3], armR: [-.75, .25, -.5], motion: [.33, .1, -.05], head: [.22, -.08, .02], shift: [.07, -.18, .12], stretch: [1.10, .80, 1.06] }],
      [.42, { armR: [-1.15, -.2, -.1], armL: [-.8, -.3, .5], motion: [.18, -.17, .08], head: [.08, .12, -.03], shift: [-.08, -.06, .21] }],
      [.64, { armR: [-1.75, .3, -.75], armL: [-.4, -.1, .3], motion: [-.12, .13, -.06], head: [-.14, -.10, .04], shift: [.055, .14, .02] }],
      [.83, { armR: [-.45, .1, -.35], motion: [.04, -.04, .02], shift: [0, -.015, .015] }],
    ], { travel: .09 }),
    // Ring a hanging flower with the left paw and listen to its long answer.
    c('marigold-2', 1.48, [
      [.17, { armL: [-2.3, -.2, .85], armR: [-.35, .1, -.35], head: [-.22, -.12, -.08], motion: [-.12, -.15, .12], shift: [-.11, .15, 0] }],
      [.39, { armL: [-1.2, .4, .25], armR: [-.6, .25, -.5], head: [.02, .18, .09], motion: [.1, .23, -.13], shift: [.12, -.055, .12] }],
      [.62, { armL: [-.9, -.25, 1.0], armR: [-.2, .1, -.25], head: [-.08, -.18, -.10], motion: [-.03, -.10, .06], shift: [-.04, .075, .02] }],
      [.84, { armL: [-.35, -.1, .3], head: [.03, .03, .02], shift: [.015, .015, 0] }],
    ], { side: .08 }),
    // Open pruning shears beside the hip; two staggered close-and-release cuts.
    c('marigold-3', 1.63, [
      [.18, { armL: [-.45, -.5, 1.0], armR: [-.45, .5, -1.0], motion: [.12, .3, -.1], head: [.10, -.15, .04], shift: [.10, -.05, -.03] }],
      [.37, { armL: [-1.35, .3, .15], armR: [-1.0, -.5, .15], motion: [.20, -.25, .1], head: [.05, .15, -.04], shift: [-.12, -.12, .17] }],
      [.54, { armL: [-.7, -.6, 1.25], armR: [-.8, .6, -1.1], motion: [-.08, .22, -.09], shift: [.11, .12, .04] }],
      [.70, { armL: [-1.45, .25, .2], armR: [-1.1, -.3, -.1], motion: [.16, -.18, .07], shift: [-.08, -.065, .15] }],
      [.87, { armL: [-.35, -.1, .3], armR: [-.35, .1, -.3], shift: [.015, .025, 0] }],
    ], { travel: .16, side: .06 }),
    // Lift a watering can over the shoulder, tip it in a circle, then bow.
    c('marigold-4', 1.78, [
      [.19, { armR: [-2.2, .55, -.8], armL: [-1.1, -.4, .6], motion: [-.15, -.3, .16], head: [-.15, .18, -.06], shift: [-.13, .16, -.04] }],
      [.40, { armR: [-1.8, -.3, -1.5], armL: [-.6, -.2, 1.25], motion: [-.08, .3, -.18], head: [-.05, -.14, .08], shift: [.16, .19, .09] }],
      [.61, { armR: [-1.5, .3, -.8], armL: [-1.4, -.4, .5], motion: [.10, -.2, .08], head: [.08, .12, -.04], shift: [-.10, .05, .15] }],
      [.78, { armL: [-.65, -.1, .35], armR: [-.65, .1, -.35], motion: [.30, 0, 0], head: [.20, 0, 0], shift: [0, -.16, .11], stretch: [1.08, .84, 1.05] }],
      [.90, { motion: [-.04, 0, 0], head: [-.04, 0, 0], shift: [0, .045, 0] }],
    ], { float: .03, hold: 100 }),
  ],
};
