import { ENEMY_BATCH3_CLIPS } from './card-enemy-batch3-motion';
import { ENEMY_BATCH2_CLIPS } from './card-enemy-batch2-motion';
import { ENEMY_BATCH1_CLIPS } from './card-enemy-batch1-motion';
import * as T from 'three';
import { BATCH3_SKILL_CLIPS } from './card-roster-batch3-motion';
import { BATCH2_SKILL_CLIPS } from './card-roster-batch2-motion';
import { ROSTER_SKILL_CLIPS } from './card-roster-motion';
import { CHAPTER_ONE_ATTACKS } from './card-enemy-motion';
import { STARTER_SKILL_CLIPS, type CardClipDefinition, type CardPose,
  type MotionJoint, type MotionVector } from './card-motion-data';

const ROTATION_JOINTS: MotionJoint[] = [
  'motion', 'head', 'armL', 'armR', 'footL', 'footR', 'tail', 'tailMid', 'tailTip',
  'earL', 'earR', 'hat', 'lantern', 'shield', 'ladle', 'wand', 'wingL', 'wingR', 'launcher',
];
const ZERO: MotionVector = [0, 0, 0];
const UNIT: MotionVector = [1, 1, 1];
const clipCache = new Map<string, Promise<T.AnimationClip[]>>();
const SECONDARY_JOINTS = new Set<MotionJoint>([
  'tail', 'tailMid', 'tailTip', 'earL', 'earR', 'hat', 'lantern', 'ladle',
]);

