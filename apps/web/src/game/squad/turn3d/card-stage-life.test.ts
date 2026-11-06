import { expect, it } from 'vitest';
import * as T from 'three';
import { CARD_CONTACT_HEIGHT, groundCardContact } from './card-contact';
import { addCardStageLife, animateCardStageLife } from './card-stage-life';
it('keeps feet contact above the rug through scale changes and jumps', () => {
  const root = new T.Group(), shadow = new T.Mesh(new T.PlaneGeometry(), new T.MeshBasicMaterial()); root.add(shadow);
  for (const size of [.3,.7,1.2]) for (const y of [-.1,0,.35]) {
    root.scale.setScalar(size); root.position.y = y; groundCardContact(shadow, root); root.updateMatrixWorld(true);
    expect(shadow.getWorldPosition(new T.Vector3()).y).toBeCloseTo(CARD_CONTACT_HEIGHT,8);
    expect(CARD_CONTACT_HEIGHT).toBeGreaterThan(.0425);
  }
  shadow.geometry.dispose(); shadow.material.dispose();
});
it('uses four finite draws per chapter and makes reduced motion stable', () => {
  for (const chapter of [1,2,3]) {
    const group = new T.Group(); addCardStageLife(group, chapter);
    expect(group.children).toHaveLength(4);
    const moving = group.children.find(c => c instanceof T.InstancedMesh) as T.InstancedMesh;
    animateCardStageLife(group, 12, true); const before = [...moving.instanceMatrix.array];
    animateCardStageLife(group, 47, true); expect([...moving.instanceMatrix.array]).toEqual(before);
    animateCardStageLife(group, 47, false); expect([...moving.instanceMatrix.array]).not.toEqual(before);
    group.traverse(o => { if (o instanceof T.Mesh) { expect([...o.geometry.attributes.position!.array].every(Number.isFinite)).toBe(true); o.geometry.dispose(); (o.material as T.Material).dispose(); } });
  }
});
