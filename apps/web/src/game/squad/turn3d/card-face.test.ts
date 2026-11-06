import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { CARD_EXPRESSIONS, CardFace, cardExpression } from './card-face';

describe('card face expressions', () => {
  it('maps battle clips to all six distinct expressions', () => {
    const clips = ['idle', 'victory', 'heavy-hit', 'guard', 'ultimate', 'KO'];
    expect(new Set(clips.map(clip => cardExpression(clip))).size).toBe(6);
    expect(new Set(Object.values(CARD_EXPRESSIONS).map(shape => JSON.stringify(shape))).size).toBe(6);
    expect(cardExpression('mochi-1', true)).toBe('casting');
    expect(cardExpression('KO', true)).toBe('KO');
    expect(cardExpression('victory', true)).toBe('happy');
  });

  it('keeps repeated fixed poses stable and bounds eye tracking', () => {
    const model = new T.Group();
    const eyes = new T.Group();
    eyes.name = 'guardian_eyes';
    eyes.position.set(0, .035, .315);
    model.add(eyes);
    const face = new CardFace(model, 'guardian', 'mochi');
    face.animate('casting', 1, 100, false);
    const first = [...eyes.position.toArray(), ...eyes.scale.toArray()];
    for (let frame = 0; frame < 100; frame++) face.animate('casting', 1, 100, false);
    expect([...eyes.position.toArray(), ...eyes.scale.toArray()]).toEqual(first);
    expect(eyes.position.x).toBeLessThan(.021);
    face.animate('KO', 1, 0, true);
    expect(eyes.scale.y).toBe(.07);
    face.dispose();
    expect(eyes.children).toHaveLength(0);
  });
});