export function motionIdentity(id: string) {
  let value = 2166136261;
  for (const character of id) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

/** A deterministic per-actor interval keeps fidgets 4–8 seconds apart. */
export function cardIdleFrame(id: string, time: number, reducedMotion = false) {
  if (reducedMotion) return { clip: 'idle', progress: .2 };
  const elapsed = Math.max(0, time);
  let cycle = Math.floor((elapsed - 5) / 6);
  const start = (index: number) => 5 + index * 6 + motionIdentity(`${id}-time-${index}`) % 201 / 100;
  if (elapsed < start(cycle)) cycle--;
  const local = elapsed - start(cycle);
  const variant = motionIdentity(`${id}-pose-${cycle}`) % 3;
  const names = ['idle-listen', 'idle-stretch', 'idle-tail'];
  // A six-second grid with 0–2 seconds of jitter gives 4–8 seconds between starts.
  return cycle >= 0 && local < 1.5
    ? { clip: names[variant]!, progress: local / 1.5 }
    : { clip: 'idle', progress: elapsed % 3.6 / 3.6 };
}

export function cardSkillMotion(asset: string, skillId: string) {
  const skills = STARTER_SKILL_CLIPS[asset] ?? ROSTER_SKILL_CLIPS[asset] ?? BATCH2_SKILL_CLIPS[asset] ?? BATCH3_SKILL_CLIPS[asset] ?? ENEMY_BATCH3_CLIPS[asset] ?? ENEMY_BATCH2_CLIPS[asset] ?? ENEMY_BATCH1_CLIPS[asset] ?? [CHAPTER_ONE_ATTACKS[asset]];
  return skills.find(clip => clip?.id === skillId)?.travel
    ?? (CHAPTER_ONE_ATTACKS[asset]?.id === skillId ? CHAPTER_ONE_ATTACKS[asset]?.travel : undefined);
}

export function cardTravelFraction(distance: number, requested: number, stopDistance = 1.2) {
  if (distance <= stopDistance) return 0;
  return Math.min(Math.max(0, requested), (distance - stopDistance) / distance);
}

export function cardHitClip(heavy: boolean, localDirection: number) {
  const direction = Math.abs(localDirection) < .25 ? 'front' : localDirection < 0 ? 'left' : 'right';
  return `${heavy ? 'heavy-hit' : 'hit'}-${direction}`;
}

function hitDefinition(heavy: boolean, direction: number): CardClipDefinition {
  const power = heavy ? 1.45 : 1;
  const side = direction * power;
  return {
    id: cardHitClip(heavy, direction), duration: heavy ? .84 : .64,
    keys: [
      [0, {}],
      [.13, { motion: [-.18 * power, -.06 * side, .20 * side], head: [-.17 * power, -.1 * side, .12 * side], armL: [.2 * power, 0, .2], armR: [.2 * power, 0, -.2], shift: [.055 * side, .035, -.10 * power], stretch: [1 + .05 * power, 1 - .10 * power, 1 + .04 * power] }],
      [.38, { motion: [.07 * power, .03 * side, -.11 * side], head: [.09, .04 * side, -.06 * side], shift: [-.025 * side, -.025, -.04 * power], stretch: [.97, 1.04, .98] }],
      [.67, { motion: [-.025 * power, 0, .04 * side], head: [-.03, 0, .02 * side], shift: [.01 * side, .012, .015] }],
      [1, {}],
    ],
  };
}

function lifecycleDefinitions(): CardClipDefinition[] {
  return [
    {
      id: 'idle', duration: 3.6,
      keys: [
        [0, {}],
        [.5, { head: [.018, .035, -.025], shift: [0, .018, 0], stretch: [1.015, 1.025, 1.015], tail: [0, .08, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'idle-listen', duration: 1.5,
      keys: [
        [0, {}],
        [.22, { head: [.025, -.18, -.08], earL: [.15, 0, -.15], earR: [-.05, 0, .03], motion: [.02, -.035, -.02] }],
        [.49, { head: [-.035, .2, .06], earL: [-.06, 0, .04], earR: [.18, 0, .15], motion: [-.015, .03, .02] }],
        [.73, { head: [.015, -.04, -.025], earL: [.04, 0, -.035], earR: [.03, 0, .04] }],
        [1, {}],
      ],
    },
    {
      id: 'idle-stretch', duration: 1.5,
      keys: [
        [0, {}],
        [.24, { motion: [.12, 0, 0], head: [.08, 0, 0], shift: [0, -.035, 0], stretch: [1.025, .95, 1.02] }],
        [.52, { motion: [-.10, 0, 0], armL: [-.65, -.1, .65], armR: [-.65, .1, -.65], head: [-.12, 0, -.04], shift: [0, .055, 0], stretch: [.97, 1.06, .97] }],
        [.76, { motion: [.025, 0, 0], armL: [-.12, 0, .14], armR: [-.12, 0, -.14], head: [.02, 0, .015], shift: [0, -.012, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'idle-tail', duration: 1.5,
      keys: [
        [0, {}],
        [.25, { motion: [0, -.06, .045], head: [.07, -.2, .05], armR: [-.24, .1, -.12], tail: [.08, -.45, -.12], tailMid: [0, -.25, .12] }],
        [.48, { motion: [0, .04, -.035], head: [.04, .1, -.03], armR: [-.15, -.06, -.20], tail: [-.04, .4, .08], tailMid: [.08, .3, -.12] }],
        [.72, { head: [-.015, -.025, .015], tail: [0, -.14, -.04], tailMid: [0, -.10, .06] }],
        [1, {}],
      ],
    },
    {
      id: 'ready', duration: 2.4,
      keys: [
        [0, { motion: [.035, 0, 0], armL: [-.22, -.08, .10], armR: [-.16, .08, -.10] }],
        [.5, { motion: [.055, -.025, .015], armL: [-.3, -.08, .14], armR: [-.20, .1, -.13], head: [-.025, .025, 0], shift: [0, .012, .015] }],
        [1, { motion: [.035, 0, 0], armL: [-.22, -.08, .10], armR: [-.16, .08, -.10] }],
      ],
    },
    {
      id: 'walk-in', duration: 1.14,
      keys: [
        [0, { shift: [0, 0, -.30] }],
        [.22, { motion: [.05, -.07, -.05], armL: [-.3, 0, .1], armR: [.22, 0, -.1], footL: [.48, 0, 0], footR: [-.35, 0, 0], shift: [0, .05, -.23] }],
        [.45, { motion: [.05, .07, .05], armL: [.22, 0, .1], armR: [-.3, 0, -.1], footL: [-.35, 0, 0], footR: [.48, 0, 0], shift: [0, .05, -.13] }],
        [.70, { motion: [.02, -.03, -.025], armL: [-.14, 0, .05], armR: [.12, 0, -.05], footL: [.2, 0, 0], footR: [-.15, 0, 0], shift: [0, .025, -.04] }],
        [.86, { shift: [0, -.025, 0], stretch: [1.03, .95, 1.02] }],
        [1, {}],
      ],
    },
    {
      id: 'guard', duration: 1.0,
      keys: [
        [0, {}],
        [.24, { motion: [.14, -.08, .025], armL: [-.8, -.4, .15], armR: [-.55, .4, -.1], head: [.08, .05, 0], shift: [0, -.065, -.04] }],
        [.58, { motion: [.09, -.04, .015], armL: [-.95, -.3, .22], armR: [-.7, .3, -.15], head: [.04, .02, 0], shift: [0, -.035, -.02] }],
        [.81, { motion: [-.02, .02, 0], armL: [-.25, -.08, .06], armR: [-.15, .08, -.04], shift: [0, .02, .01] }],
        [1, {}],
      ],
    },
    {
      id: 'heal-receive', duration: 1.16,
      keys: [
        [0, {}],
        [.25, { head: [.08, -.04, -.06], motion: [.035, 0, 0], armL: [-.2, -.1, .1], armR: [-.2, .1, -.1], shift: [0, -.02, 0] }],
        [.49, { head: [-.15, .05, .05], motion: [-.06, 0, 0], armL: [-.45, -.12, .55], armR: [-.45, .12, -.55], shift: [0, .065, 0], stretch: [.98, 1.04, .98] }],
        [.74, { head: [-.04, -.02, -.02], armL: [-.12, 0, .18], armR: [-.12, 0, -.18], shift: [0, .025, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'telegraph', duration: 1.12,
      keys: [
        [0, {}],
        [.30, { motion: [.14, -.12, .06], head: [.12, .10, -.025], armL: [-.2, -.2, .4], armR: [-.2, .2, -.4], shift: [0, -.06, -.08], stretch: [1.04, .92, 1.03] }],
        [.64, { motion: [.18, -.08, .04], head: [.08, .06, -.015], armL: [-.35, -.15, .5], armR: [-.35, .15, -.5], shift: [0, -.075, -.1] }],
        [1, {}],
      ],
    },
    {
      id: 'victory', duration: 1.8,
      keys: [
        [0, {}],
        [.18, { head: [.10, 0, 0], shift: [0, -.06, 0], stretch: [1.05, .91, 1.04] }],
        [.40, { motion: [-.08, -.1, -.08], head: [-.12, .05, .04], armL: [-.7, -.1, .75], armR: [-1.8, .1, -.6], shift: [0, .18, 0], stretch: [.95, 1.09, .96] }],
        [.59, { motion: [.035, .08, .04], head: [-.04, -.05, -.03], armL: [-.5, 0, .55], armR: [-1.25, 0, -.85], shift: [0, -.025, 0] }],
        [.78, { head: [-.06, .03, .025], armR: [-1.7, 0, -.65], shift: [0, .05, 0] }],
        [1, {}],
      ],
    },
    {
      id: 'defeat', duration: 1.5,
      keys: [
        [0, {}],
        [.26, { motion: [.16, 0, 0], head: [.20, 0, -.05], armL: [.12, 0, .05], armR: [.12, 0, -.05], shift: [0, -.05, 0] }],
        [.65, { motion: [.21, -.05, .03], head: [.30, .05, -.06], earL: [-.2, 0, -.18], earR: [-.2, 0, .18], shift: [0, -.09, 0], stretch: [1.025, .95, 1.025] }],
        [1, { motion: [.19, 0, .015], head: [.26, 0, -.04], earL: [-.15, 0, -.15], earR: [-.15, 0, .15], shift: [0, -.075, 0] }],
      ],
    },
    {
      id: 'KO', duration: 1.15,
      keys: [
        [0, {}],
        [.16, { motion: [-.20, 0, -.16], head: [-.16, 0, -.10], armL: [.3, 0, .35], armR: [.3, 0, -.35], shift: [0, .035, -.08] }],
        [.40, { motion: [.10, .05, .30], head: [.15, -.05, .12], shift: [.06, -.055, -.03] }],
        [.72, { motion: [0, 0, 1.26], head: [.10, 0, .12], earL: [-.2, 0, -.15], earR: [-.2, 0, .15], shift: [.24, -.04, 0], stretch: [1.04, .95, 1.03] }],
        [1, { motion: [0, 0, 1.22], head: [.08, 0, .08], earL: [-.15, 0, -.12], earR: [-.15, 0, .12], shift: [.22, -.035, 0] }],
      ],
    },
    ...[false, true].flatMap(heavy => [-1, 0, 1].map(direction => hitDefinition(heavy, direction))),
  ];
}

export function cardClipDefinitions(asset: string): CardClipDefinition[] {
  const skills = STARTER_SKILL_CLIPS[asset] ?? ROSTER_SKILL_CLIPS[asset] ?? BATCH2_SKILL_CLIPS[asset] ?? BATCH3_SKILL_CLIPS[asset];
  const enemy = CHAPTER_ONE_ATTACKS[asset];
  const enemySkills = ENEMY_BATCH3_CLIPS[asset] ?? ENEMY_BATCH2_CLIPS[asset] ?? ENEMY_BATCH1_CLIPS[asset];
  if (!skills && !enemy && !enemySkills) return [];
  return [...lifecycleDefinitions(), ...(skills ?? enemySkills ?? []), ...(enemy ? [enemy] : [])];
}

function blendVector(left: MotionVector, right: MotionVector, amount: number): MotionVector {
  return [T.MathUtils.lerp(left[0], right[0], amount),
    T.MathUtils.lerp(left[1], right[1], amount), T.MathUtils.lerp(left[2], right[2], amount)];
}

export function sampleCardPose(definition: CardClipDefinition, progress: number): CardPose {
  const time = T.MathUtils.clamp(progress, 0, 1);
  const index = definition.keys.findIndex(([at]) => at >= time);
  const [end, right] = definition.keys[Math.max(0, index)]!;
  const [start, left] = definition.keys[Math.max(0, index - 1)]!;
  const fraction = end === start ? 1 : (time - start) / (end - start);
  const ease = fraction * fraction * (3 - 2 * fraction);
  const result: CardPose = {};
  for (const joint of ROTATION_JOINTS) result[joint] = blendVector(left[joint] ?? ZERO, right[joint] ?? ZERO, ease);
  result.shift = blendVector(left.shift ?? ZERO, right.shift ?? ZERO, ease);
  result.stretch = blendVector(left.stretch ?? UNIT, right.stretch ?? UNIT, ease);
  return result;
}

async function bakeCardClips(model: T.Object3D, role: string, asset: string) {
  const clips: T.AnimationClip[] = [];
  for (const definition of cardClipDefinitions(asset)) {
    const times = Array.from({ length: 41 }, (_, index) => index / 40 * definition.duration);
    const poses = times.map(time => sampleCardPose(definition, time / definition.duration));
    const delayed = times.map(time => sampleCardPose(definition, time / definition.duration - .06));
    const tracks: T.KeyframeTrack[] = [];
    const bodyMoves = definition.keys.some(([, pose]) => pose.motion);
    const joints = ROTATION_JOINTS.filter(joint => definition.keys.some(([, pose]) => pose[joint])
      || bodyMoves && SECONDARY_JOINTS.has(joint));
    for (const joint of joints) {
      const node = model.getObjectByName(`${role}_${joint}`);
      if (!node) continue;
      const values: number[] = [];
      for (const [index, pose] of poses.entries()) {
        const angles = [...pose[joint]!] as MotionVector;
        const lag = delayed[index]!.motion!;
        // Accessories and a three-part tail settle after the body's main impulse.
        const secondary = SECONDARY_JOINTS.has(joint);
        const weight = joint === 'tailTip' ? .55 : joint === 'tailMid' ? .4 : .24;
        if (secondary) {
          const envelope = Math.sin(index / 40 * Math.PI);
          angles[0] += lag[0] * weight * envelope;
          angles[1] -= lag[1] * weight * envelope;
          angles[2] -= lag[2] * weight * envelope;
        }
        const rotation = new T.Quaternion().setFromEuler(new T.Euler(...angles));
        values.push(...node.quaternion.clone().multiply(rotation).toArray());
      }
      tracks.push(new T.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values));
    }
    const motion = model.getObjectByName(`${role}_motion`);
    const body = model.getObjectByName(`${role}_body`);
    if (motion) tracks.push(new T.VectorKeyframeTrack(`${motion.name}.position`, times,
      poses.flatMap(pose => motion.position.toArray().map((value, axis) => value + pose.shift![axis]!))));
    if (body) tracks.push(new T.VectorKeyframeTrack(`${body.name}.scale`, times,
      poses.flatMap(pose => body.scale.toArray().map((value, axis) => value * pose.stretch![axis]!))));
    clips.push(new T.AnimationClip(definition.id, definition.duration, tracks));
    // Cold opening remains measured. Yield between clips so this preparation can paint.
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return clips;
}

/** Bake once per asset, then let the existing mixer handle playback and blending. */
export function createCardClips(model: T.Object3D, role: string, asset: string): Promise<T.AnimationClip[]> {
  const key = `${asset}/${role}`;
  const cached = clipCache.get(key);
  if (cached) return cached;
  const result = bakeCardClips(model, role, asset);
  clipCache.set(key, result);
  void result.catch(() => clipCache.delete(key));
  return result;
}
