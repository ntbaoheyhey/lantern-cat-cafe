import type { CardClipDefinition } from './card-motion-data';

/** Chapter-one household enemies have gestures tied to their existing intent. */
export const CHAPTER_ONE_ATTACKS: Record<string, CardClipDefinition> = {
  'button-guard': {
    id: 'guardAttack', duration: 1.20,
    travel: { travel: 0, arc: 0, float: .015, side: 0, hold: 70 },
    keys: [
      [0, {}],
      [.25, { motion: [.20, -.13, .03], armL: [-.6, -.45, .12], armR: [-.25, .1, -.2], head: [.12, .10, 0], shift: [0, -.07, -.10], stretch: [1.06, .91, 1.04] }],
      [.47, { motion: [.10, -.2, .04], armL: [-1.25, -.25, .42], armR: [-.85, .3, -.2], head: [-.07, .08, 0], shift: [0, -.065, .03], stretch: [1.08, .90, 1.06] }],
      [.59, { motion: [-.04, .1, -.03], armL: [-1.15, -.12, .55], armR: [-.65, .1, -.15], shift: [0, .04, .02], stretch: [.97, 1.04, .97] }],
      [.80, { motion: [.08, -.04, .02], armL: [-.22, -.1, .08], armR: [.12, 0, .05], shift: [0, .025, -.03] }],
      [1, {}],
    ],
  },
  'sock-skipper': {
    id: 'flankerAttack', duration: 1.16,
    travel: { travel: .65, arc: .24, float: 0, side: -.24, hold: 40 },
    keys: [
      [0, {}],
      [.18, { motion: [.18, .28, -.24], armL: [.2, -.1, .25], armR: [.35, .2, -.3], shift: [.08, -.11, -.09], stretch: [1.12, .82, 1.05] }],
      [.38, { motion: [-.14, -.24, .28], armL: [-.65, -.2, .8], armR: [-1.2, .15, -.55], footL: [.75, 0, -.1], footR: [-.5, 0, .15], shift: [-.08, .29, .06], stretch: [.90, 1.15, .94] }],
      [.53, { motion: [.12, -.12, .12], armL: [-1.1, -.2, .3], armR: [-.55, .3, -.25], shift: [-.03, -.03, .13] }],
      [.71, { motion: [-.10, .14, -.12], footL: [-.3, 0, -.06], footR: [.45, 0, .06], shift: [.04, .10, -.05] }],
      [1, {}],
    ],
  },
  'spool-ram': {
    id: 'chargerAttack', duration: 1.28,
    travel: { travel: .58, arc: 0, float: 0, side: .015, hold: 95 },
    keys: [
      [0, {}],
      [.25, { motion: [.34, 0, 0], head: [.24, 0, 0], armL: [.35, 0, .3], armR: [.35, 0, -.3], shift: [0, -.11, -.18], stretch: [1.10, .84, 1.09] }],
      [.46, { motion: [-.28, 0, 0], head: [-.12, 0, 0], armL: [-.8, -.05, .15], armR: [-.8, .05, -.15], shift: [0, .02, .25], stretch: [.94, 1.04, 1.12] }],
      [.57, { motion: [-.18, 0, 0], shift: [0, -.04, .19], stretch: [1.08, .90, 1.05] }],
      [.78, { motion: [.10, 0, 0], head: [.08, 0, 0], armL: [.15, 0, .1], armR: [.15, 0, -.1], shift: [0, .045, -.055] }],
      [1, {}],
    ],
  },
  'needle-moth': {
    id: 'rangerAttack', duration: 1.22,
    travel: { travel: 0, arc: 0, float: .18, side: .09, hold: 35 },
    keys: [
      [0, {}],
      [.22, { motion: [.10, -.2, .08], wingL: [0, -.8, .18], wingR: [0, .8, -.18], armL: [-.25, -.2, .2], armR: [-.25, .2, -.2], launcher: [.25, 0, 0], shift: [0, -.055, -.04] }],
      [.43, { motion: [-.12, .15, -.10], wingL: [0, .45, -.16], wingR: [0, -.45, .16], armL: [-1.15, -.05, .35], armR: [-1.15, .05, -.35], launcher: [-.55, 0, 0], shift: [.04, .16, .03] }],
      [.57, { motion: [.05, -.08, .07], wingL: [0, -.6, .08], wingR: [0, .6, -.08], launcher: [.18, 0, 0], shift: [-.02, .12, -.02] }],
      [.75, { motion: [-.03, .04, -.03], wingL: [0, .16, 0], wingR: [0, -.16, 0], armL: [-.35, 0, .12], armR: [-.35, 0, -.12], shift: [0, .04, 0] }],
      [1, {}],
    ],
  },
  'teacup-healer': {
    id: 'healerAttack', duration: 1.34,
    travel: { travel: .02, arc: 0, float: .03, side: -.04, hold: 0 },
    keys: [
      [0, {}],
      [.22, { motion: [.02, -.18, -.14], head: [.10, .12, .08], armL: [-.25, -.3, .35], armR: [-.70, .2, -.4], shift: [-.08, -.035, -.02] }],
      [.44, { motion: [-.05, .15, .32], head: [-.03, -.1, -.12], armL: [-.65, -.15, .8], armR: [-1.0, .1, -.5], shift: [.12, .06, .04] }],
      [.60, { motion: [-.02, .1, .25], head: [.02, -.06, -.08], armL: [-.6, -.1, .65], armR: [-.85, .1, -.4], shift: [.09, .035, .07] }],
      [.81, { motion: [.03, -.04, -.08], armL: [-.15, .05, .1], armR: [-.25, -.05, -.1], shift: [-.025, -.02, -.01] }],
      [1, {}],
    ],
  },
  'yarn-giant': {
    id: 'yarnAttack', duration: 1.38,
    travel: { travel: .12, arc: 0, float: 0, side: 0, hold: 100 },
    keys: [
      [0, {}],
      [.23, { motion: [.15, -.12, 0], armL: [-.5, -.1, .4], armR: [-.5, .1, -.4], head: [.12, .08, 0], shift: [0, -.10, -.08], stretch: [1.06, .88, 1.05] }],
      [.42, { motion: [-.24, .08, 0], armL: [-2.15, -.1, .45], armR: [-2.15, .1, -.45], head: [-.18, -.05, 0], shift: [0, .16, -.02], stretch: [.95, 1.08, .97] }],
      [.54, { motion: [.27, .04, 0], armL: [-.65, -.12, .2], armR: [-.65, .12, -.2], head: [.14, 0, 0], shift: [0, -.12, .18], stretch: [1.10, .83, 1.08] }],
      [.72, { motion: [-.08, -.035, 0], armL: [-.35, .05, .15], armR: [-.35, -.05, -.15], shift: [0, .055, -.025] }],
      [1, {}],
    ],
  },
  'binding-thread': {
    id: 'threadAttack', duration: 1.16,
    travel: { travel: .26, arc: .08, float: .025, side: .22, hold: 30 },
    keys: [
      [0, {}],
      [.21, { motion: [.12, -.3, -.2], armL: [-.45, -.6, -.25], armR: [-.45, .6, .25], head: [.08, .18, .1], shift: [-.06, -.05, -.07] }],
      [.42, { motion: [-.10, .32, .18], armL: [-.7, -.15, 1.05], armR: [-.7, .15, -1.05], head: [-.07, -.18, -.08], shift: [.08, .12, .12] }],
      [.59, { motion: [.04, -.14, -.10], armL: [-1.05, -.5, -.10], armR: [-1.05, .5, .10], shift: [-.03, .035, .08] }],
      [.79, { motion: [-.02, .05, .04], armL: [.10, 0, .14], armR: [.10, 0, -.14], shift: [.015, -.015, -.02] }],
      [1, {}],
    ],
  },
  'practice-cushion': {
    id: 'dummyAttack', duration: 1.22,
    travel: { travel: .25, arc: .12, float: 0, side: -.05, hold: 35 },
    keys: [
      [0, {}],
      [.24, { motion: [.06, -.1, .06], armL: [.2, 0, .2], armR: [.2, 0, -.2], shift: [0, -.12, -.04], stretch: [1.14, .78, 1.12] }],
      [.43, { motion: [-.15, .1, -.08], armL: [-.7, -.1, .4], armR: [-.7, .1, -.4], shift: [0, .25, .08], stretch: [.88, 1.18, .92] }],
      [.57, { motion: [.12, .04, -.02], shift: [0, -.07, .1], stretch: [1.12, .82, 1.10] }],
      [.75, { motion: [-.055, -.04, .025], armL: [-.15, 0, .1], armR: [-.15, 0, -.1], shift: [0, .08, -.02], stretch: [.97, 1.05, .98] }],
      [1, {}],
    ],
  },
};
