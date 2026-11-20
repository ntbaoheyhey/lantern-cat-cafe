import type { Motion } from './choreography';

export type MotionVector = [number, number, number];
export type MotionJoint = 'motion' | 'head' | 'armL' | 'armR' | 'footL' | 'footR'
  | 'tail' | 'tailMid' | 'tailTip' | 'earL' | 'earR' | 'hat' | 'lantern'
  | 'shield' | 'ladle' | 'wand' | 'wingL' | 'wingR' | 'launcher';

/** Rotation offsets in radians, translation in model units, scale multipliers. */
export type CardPose = Partial<Record<MotionJoint, MotionVector>> & {
  shift?: MotionVector;
  stretch?: MotionVector;
};
export interface CardClipDefinition {
  id: string;
  duration: number;
  keys: [number, CardPose][];
  travel?: Motion;
}

export const STARTER_MODELS = ['mochi', 'soot', 'clover'] as const;
export const CHAPTER_ONE_MODELS = [
  'button-guard', 'sock-skipper', 'spool-ram', 'needle-moth',
  'teacup-healer', 'yarn-giant', 'binding-thread', 'practice-cushion',
] as const;

/** Hand-authored gestures follow the existing catalogue and its actual four slots. */
export const STARTER_SKILL_CLIPS: Record<string, CardClipDefinition[]> = {
  mochi: [
    {
      id: 'mochi-1', duration: 1.08,
      travel: { travel: .48, arc: .02, float: 0, side: -.06, hold: 65 },
      keys: [
        [0, {}],
        [.20, { motion: [.10, -.16, -.07], armR: [-.35, .1, -.55], armL: [-.3, -.1, .2], shift: [0, -.05, -.06], stretch: [1.04, .93, 1.03] }],
        [.43, { motion: [-.10, .18, .05], armR: [-1.35, -.18, -.12], armL: [-.45, -.2, .3], head: [-.08, .08, 0], shift: [0, .025, .10] }],
        [.50, { armR: [-.72, .05, -.30], motion: [.04, -.04, -.02], shift: [0, -.02, .04] }],
        [.57, { armR: [-1.52, -.12, -.07], motion: [-.13, .15, .06], shift: [0, .04, .13], stretch: [.98, 1.04, .98] }],
        [.78, { armR: [.18, .03, .12], motion: [.06, -.08, -.03], head: [.04, -.03, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'mochi-2', duration: 1.38,
      travel: { travel: .08, arc: 0, float: .015, side: .07, hold: 0 },
      keys: [
        [0, {}],
        [.23, { motion: [.12, -.12, .07], armL: [-.5, .4, .22], armR: [-.2, -.1, -.15], head: [.14, -.12, .06], shift: [0, -.035, -.03] }],
        [.43, { motion: [-.04, .18, -.08], armL: [-.65, -.45, 1.05], armR: [-.65, .25, -.65], head: [-.12, .16, -.05], shift: [.05, .04, .03] }],
        [.61, { motion: [-.07, .22, -.04], armL: [-.90, -.2, .95], armR: [-.45, .2, -.72], head: [-.08, .10, -.03], shift: [.03, .055, .04] }],
        [.81, { motion: [.025, -.05, .02], armL: [-.32, .12, .25], armR: [.08, -.08, -.12], head: [.03, -.04, .025] }],
        [1, {}],
      ],
    },
    {
      id: 'mochi-3', duration: 1.46,
      travel: { travel: .12, arc: .03, float: 0, side: -.28, hold: 45 },
      keys: [
        [0, {}],
        [.18, { motion: [.08, -.28, .13], armL: [-.8, -.6, -.32], armR: [-.8, .6, .32], head: [.08, .18, -.05], shift: [-.09, -.045, -.03] }],
        [.40, { motion: [-.05, .32, -.15], armL: [-1.1, -.28, .15], armR: [-.6, .75, .52], footL: [.3, -.12, -.08], footR: [-.22, .12, .09], shift: [.12, .025, .08] }],
        [.56, { motion: [.12, .12, -.08], armL: [-.48, -.40, .65], armR: [-1.0, -.15, -.7], shift: [.03, -.045, .09], stretch: [1.05, .91, 1.04] }],
        [.80, { motion: [-.03, -.1, .04], armL: [-.25, .1, .2], armR: [-.35, -.08, -.1], shift: [-.02, .03, -.01] }],
        [1, {}],
      ],
    },
    {
      id: 'mochi-4', duration: 1.72,
      travel: { travel: 0, arc: 0, float: .035, side: 0, hold: 95 },
      keys: [
        [0, {}],
        [.19, { motion: [.18, 0, 0], armL: [-.55, -.35, -.15], armR: [-.55, .35, .15], head: [.18, 0, 0], shift: [0, -.10, -.02], stretch: [1.08, .86, 1.07] }],
        [.40, { motion: [-.10, -.08, -.03], armL: [-2.0, -.15, .55], armR: [-1.5, .15, -.70], head: [-.18, .04, 0], shift: [0, .14, .02], stretch: [.94, 1.10, .95] }],
        [.56, { motion: [-.03, .06, .02], armL: [-1.2, -.3, 1.15], armR: [-1.1, .3, -1.15], shift: [0, .045, .04], head: [-.10, 0, 0] }],
        [.78, { motion: [.06, 0, 0], armL: [-.7, -.1, .8], armR: [-.7, .1, -.8], shift: [0, -.02, 0], stretch: [1.03, .95, 1.02] }],
        [1, {}],
      ],
    },
  ],
  soot: [
    {
      id: 'soot-1', duration: 1.02,
      travel: { travel: 0, arc: 0, float: .045, side: .06, hold: 35 },
      keys: [
        [0, {}],
        [.23, { motion: [.06, .2, -.10], armL: [-.45, -.4, .22], armR: [-.25, .2, -.15], head: [.05, -.16, .05], wand: [.15, 0, -.12], shift: [-.035, -.03, -.04] }],
        [.46, { motion: [-.08, -.22, .10], armL: [-1.45, .3, .55], armR: [.18, .1, -.35], head: [-.10, .12, -.04], wand: [-.35, .1, .2], shift: [.04, .07, .04] }],
        [.58, { motion: [-.02, -.1, .05], armL: [-1.1, .1, .8], armR: [.05, -.15, -.15], head: [-.02, .08, 0], shift: [.02, .03, .02] }],
        [.80, { motion: [.03, .05, -.035], armL: [.12, -.05, -.12], wand: [.12, 0, -.08], shift: [0, -.02, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'soot-2', duration: 1.44,
      travel: { travel: 0, arc: 0, float: .08, side: -.09, hold: 0 },
      keys: [
        [0, {}],
        [.22, { motion: [.15, -.08, 0], armL: [-.70, -.55, -.25], armR: [-.70, .55, .25], head: [.20, 0, .03], shift: [0, -.07, 0], lantern: [.05, 0, -.10] }],
        [.41, { motion: [-.03, .20, .07], armL: [-1.0, -.25, -.08], armR: [-.6, .75, .2], head: [-.04, .12, -.05], shift: [.04, .04, .025] }],
        [.57, { motion: [-.08, -.22, -.07], armL: [-.7, -.7, .2], armR: [-1.15, .18, -.12], head: [-.09, -.12, .04], shift: [-.04, .07, .05] }],
        [.80, { motion: [.04, .07, .025], armL: [-.32, -.1, .18], armR: [-.20, .1, -.16], head: [.06, .04, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'soot-3', duration: 1.50,
      travel: { travel: .04, arc: 0, float: .10, side: .04, hold: 80 },
      keys: [
        [0, {}],
        [.19, { motion: [.10, -.18, -.10], armR: [-.45, .2, -.35], armL: [-.20, -.2, .15], head: [.14, .10, .07], lantern: [0, 0, .15], shift: [-.05, -.05, -.06] }],
        [.38, { motion: [-.16, -.05, .09], armR: [-2.0, .12, -.25], armL: [-.6, -.18, .65], head: [-.20, .04, -.04], lantern: [-.3, 0, -.25], shift: [.02, .12, 0] }],
        [.52, { motion: [.18, .15, -.03], armR: [-.55, -.1, -.8], armL: [-1.25, .2, .25], head: [.08, -.02, 0], lantern: [.25, .1, .15], shift: [0, -.055, .06], stretch: [1.06, .91, 1.03] }],
        [.73, { motion: [-.05, -.06, .035], armR: [-.15, .1, -.2], armL: [-.4, -.15, .25], lantern: [-.10, 0, -.07], shift: [0, .045, -.01] }],
        [1, {}],
      ],
    },
    {
      id: 'soot-4', duration: 1.78,
      travel: { travel: 0, arc: 0, float: .18, side: 0, hold: 95 },
      keys: [
        [0, {}],
        [.18, { motion: [.12, .20, .12], armL: [-.65, -.55, -.2], armR: [-.65, .55, .2], head: [.16, -.15, -.05], shift: [0, -.07, 0] }],
        [.36, { motion: [-.08, -.30, -.12], armL: [-2.2, .1, .45], armR: [-.8, .2, -1.2], head: [-.16, .18, .05], lantern: [-.12, .2, -.24], shift: [-.05, .16, 0] }],
        [.52, { motion: [-.12, .28, .10], armL: [-.8, -.2, 1.25], armR: [-2.1, -.15, -.55], head: [-.12, -.15, -.035], lantern: [.12, -.15, .22], shift: [.05, .20, .02], stretch: [.95, 1.09, .96] }],
        [.68, { motion: [.10, 0, 0], armL: [-1.10, -.15, .45], armR: [-1.10, .15, -.45], head: [.10, 0, 0], shift: [0, -.025, .045], stretch: [1.06, .92, 1.04] }],
        [.86, { motion: [-.025, -.04, -.02], armL: [-.25, .1, .18], armR: [-.25, -.1, -.18], shift: [0, .025, 0] }],
        [1, {}],
      ],
    },
  ],
  clover: [
    {
      id: 'clover-1', duration: 1.10,
      travel: { travel: .42, arc: .16, float: 0, side: .16, hold: 35 },
      keys: [
        [0, {}],
        [.20, { motion: [.18, -.12, .12], armL: [.15, .1, .35], armR: [.35, -.2, -.4], head: [.10, .08, -.05], shift: [-.04, -.09, -.04], stretch: [1.07, .87, 1.04] }],
        [.42, { motion: [-.22, .18, -.12], armL: [-.35, -.15, .6], armR: [-1.35, .12, -.55], footL: [.5, 0, -.12], footR: [-.35, 0, .1], shift: [.04, .20, .08], stretch: [.94, 1.10, .95] }],
        [.56, { motion: [.12, .06, -.04], armL: [-.5, -.1, .25], armR: [-1.1, -.25, -.15], shift: [0, -.035, .10], stretch: [1.05, .91, 1.04] }],
        [.80, { motion: [-.035, -.06, .025], armL: [.10, .05, -.05], armR: [.18, .08, .12], shift: [0, .04, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'clover-2', duration: 1.42,
      travel: { travel: .05, arc: 0, float: .025, side: -.06, hold: 0 },
      keys: [
        [0, {}],
        [.24, { motion: [.10, -.12, .04], armL: [-.75, -.42, -.22], armR: [-.7, .45, .2], head: [.16, -.10, .04], shift: [0, -.035, -.02] }],
        [.45, { motion: [.02, .15, -.035], armL: [-.85, -.15, .15], armR: [-1.10, .25, -.25], head: [.08, .10, -.02], shift: [.035, .015, .07] }],
        [.63, { motion: [.04, .20, -.04], armL: [-.95, -.1, .2], armR: [-.90, .1, -.18], head: [.10, .10, -.03], shift: [.045, -.01, .10] }],
        [.82, { motion: [-.025, -.04, .02], armL: [-.30, -.15, .10], armR: [-.35, .15, -.12], head: [-.025, -.03, .015] }],
        [1, {}],
      ],
    },
    {
      id: 'clover-3', duration: 1.48,
      travel: { travel: 0, arc: 0, float: .045, side: .12, hold: 0 },
      keys: [
        [0, {}],
        [.18, { motion: [.08, -.30, .12], armL: [-.55, -.2, .3], armR: [-.75, .8, .2], head: [.08, .18, -.05], shift: [-.08, -.035, 0] }],
        [.39, { motion: [-.05, -.12, -.06], armL: [-1.4, -.2, .7], armR: [-.4, .3, -.45], head: [-.10, .08, .025], shift: [-.025, .06, .02] }],
        [.58, { motion: [-.03, .35, -.12], armL: [-.5, -.3, .6], armR: [-1.4, .2, -.95], head: [-.06, -.18, .04], shift: [.08, .035, .04] }],
        [.78, { motion: [.04, -.06, .045], armL: [-.2, .1, .15], armR: [-.4, -.1, -.2], shift: [-.025, -.025, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'clover-4', duration: 1.76,
      travel: { travel: 0, arc: 0, float: .10, side: 0, hold: 55 },
      keys: [
        [0, {}],
        [.22, { motion: [.22, 0, 0], armL: [-.7, -.55, -.22], armR: [-.7, .55, .22], head: [.22, 0, 0], shift: [0, -.13, .04], stretch: [1.10, .83, 1.08] }],
        [.41, { motion: [-.08, -.06, -.04], armL: [-1.5, -.12, .5], armR: [-1.5, .12, -.5], head: [-.20, .04, .02], shift: [0, .16, .015], stretch: [.92, 1.13, .94] }],
        [.57, { motion: [-.05, .06, .04], armL: [-.55, -.15, 1.45], armR: [-.55, .15, -1.45], head: [-.08, -.04, -.02], footL: [.16, 0, -.04], footR: [.16, 0, .04], shift: [0, .22, 0] }],
        [.74, { motion: [.09, 0, 0], armL: [-.3, .05, .72], armR: [-.3, -.05, -.72], shift: [0, -.065, 0], stretch: [1.06, .91, 1.04] }],
        [.88, { motion: [-.03, 0, 0], armL: [.04, 0, .14], armR: [.04, 0, -.14], shift: [0, .035, 0] }],
        [1, {}],
      ],
    },
  ],
};
