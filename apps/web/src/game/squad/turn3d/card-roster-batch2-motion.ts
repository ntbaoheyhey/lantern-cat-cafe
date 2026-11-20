/** Original gesture tables: baker's weight, paper puppetry and a careful medic. */
import type { CardClipDefinition, CardPose } from './card-motion-data';
import type { Motion } from './choreography';
const clip = (id: string, duration: number, keys: [number, CardPose][], motion: Partial<Motion> = {}): CardClipDefinition => ({
  id, duration, keys: [[0, {}], ...keys, [1, {}]],
  travel: { travel: 0, arc: 0, side: 0, float: 0, hold: 75, ...motion },
});
export const BATCH2_SKILL_CLIPS: Record<string, CardClipDefinition[]> = {
  biscuit: [
    // Both paws roll forward from a low, wide stance, then pull back the pin.
    clip('biscuit-1', 1.12, [
      [.18, { armL: [-.4, -.25, .65], armR: [-.4, .25, -.65], motion: [.28, 0, 0], head: [.12, 0, 0], shift: [0, -.13, -.08], stretch: [1.12, .82, 1.07] }],
      [.40, { armL: [-1.6, -.05, .55], armR: [-1.6, .05, -.55], motion: [.35, 0, 0], head: [-.07, 0, 0], shift: [0, -.06, .24] }],
      [.61, { armL: [-.5, -.3, .7], armR: [-.5, .3, -.7], motion: [.06, -.08, 0], footL: [.25, .1, 0], shift: [0, .09, -.035], stretch: [.96, 1.08, .98] }],
      [.82, { armL: [-.2, -.1, .15], armR: [-.2, .1, -.15], shift: [0, -.025, .02] }],
    ], { travel: .37, arc: .015 }),
    // Lateral heel-toe exchange; the receiving palm remains below the face.
    clip('biscuit-2', 1.46, [
      [.18, { footL: [.4, .3, -.25], footR: [-.15, -.15, .13], motion: [0, -.28, .22], armL: [-.4, -.25, 1.05], head: [0, .16, -.08], shift: [-.16, .04, 0] }],
      [.40, { footL: [-.2, -.2, -.1], footR: [.55, -.25, .25], motion: [-.08, .3, -.20], armR: [-.45, .3, -1.4], armL: [-.25, -.1, .25], shift: [.20, .12, .06] }],
      [.64, { motion: [.07, .18, -.10], armR: [-.8, .15, -.9], armL: [-.55, -.2, .4], head: [.05, -.16, .05], footR: [-.18, .1, 0], shift: [.11, -.06, .04] }],
      [.84, { motion: [0, -.06, .04], shift: [-.035, .02, 0] }],
    ], { side: .30, arc: .06, travel: .04 }),
    // A pin raised diagonally, a short downward cut, and a deliberate full stop.
    clip('biscuit-3', 1.65, [
      [.18, { motion: [-.12, -.34, .17], armR: [-2.35, .25, -.6], armL: [-1.3, -.35, .1], head: [-.16, .15, -.06], shift: [-.09, .13, -.08] }],
      [.44, { motion: [.35, .27, -.15], armR: [-.6, -.4, -.1], armL: [-.45, .35, .65], head: [.12, -.10, .02], shift: [.10, -.18, .21], stretch: [1.13, .78, 1.10] }],
      [.60, { armR: [-.7, -.3, -.05], armL: [-.4, .2, .55], motion: [.23, .18, -.08], shift: [.06, -.10, .15] }],
      [.82, { motion: [-.06, -.08, .04], head: [-.04, .05, 0], shift: [-.02, .06, -.03] }],
    ], { travel: .47, hold: 110 }),
    // Three measured marching beats, not a generic jumping ultimate.
    clip('biscuit-4', 1.79, [
      [.17, { footL: [.9, .05, -.10], armR: [-1.65, .2, -.3], armL: [.25, -.1, .4], motion: [-.06, .2, -.08], shift: [.06, .16, -.04] }],
      [.35, { footL: [-.2, 0, 0], footR: [.85, -.05, .10], armL: [-1.6, -.2, .4], armR: [.25, .1, -.3], motion: [-.06, -.24, .10], shift: [-.08, .15, .07] }],
      [.52, { footL: [.7, .1, -.08], footR: [-.2, 0, 0], armR: [-2.0, .1, -.3], armL: [-.3, -.1, .4], motion: [.08, .20, -.06], shift: [.08, .13, .16] }],
      [.70, { armL: [-.9, -.1, 1.0], armR: [-.9, .1, -1.0], motion: [.16, 0, 0], shift: [0, -.12, .12], stretch: [1.08, .84, 1.08] }],
      [.88, { head: [-.08, 0, 0], armL: [-.25, 0, .25], armR: [-.25, 0, -.25], shift: [0, .04, .03] }],
    ], { travel: .28, side: -.10, hold: 105 }),
  ],
  inkcap: [
    // Pull an invisible thread between two pinched paws, then release the right.
    clip('inkcap-1', 1.13, [
      [.19, { armL: [-1.0, -.5, 1.1], armR: [-1.0, .5, -1.1], motion: [-.1, .14, -.05], head: [.08, -.1, .03], shift: [.06, .06, -.03] }],
      [.40, { armL: [-.75, -.7, 1.5], armR: [-1.5, -.45, .2], motion: [.06, -.32, .12], head: [-.08, .14, -.02], shift: [-.13, -.035, .07] }],
      [.62, { armR: [-.4, .45, -1.5], armL: [-.8, -.3, .6], motion: [-.1, .22, -.08], shift: [.11, .05, .03] }],
      [.83, { armR: [-.2, .1, -.25], armL: [-.3, -.1, .2], shift: [-.02, .015, 0] }],
    ], { side: -.15, travel: .05 }),
    // Shield the mouth with one paw; blow a low fan of spores from the other.
    clip('inkcap-2', 1.49, [
      [.21, { armL: [-1.8, -.3, .15], armR: [-.4, .1, -.4], head: [.20, -.13, -.03], motion: [.18, -.12, .05], shift: [-.04, -.06, -.02] }],
      [.42, { armL: [-1.6, -.15, .3], armR: [-1.0, .3, -1.5], head: [.07, .18, .04], motion: [.04, .24, -.10], shift: [.09, .035, .12] }],
      [.63, { armL: [-.8, -.3, .8], armR: [-.75, -.2, -1.05], head: [-.05, -.10, 0], shift: [-.06, .07, .035] }],
      [.84, { armL: [-.35, -.1, .25], motion: [-.03, 0, 0], shift: [0, .02, 0] }],
    ]),
    // Fold the paper at the waist, set it down, then show empty paws.
    clip('inkcap-3', 1.64, [
      [.20, { armL: [-.9, .5, -.3], armR: [-.9, -.5, .3], motion: [.27, 0, 0], head: [.25, 0, 0], shift: [0, -.13, .08], stretch: [1.08, .84, 1.04] }],
      [.41, { armL: [-1.1, -.4, .8], armR: [-1.1, .4, -.8], motion: [.35, .10, -.05], head: [.13, -.08, 0], shift: [.09, -.17, .17] }],
      [.64, { armL: [-1.75, -.2, 1.2], armR: [-1.75, .2, -1.2], motion: [-.15, 0, 0], head: [-.13, 0, 0], shift: [0, .17, -.06], stretch: [.96, 1.11, .97] }],
      [.84, { armL: [-.7, -.1, .4], armR: [-.7, .1, -.4], motion: [.04, 0, 0], shift: [0, -.025, 0] }],
    ], { hold: 90 }),
    // Cross high wrists into a canopy and sink gently beneath it.
    clip('inkcap-4', 1.78, [
      [.18, { armL: [-1.0, .8, -.3], armR: [-1.0, -.8, .3], motion: [.10, .12, 0], head: [.12, -.10, 0], shift: [.02, -.065, 0] }],
      [.39, { armL: [-2.5, .6, .3], armR: [-2.5, -.6, -.3], motion: [-.18, 0, 0], head: [-.18, 0, 0], shift: [0, .23, -.04], stretch: [.90, 1.16, .94] }],
      [.59, { armL: [-2.2, -.4, 1.0], armR: [-2.2, .4, -1.0], motion: [.08, -.15, .05], head: [.08, .12, -.02], shift: [-.07, .07, .03] }],
      [.77, { armL: [-1.35, -.3, 1.4], armR: [-1.35, .3, -1.4], motion: [.17, .12, -.03], shift: [.06, -.14, .04], stretch: [1.05, .85, 1.04] }],
      [.89, { armL: [-.4, -.1, .35], armR: [-.4, .1, -.35], shift: [0, .035, 0] }],
    ], { float: .07, hold: 105 }),
  ],
  cinnamon: [
    // Pinch at the left cheek, then sprinkle across a short diagonal.
    clip('cinnamon-1', 1.11, [
      [.20, { armL: [-2.0, -.3, .35], armR: [-.3, .1, -.6], head: [.08, -.18, -.10], motion: [.04, -.15, .08], shift: [-.05, .045, -.02] }],
      [.43, { armL: [-1.5, .2, 1.35], armR: [-.5, .3, -.5], head: [-.05, .15, .06], motion: [-.10, .2, -.08], shift: [.09, .12, .06] }],
      [.64, { armL: [-.7, -.6, .65], motion: [.12, -.1, .06], head: [.08, 0, -.03], shift: [-.06, -.045, .11] }],
      [.83, { armL: [-.35, -.1, .15], armR: [-.2, .1, -.2], shift: [.015, .025, 0] }],
    ], { travel: .13, side: .06, arc: .03 }),
    // Cradle and offer a cup low, with an attentive forward lean.
    clip('cinnamon-2', 1.48, [
      [.19, { armL: [-.7, .35, .1], armR: [-.7, -.35, -.1], head: [.14, 0, 0], motion: [.10, 0, 0], shift: [0, -.05, -.03] }],
      [.41, { armL: [-1.15, -.25, .4], armR: [-1.15, .25, -.4], head: [.16, -.14, .05], motion: [.28, .12, -.06], shift: [.08, -.12, .23] }],
      [.65, { armL: [-1.0, -.2, .6], armR: [-.55, .15, -.2], head: [.08, .12, -.03], motion: [.12, -.08, .03], shift: [-.04, -.04, .12] }],
      [.84, { armL: [-.3, -.1, .2], armR: [-.25, .1, -.2], head: [-.04, 0, 0], shift: [0, .04, 0] }],
    ], { travel: .10 }),
    // Hold a cloth by one corner and wipe a broad S from shoulder to hip.
    clip('cinnamon-3', 1.61, [
      [.18, { armR: [-2.1, .3, -.7], armL: [-.65, -.4, .6], motion: [-.08, -.2, .15], head: [-.12, .10, -.06], shift: [-.09, .09, -.02] }],
      [.39, { armR: [-1.2, -.65, .4], armL: [-.9, -.1, .4], motion: [.08, .25, -.15], head: [.05, -.16, .04], shift: [.11, -.04, .09] }],
      [.61, { armR: [-.4, .5, -1.1], armL: [-.5, -.3, .8], motion: [.18, -.25, .14], head: [.12, .12, -.04], shift: [-.13, -.09, .05] }],
      [.81, { armR: [-1.0, .1, -.3], motion: [-.06, .10, -.04], head: [-.04, -.05, 0], shift: [.04, .07, 0] }],
    ], { side: .13 }),
    // Kneel, set a serving bell, and raise one open palm as the ally returns.
    clip('cinnamon-4', 1.78, [
      [.18, { motion: [.30, 0, 0], head: [.20, 0, 0], armL: [-.8, -.1, .3], armR: [-.8, .1, -.3], footL: [.3, .1, 0], shift: [0, -.22, .11], stretch: [1.12, .76, 1.07] }],
      [.38, { motion: [.18, -.14, .05], armL: [-1.25, -.35, .7], armR: [-.45, .15, -.25], head: [.12, .10, 0], shift: [-.07, -.12, .18] }],
      [.58, { motion: [-.13, .17, -.06], armL: [-2.15, -.1, .45], armR: [-.8, .25, -.9], head: [-.18, -.12, .05], shift: [.08, .20, .02], stretch: [.93, 1.13, .97] }],
      [.77, { armL: [-1.7, -.35, 1.1], armR: [-1.0, .15, -.6], motion: [-.06, 0, 0], head: [-.1, 0, 0], shift: [0, .09, .08] }],
      [.89, { armL: [-.5, -.1, .3], armR: [-.3, .1, -.3], shift: [0, -.025, 0] }],
    ], { hold: 110 }),
  ],
};
