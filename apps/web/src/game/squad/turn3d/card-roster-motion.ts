/** Original skill gestures for the extended cast. Each key is an authored pose,
 * not a seeded variation of one swing. Endpoints deliberately return to rest. */
import type { CardClipDefinition, CardPose } from './card-motion-data';
import type { Motion } from './choreography';
const clip = (id: string, duration: number, poses: [number, CardPose][], travel: Motion): CardClipDefinition =>
  ({ id, duration, keys: [[0, {}], ...poses, [1, {}]], travel });
const still: Motion = { travel: 0, arc: 0, float: 0, side: 0, hold: 70 };
export const ROSTER_SKILL_CLIPS: Record<string, CardClipDefinition[]> = {
  panko: [
    // Catch the pan beside the hip, push the elbow, then recoil into cover.
    clip('panko-1', 1.10, [
      [.18, { motion: [.08, .27, -.14], armR: [-.3, .1, -1.0], armL: [-.65, -.2, .3], shift: [-.04, -.07, -.05] }],
      [.39, { motion: [-.05, -.30, .13], armR: [-1.25, -.4, -.2], armL: [-.8, -.1, .15], footR: [.25, .1, 0], shift: [.07, .03, .12] }],
      [.57, { motion: [.12, .10, -.06], armR: [-.5, .35, -.85], head: [.06, -.10, .03], shift: [-.015, -.04, .035], stretch: [1.06, .91, 1.04] }],
      [.79, { armR: [-.35, .1, -.25], armL: [-.35, -.1, .2], shift: [0, .02, 0] }],
    ], { ...still, travel: .34, side: .10, arc: .025 }),
    // Duck under a broad loaf with both forearms above the cheeks.
    clip('panko-2', 1.42, [
      [.20, { motion: [.22, 0, .03], head: [.14, 0, -.03], armL: [-.5, -.2, .4], armR: [-.5, .2, -.4], shift: [0, -.10, -.03], stretch: [1.10, .83, 1.06] }],
      [.43, { motion: [.08, -.06, 0], armL: [-1.9, -.45, .30], armR: [-1.9, .45, -.30], head: [-.08, .03, 0], shift: [0, -.03, .01] }],
      [.64, { motion: [.12, .06, -.03], armL: [-1.65, -.3, .42], armR: [-1.65, .3, -.42], shift: [0, -.055, 0], stretch: [1.04, .93, 1.03] }],
      [.83, { armL: [-.45, -.2, .15], armR: [-.45, .2, -.15], head: [.04, 0, 0] }],
    ], still),
    // Offer the left saucer then the right; a broad, low countering stance.
    clip('panko-3', 1.60, [
      [.17, { motion: [.05, -.22, .09], armL: [-.7, -.3, .22], armR: [-.3, .15, -.2], head: [.07, .16, 0], shift: [-.08, -.035, 0] }],
      [.36, { motion: [-.04, .12, -.08], armL: [-.85, -.7, 1.35], armR: [-.55, .2, -.3], shift: [.02, .035, .025] }],
      [.57, { motion: [-.04, -.12, .08], armL: [-.65, -.2, .3], armR: [-.85, .7, -1.35], head: [-.05, -.15, 0], shift: [-.02, .035, .025] }],
      [.76, { armL: [-.5, -.25, .9], armR: [-.5, .25, -.9], shift: [0, -.035, .02] }],
    ], still),
    // Pull an oven door from the floor and plant it: elbows lock, body settles.
    clip('panko-4', 1.76, [
      [.19, { motion: [.30, 0, 0], armL: [-.7, -.2, .15], armR: [-.7, .2, -.15], head: [.20, 0, 0], shift: [0, -.14, .04], stretch: [1.12, .80, 1.08] }],
      [.40, { motion: [-.17, 0, 0], armL: [-2.1, -.1, .1], armR: [-2.1, .1, -.1], head: [-.16, 0, 0], shift: [0, .15, -.03], stretch: [.96, 1.08, .98] }],
      [.56, { motion: [.17, 0, .03], armL: [-1.1, -.1, .26], armR: [-1.1, .1, -.26], shift: [0, -.13, .1], stretch: [1.10, .84, 1.05] }],
      [.78, { motion: [.04, .03, -.02], armL: [-.95, -.12, .3], armR: [-.95, .12, -.3], head: [-.08, .02, 0], shift: [0, .02, .04] }],
    ], { ...still, hold: 105 }),
  ],
  mallow: [
    // Whisk circles above the shoulder before snapping into a forward flick.
    clip('mallow-1', 1.08, [
      [.18, { motion: [.08, -.18, .12], armR: [-1.6, .5, -.8], armL: [.1, -.2, .4], head: [.08, .1, -.04], shift: [-.04, -.04, -.03] }],
      [.38, { motion: [-.13, .18, -.12], armR: [-2.15, -.2, .15], armL: [-.4, -.2, .55], shift: [.04, .11, .05] }],
      [.54, { motion: [.12, .1, -.06], armR: [-.65, -.65, -.4], armL: [.12, .1, .2], shift: [.06, -.04, .09], stretch: [1.04, .92, 1.02] }],
      [.77, { armR: [-.2, .1, -.2], motion: [-.025, -.06, .04], shift: [0, .03, 0] }],
    ], { ...still, travel: .23, arc: .08, side: -.06 }),
    // Open opposing palms from a compressed ember; wide lateral split.
    clip('mallow-2', 1.46, [
      [.22, { armL: [-1.1, -.5, -.15], armR: [-1.1, .5, .15], motion: [.15, 0, 0], head: [.13, 0, 0], shift: [0, -.065, 0] }],
      [.44, { armL: [-.8, -.2, 1.7], armR: [-.8, .2, -1.7], motion: [-.12, 0, 0], head: [-.12, 0, 0], shift: [0, .12, .04], stretch: [.94, 1.12, .95] }],
      [.62, { armL: [-.5, -.5, 1.15], armR: [-.5, .5, -1.15], motion: [.04, -.10, .05], shift: [0, -.025, .03] }],
      [.82, { armL: [.1, -.1, .32], armR: [.1, .1, -.32], head: [.03, 0, 0] }],
    ], still),
    // Crush a sugar cube in one high fist, drop the weight into a single stomp.
    clip('mallow-3', 1.62, [
      [.20, { armL: [-.5, -.2, .2], armR: [-2.35, .1, -.25], motion: [-.11, -.2, -.1], footR: [.65, 0, 0], head: [-.18, .1, .05], shift: [-.05, .12, -.04] }],
      [.43, { armR: [-.8, -.3, -.5], armL: [-.35, -.2, .65], motion: [.25, .22, .12], footR: [-.25, 0, 0], shift: [.08, -.12, .11], stretch: [1.10, .83, 1.06] }],
      [.60, { armR: [-1.2, .1, -.1], motion: [-.08, .06, -.04], shift: [.025, .085, .04], stretch: [.96, 1.07, .98] }],
      [.81, { armR: [-.25, .1, -.2], motion: [.03, -.03, .02], shift: [0, -.015, 0] }],
    ], { ...still, travel: .12, arc: .06, hold: 105 }),
    // Conduct a closing fan of fire, rising on one foot then sweeping across.
    clip('mallow-4', 1.78, [
      [.16, { motion: [.17, -.3, .14], armL: [-.4, -.3, .3], armR: [-.8, .7, -.4], head: [.10, .16, -.06], shift: [-.10, -.06, 0] }],
      [.35, { motion: [-.16, .3, -.14], armL: [-2.1, -.1, .3], armR: [-2.4, .1, -.25], footL: [.4, .1, -.1], shift: [.09, .23, .02], stretch: [.92, 1.14, .94] }],
      [.55, { motion: [-.08, -.26, .10], armL: [-.8, -.6, 1.45], armR: [-1.5, -.4, -.15], head: [-.06, .13, .03], shift: [-.08, .13, .08] }],
      [.73, { motion: [.13, .16, -.07], armL: [-.5, -.1, .25], armR: [-.7, .4, -1.35], shift: [.05, -.065, .04], stretch: [1.05, .91, 1.04] }],
      [.89, { armR: [-.2, .1, -.3], shift: [0, .025, 0] }],
    ], { ...still, float: .12, hold: 110 }),
  ],
  sorrel: [
    // A precise shallow scoop, rather than a full-arm weapon swing.
    clip('sorrel-1', 1.10, [
      [.24, { motion: [.09, .14, -.06], armL: [-.8, -.4, .15], armR: [-.2, .1, -.35], head: [.15, -.10, .04], shift: [.025, -.025, -.015] }],
      [.45, { armL: [-1.25, .3, .65], armR: [-.4, .2, -.2], motion: [-.04, -.16, .07], head: [-.07, .10, -.03], shift: [-.025, .04, .07] }],
      [.65, { armL: [-.85, -.1, .9], motion: [.02, .07, -.03], shift: [.015, .01, .025] }],
      [.83, { armL: [-.20, -.1, .12], head: [.02, -.025, 0] }],
    ], { ...still, travel: .08, side: .02 }),
    // Tilt a cold flask almost horizontally, then catch the last drop.
    clip('sorrel-2', 1.52, [
      [.20, { armR: [-.7, .2, -.1], armL: [-.8, -.2, .2], head: [.10, -.14, -.04], shift: [0, -.025, 0] }],
      [.40, { armR: [-1.45, -.35, -1.1], armL: [-.45, -.2, .4], motion: [-.06, .25, -.13], head: [-.06, -.14, .08], shift: [.08, .045, .03] }],
      [.64, { armR: [-1.65, .15, -.5], armL: [-1.0, -.1, .8], motion: [-.02, .12, -.05], shift: [.045, .025, .02] }],
      [.84, { armR: [-.3, .1, -.1], armL: [-.4, -.1, .2], motion: [.02, -.04, .02] }],
    ], still),
    // Pass a crescent from left palm to right, then offer it with a bow.
    clip('sorrel-3', 1.62, [
      [.19, { armL: [-1.3, -.5, .85], armR: [-.4, .1, -.2], motion: [-.04, -.15, .04], head: [-.08, .13, -.04], shift: [-.045, .045, 0] }],
      [.40, { armL: [-1.1, .4, .25], armR: [-1.1, -.4, -.25], motion: [.03, 0, 0], head: [.12, 0, 0], shift: [0, 0, .045] }],
      [.62, { armL: [-.45, -.1, .2], armR: [-1.5, .2, -.8], motion: [.12, .12, -.045], head: [.16, -.09, .02], shift: [.05, -.025, .09] }],
      [.82, { armR: [-.55, .1, -.3], motion: [-.035, -.03, .015], head: [-.04, 0, 0], shift: [0, .025, .015] }],
    ], still),
    // Lift the teapot, serve in a measured circle, and place it carefully down.
    clip('sorrel-4', 1.76, [
      [.19, { armL: [-.8, -.2, .1], armR: [-.8, .2, -.1], motion: [.20, 0, 0], head: [.16, 0, 0], shift: [0, -.07, .04] }],
      [.38, { armL: [-1.7, -.15, .65], armR: [-1.7, .15, -.65], motion: [-.10, -.16, .06], head: [-.12, .12, -.02], shift: [-.045, .12, 0] }],
      [.56, { armL: [-1.15, -.4, .95], armR: [-1.25, -.2, -.3], motion: [-.04, .25, -.09], head: [-.05, -.15, .03], shift: [.065, .07, .04] }],
      [.74, { armL: [-.65, -.1, .2], armR: [-.65, .1, -.2], motion: [.17, .02, 0], head: [.12, 0, 0], shift: [0, -.045, .08] }],
      [.88, { armL: [-.2, 0, .2], armR: [-.2, 0, -.2], shift: [0, .02, .015] }],
    ], { ...still, hold: 90 }),
  ],
};
