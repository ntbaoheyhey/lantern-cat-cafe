import { ENEMY_BATCH2_CLIPS } from './card-enemy-batch2-motion';
import { expect, it } from 'vitest';
import * as T from 'three';
import { cardClipDefinitions, sampleCardPose } from './card-motion';
import { CARD_EFFECT_RECIPES, cardEffectSignature } from './card-effect-data';
import { CardUtensil } from './card-utensils';
import { ENEMY_BATCH1_CLIPS } from './card-enemy-batch1-motion';

it('gives basic and signature enemy actions distinct gestures and compositions', () => {
  for (const [owner, clips] of Object.entries({ ...ENEMY_BATCH1_CLIPS, ...ENEMY_BATCH2_CLIPS })) {
    const basic = `enemy:${owner}:basic`, signature = `enemy:${owner}`;
    expect(cardClipDefinitions(owner).map(c => c.id)).toEqual(expect.arrayContaining([basic, signature, 'hit-left', 'heavy-hit-right', 'KO']));
    expect(cardEffectSignature(CARD_EFFECT_RECIPES[basic]!)).not.toBe(cardEffectSignature(CARD_EFFECT_RECIPES[signature]!));
    expect(sampleCardPose(clips[0]!, .4)).not.toEqual(sampleCardPose(clips[1]!, .4));
    for (const clip of clips) expect(sampleCardPose(clip, 0)).toEqual(sampleCardPose(clip, 1));
  }
});
it('releases both merged enemy adornment draws when actors leave', () => {
  for (const owner of Object.keys({ ...ENEMY_BATCH1_CLIPS, ...ENEMY_BATCH2_CLIPS })) {
    const model = new T.Group();
    for (const joint of ['armL', 'armR']) { const node = new T.Group(); node.name = `guard_${joint}`; model.add(node); }
    const prop = new CardUtensil(model, 'guard', owner); let draws = 0, disposed = 0;
    model.traverse(node => { if (node instanceof T.Mesh) { draws++; node.geometry.addEventListener('dispose', () => disposed++); } });
    expect(draws).toBe(2); prop.dispose(); prop.dispose(); expect(disposed).toBe(2);
    expect(model.children.every(node => !node.children.length)).toBe(true);
  }
});
