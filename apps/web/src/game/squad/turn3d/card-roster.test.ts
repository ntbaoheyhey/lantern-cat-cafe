import { expect, it } from 'vitest';
import * as T from 'three';
import { CardUtensil } from './card-utensils';
import { cardEntrancePose, CARD_ENTRANCE_SECONDS } from './card-entrance';
import { BATCH2_SKILL_CLIPS } from './card-roster-batch2-motion';
import { ROSTER_SKILL_CLIPS } from './card-roster-motion';
import { cardClipDefinitions, sampleCardPose } from './card-motion';
it('releases original hand props when a loaded miniature leaves', () => {
  for (const asset of ['panko', 'mallow', 'sorrel', 'biscuit', 'inkcap', 'cinnamon']) {
    const model = new T.Group(), left = new T.Group(), right = new T.Group();
    left.name = 'guardian_armL'; right.name = 'guardian_armR'; model.add(left, right);
    const utensil = new CardUtensil(model, 'guardian', asset);
    let releasedGeometry = 0, releasedMaterials = 0, count = 0;
    model.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      count++; object.geometry.addEventListener('dispose', () => releasedGeometry++);
      object.material.addEventListener('dispose', () => releasedMaterials++);
    });
    expect(count).toBe(2);
    utensil.dispose(); utensil.dispose();
    expect(releasedGeometry).toBe(count); expect(releasedMaterials).toBe(count);
    expect(left.children.length + right.children.length).toBe(0);
  }
});
it('keeps invitation reveals bounded and completely still in reduced motion', () => {
  expect(cardEntrancePose(0, false).finished).toBe(false);
  expect(cardEntrancePose(CARD_ENTRANCE_SECONDS, false).finished).toBe(true);
  for (const time of [0, .2, 1, 2]) {
    const calm = cardEntrancePose(time, true);
    expect(calm).toEqual({ progress: 1, lift: 0, zoom: 0, turn: 0, finished: true });
    const moving = cardEntrancePose(time, false);
    expect(Math.abs(moving.turn)).toBeLessThanOrEqual(.25);
    expect(moving.zoom).toBeLessThanOrEqual(.035);
    expect(moving.lift).toBeLessThanOrEqual(.16);
  }
});
it('returns every extended skill to its rest pose and supplies the reaction lifecycle', () => {
  for (const [owner, clips] of Object.entries({ ...ROSTER_SKILL_CLIPS, ...BATCH2_SKILL_CLIPS })) {
    expect(clips.map(clip => clip.id)).toEqual([1, 2, 3, 4].map(slot => `${owner}-${slot}`));
    expect(cardClipDefinitions(owner).map(clip => clip.id)).toEqual(expect.arrayContaining(['KO', 'guard', 'heal-receive', 'hit-left', 'heavy-hit-right', 'victory']));
    for (const clip of clips) expect(sampleCardPose(clip, 0)).toEqual(sampleCardPose(clip, 1));
  }
});
