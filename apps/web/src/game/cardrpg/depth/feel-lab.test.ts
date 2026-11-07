import { expect, it } from 'vitest';
import { galleryFixture } from './feel-lab';

it.each([
  ['teacup-healer', 'heal'], ['button-guard', 'shield'],
])('previews %s supporting its own side', (owner, type) => {
  const { battle, plan } = galleryFixture(`enemy:${owner}`);
  const event = plan.events.find(item => item.type === type)!;
  expect(event).toBeDefined();
  expect(event.targetIds.length).toBeGreaterThan(0);
  for (const id of event.targetIds) {
    expect(battle.actors.find(actor => actor.id === id)?.side).toBe('enemy');
  }
  expect(plan.events.some(item => item.type === 'damage')).toBe(false);
});
