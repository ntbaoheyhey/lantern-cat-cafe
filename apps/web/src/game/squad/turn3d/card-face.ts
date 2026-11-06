import * as T from 'three';

export type CardExpression = 'idle' | 'happy' | 'hurt' | 'determined' | 'casting' | 'KO';
export const CARD_EXPRESSIONS = {
  idle: { eye: 1, brow: .02, mouth: 1, width: 1 },
  happy: { eye: .58, brow: .18, mouth: 1.5, width: 1.13 },
  hurt: { eye: .24, brow: .34, mouth: 1.9, width: .82 },
  determined: { eye: .72, brow: -.26, mouth: .62, width: 1.05 },
  casting: { eye: 1.12, brow: -.09, mouth: 1.22, width: .9 },
  KO: { eye: .07, brow: .3, mouth: .42, width: .88 },
} as const;

export function cardExpression(clip: string, casting = false): CardExpression {
  if (clip === 'KO' || clip === 'down') return 'KO';
  if (/^(heavy-)?hit(?:-|$)/.test(clip) || clip === 'stagger') return 'hurt';
  if (clip === 'victory' || clip === 'heal-receive') return 'happy';
  if (casting) return 'casting';
  if (clip === 'cast' || clip === 'ultimate' || clip === 'special') return 'casting';
  if (['ready', 'attack', 'skill1', 'skill2', 'skill3', 'guard', 'telegraph', 'taunt'].includes(clip)) return 'determined';
  return 'idle';
}

/** Small geometry shared by each pair of eyes. Authored rig sockets stay intact. */
export class CardFace {
  private eyes?: T.Object3D;
  private mouth?: T.Object3D;
  private browLeft?: T.Object3D;
  private browRight?: T.Object3D;
  private eyePosition = new T.Vector3();
  private eyeScale = new T.Vector3(1, 1, 1);
  private mouthScale = new T.Vector3(1, 1, 1);
  private geometry = new T.SphereGeometry(1, 24, 16);
  private meshes: T.InstancedMesh[] = [];
  private phase = 0;

  constructor(model: T.Object3D, role: string, id: string) {
    this.eyes = model.getObjectByName(`${role}_eyes`);
    this.mouth = model.getObjectByName(`${role}_mouth`);
    this.browLeft = model.getObjectByName(`${role}_browL`);
    this.browRight = model.getObjectByName(`${role}_browR`);
    this.phase = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 29 / 10;
    if (this.mouth) this.mouthScale.copy(this.mouth.scale);
    if (!this.eyes) return;
    this.eyePosition.copy(this.eyes.position);
    this.eyeScale.copy(this.eyes.scale);
    for (const child of this.eyes.children) child.visible = false;

    const layers = [
      { color: role === 'witch' ? '#211e32' : '#292535', offset: [0, 0, 0], size: [.088, .120, .038], glossy: true },
      { color: '#fff9e8', offset: [-.023, .045, .034], size: [.028, .036, .015], glossy: false },
      { color: '#ffcd68', offset: [.028, -.05, .031], size: [.015, .018, .009], glossy: false },
    ];
    const transform = new T.Object3D();
    for (const [index, layer] of layers.entries()) {
      const material = layer.glossy
        ? new T.MeshStandardMaterial({ color: layer.color, roughness: .13, metalness: .04 })
        : new T.MeshBasicMaterial({ color: layer.color });
      const mesh = new T.InstancedMesh(this.geometry, material, 2);
      mesh.name = `${role}_eye_layer_${index}`;
      for (let eye = 0; eye < 2; eye++) {
        transform.position.set((eye === 0 ? -.19 : .19) + layer.offset[0]!, layer.offset[1]!, layer.offset[2]!);
        transform.scale.fromArray(layer.size);
        transform.updateMatrix();
        mesh.setMatrixAt(eye, transform.matrix);
      }
      mesh.computeBoundingSphere();
      this.eyes.add(mesh);
      this.meshes.push(mesh);
    }
  }

  animate(expression: CardExpression, time: number, yaw: number, reducedMotion: boolean) {
    const shape = CARD_EXPRESSIONS[expression];
    const cycle = (time + this.phase) % 5.3;
    const blink = reducedMotion ? 1 : 1 - .94 * Math.exp(-Math.pow((cycle - 4.85) / .065, 2));
    if (this.eyes) {
      this.eyes.scale.set(this.eyeScale.x, this.eyeScale.y * shape.eye * blink, this.eyeScale.z);
      this.eyes.position.copy(this.eyePosition);
      this.eyes.position.x += T.MathUtils.clamp(yaw, -.61, .61) * .034;
    }
    if (this.browLeft) this.browLeft.rotation.z = shape.brow;
    if (this.browRight) this.browRight.rotation.z = -shape.brow;
    if (this.mouth) this.mouth.scale.set(this.mouthScale.x * shape.width, this.mouthScale.y * shape.mouth, this.mouthScale.z);
  }

  dispose() {
    for (const mesh of this.meshes) {
      mesh.removeFromParent();
      (mesh.material as T.Material).dispose();
      mesh.dispose();
    }
    this.geometry.dispose();
  }
}
