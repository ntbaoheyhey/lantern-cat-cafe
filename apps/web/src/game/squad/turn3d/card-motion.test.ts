import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { ROSTER_SKILL_CLIPS } from './card-roster-motion';
import { STARTER_MODELS, CHAPTER_ONE_MODELS, STARTER_SKILL_CLIPS } from './card-motion-data';
import { cardClipDefinitions, cardIdleFrame, cardTravelFraction, cardHitClip,
  cardSkillMotion, createCardClips, sampleCardPose } from './card-motion';

describe('authored starter motion', () => {
  it('covers each starter slot and at least twelve clips per slice model', () => {
    for (const asset of [...STARTER_MODELS, ...Object.keys(ROSTER_SKILL_CLIPS), ...CHAPTER_ONE_MODELS]) {
      const clips = cardClipDefinitions(asset);
      expect(clips.length).toBeGreaterThanOrEqual(12);
      expect(new Set(clips.map(clip => clip.id)).size).toBe(clips.length);
      expect(clips.map(clip => clip.id)).toEqual(expect.arrayContaining([
        'idle', 'idle-listen', 'idle-stretch', 'idle-tail', 'ready', 'walk-in',
        'guard', 'heal-receive', 'KO', 'victory', 'defeat', 'telegraph',
        'hit-left', 'hit-front', 'hit-right', 'heavy-hit-left', 'heavy-hit-front', 'heavy-hit-right',
      ]));
    }
    for (const asset of STARTER_MODELS) {
      expect(STARTER_SKILL_CLIPS[asset]!.map(clip => clip.id))
        .toEqual([1, 2, 3, 4].map(slot => `${asset}-${slot}`));
    }
    expect(cardClipDefinitions('panko').map(clip => clip.id)).toContain('panko-4');
    expect(cardClipDefinitions('unknown')).toEqual([]);
  });

  it('keeps authored times ordered and sampled transforms finite', () => {
    for (const asset of [...STARTER_MODELS, ...Object.keys(ROSTER_SKILL_CLIPS), ...CHAPTER_ONE_MODELS]) {
      for (const clip of cardClipDefinitions(asset)) {
        expect(clip.duration).toBeGreaterThan(0);
        expect(clip.keys[0]![0]).toBe(0);
        expect(clip.keys.at(-1)![0]).toBe(1);
        for (let index = 1; index < clip.keys.length; index++) {
          expect(clip.keys[index]![0]).toBeGreaterThan(clip.keys[index - 1]![0]);
        }
        for (let sample = 0; sample <= 40; sample++) {
          const pose = sampleCardPose(clip, sample / 40);
          expect(Object.values(pose).flat().every(Number.isFinite)).toBe(true);
          expect(pose.stretch!.every(value => value > 0)).toBe(true);
        }
      }
    }
    for (const clips of Object.values(STARTER_SKILL_CLIPS)) {
      for (const clip of clips) expect(sampleCardPose(clip, 1)).toEqual(sampleCardPose(clip, 0));
    }
  });

  it('returns deterministic bounded fidgets and a static reduced-motion pose', () => {
    const samples = Array.from({ length: 1200 }, (_, index) => cardIdleFrame('mochi', index / 20));
    expect(samples).toEqual(Array.from({ length: 1200 }, (_, index) => cardIdleFrame('mochi', index / 20)));
    expect(samples.every(sample => sample.progress >= 0 && sample.progress <= 1)).toBe(true);
    const starts = samples.flatMap((sample, index) => index > 0 && sample.clip !== 'idle'
      && samples[index - 1]!.clip === 'idle' ? [index / 20] : []);
    expect(starts.length).toBeGreaterThan(5);
    for (let index = 1; index < starts.length; index++) {
      expect(starts[index]! - starts[index - 1]!).toBeGreaterThanOrEqual(4);
      expect(starts[index]! - starts[index - 1]!).toBeLessThanOrEqual(8.05);
    }
    expect(new Set(starts.slice(1).map((at, index) => (at - starts[index]!).toFixed(1))).size)
      .toBeGreaterThan(1);
    expect(cardIdleFrame('mochi', 0).clip).toBe('idle');
    expect(cardIdleFrame('soot', 1, true)).toEqual(cardIdleFrame('soot', 100, true));
  });

  it('stops root travel before contact and keeps intent data scoped to the asset', () => {
    expect(cardTravelFraction(0, .8)).toBe(0);
    expect(cardTravelFraction(.8, .8)).toBe(0);
    expect(cardTravelFraction(3, .95)).toBeCloseTo(.6);
    expect(cardTravelFraction(10, .5)).toBe(.5);
    expect(cardTravelFraction(3, -1)).toBe(0);
    expect(cardSkillMotion('mochi', 'mochi-1')?.travel).toBe(.48);
    expect(cardSkillMotion('button-guard', 'guardAttack')?.travel).toBe(0);
    expect(cardSkillMotion('crumb-sentinel', 'guardAttack')).toBeUndefined();
    expect(cardHitClip(false, -2)).toBe('hit-left');
    expect(cardHitClip(true, 0)).toBe('heavy-hit-front');
    expect(cardHitClip(true, 2)).toBe('heavy-hit-right');
  });

  it('bakes reusable tracks against the authored rest transforms', async () => {
    const model = new T.Group();
    for (const name of ['motion', 'head', 'armL', 'armR', 'body', 'tail']) {
      const node = new T.Group();
      node.name = `guardian_${name}`;
      node.position.set(.1, .2, .3);
      node.rotation.set(.02, .03, .04);
      node.scale.set(1.1, .9, 1.05);
      model.add(node);
    }
    const clips = await createCardClips(model, 'guardian', 'mochi');
    expect(await createCardClips(model, 'guardian', 'mochi')).toBe(clips);
    expect(clips.length).toBeGreaterThanOrEqual(12);
    for (const clip of clips) {
      expect(clip.tracks.length).toBeGreaterThan(0);
      for (const track of clip.tracks) {
        expect([...track.values].every(Number.isFinite)).toBe(true);
        expect(track.times.at(-1)).toBeCloseTo(clip.duration);
      }
    }
    const action = clips.find(clip => clip.name === 'mochi-1')!;
    const track = action.tracks.find(track => track.name === 'guardian_motion.position')!;
    expect([...track.values.slice(0, 3)]).toEqual([...track.values.slice(-3)]);
  });

  it.each([
    { asset: 'panko', role: 'guardian', fittedJoints: ['armL', 'armR'] },
    { asset: 'mallow', role: 'witch', fittedJoints: ['armR'] },
    { asset: 'cinnamon', role: 'alchemist', fittedJoints: ['armR'] },
    { asset: 'biscuit', role: 'guardian', fittedJoints: ['armL', 'armR'] },
    { asset: 'sorrel', role: 'alchemist', fittedJoints: ['armL', 'armR'] },
    { asset: 'brioche', role: 'guardian', fittedJoints: ['armL', 'armR'] },
    { asset: 'marigold', role: 'alchemist', fittedJoints: ['armR'] },
    { asset: 'pollen-scout', role: 'ranger', fittedJoints: ['armL', 'armR'] },
  ])('preserves $asset classic poses and timing while fitting only its Look hand arcs', async ({ asset, role, fittedJoints }) => {
    const model = (look: boolean) => {
      const root = new T.Group(); root.userData.lookV2 = look;
      for (const part of ['motion', 'body', 'head', 'armL', 'armR']) {
        const node = new T.Group(); node.name = `${role}_${part}`; root.add(node);
      }
      return root;
    };
    const classic = await createCardClips(model(false), role, asset);
    const look = await createCardClips(model(true), role, asset);
    const definitions = cardClipDefinitions(asset).filter(definition => definition.id.startsWith(`${asset}-`)
      || definition.id.startsWith(`enemy:${asset}`));
    expect(definitions).toHaveLength(asset === 'pollen-scout' ? 2 : 4);
    for (const definition of definitions) {
      const original = classic.find(clip => clip.name === definition.id)!;
      const fitted = look.find(clip => clip.name === definition.id)!;
      expect(fitted.duration).toBe(original.duration);
      for (const track of original.tracks) {
        const adjusted = fitted.tracks.find(other => other.name === track.name)!;
        expect(adjusted.times).toEqual(track.times);
        if (!fittedJoints.some(joint => track.name === `${role}_${joint}.quaternion`)) {
          expect(adjusted.values).toEqual(track.values);
          continue;
        }
        const joint = track.name.includes('armL') ? 'armL' : 'armR';
        for (let sample = 0; sample <= 40; sample++) {
          const expected = new T.Quaternion().setFromEuler(new T.Euler(...sampleCardPose(definition, sample / 40)[joint]!));
          const actual = new T.Quaternion().fromArray(track.values, sample * 4).normalize();
          expect(actual.angleTo(expected)).toBeLessThan(1e-6);
        }
        expect([...adjusted.values.slice(0, 4)]).toEqual([...adjusted.values.slice(-4)]);
        expect(adjusted.values).not.toEqual(track.values);
      }
    }
  });
  it('keeps the Look sock hip attached during kicks without changing classic motion', async () => {
    const makeModel = (look: boolean) => {
      const model = new T.Group(); model.userData.lookV2 = look;
      for (const side of ['L', 'R']) {
        const foot = new T.Group(); foot.name = `flanker_foot${side}`;
        foot.position.set(side === 'L' ? -.2 : .2, .1144, .06); model.add(foot);
      }
      return model;
    };
    const classic = await createCardClips(makeModel(false), 'flanker', 'sock-skipper');
    const model = makeModel(true);
    const look = await createCardClips(model, 'flanker', 'sock-skipper');
    const mixer = new T.AnimationMixer(model);
    for (const clip of look) {
      const original = classic.find(other => other.name === clip.name)!;
      expect(clip.duration).toBe(original.duration);
      for (const track of original.tracks) {
        expect(clip.tracks.find(other => other.name === track.name)!.values).toEqual(track.values);
      }
      expect(original.tracks.some(track => track.name.endsWith('.position'))).toBe(false);
      mixer.stopAllAction(); mixer.clipAction(clip).play();
      for (let sample = 0; sample <= 160; sample++) {
        mixer.setTime(clip.duration * sample / 160);
        for (const side of ['L', 'R']) {
          const foot = model.getObjectByName(`flanker_foot${side}`)!;
          const actualHip = foot.localToWorld(new T.Vector3(0, .36, 0));
          const restHip = new T.Vector3(side === 'L' ? -.2 : .2, .4744, .06);
          // Covers interpolation between baked samples as well as endpoints.
          expect(actualHip.distanceTo(restHip)).toBeLessThan(.003);
        }
      }
    }
    mixer.stopAllAction(); mixer.uncacheRoot(model);
  });

});
