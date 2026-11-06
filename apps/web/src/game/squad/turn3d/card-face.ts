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

const IDENTITIES: Record<string, { spacing: number; width: number; height: number; iris: string; glint: string; brow: number }> = {
  biscuit: { spacing: .196, width: 1.09, height: .82, iris: '#50351c', glint: '#ffe0a1', brow: -.045 },
  inkcap: { spacing: .176, width: .87, height: 1.13, iris: '#322747', glint: '#d5b5fa', brow: .085 },
  cinnamon: { spacing: .202, width: 1.03, height: .97, iris: '#54322d', glint: '#ffd0aa', brow: -.025 },
  brioche: { spacing: .208, width: 1.14, height: .78, iris: '#423346', glint: '#dcc4ed', brow: .065 },
  velvet: { spacing: .174, width: .89, height: 1.06, iris: '#362c50', glint: '#efb4e4', brow: -.095 },
  marigold: { spacing: .199, width: .99, height: 1.09, iris: '#365044', glint: '#f9e6a8', brow: -.035 },
  panko: { spacing: .205, width: 1.12, height: .88, iris: '#463022', glint: '#fbd392', brow: .055 },
  mallow: { spacing: .177, width: .91, height: 1.12, iris: '#482730', glint: '#ffb68e', brow: -.07 },
  sorrel: { spacing: .184, width: .96, height: .92, iris: '#24394e', glint: '#b9e8f1', brow: .035 },
};

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
  private browOffset = 0;

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

    const identity = IDENTITIES[id];
    this.browOffset = identity?.brow ?? 0;
    const layers = [
      { color: identity?.iris ?? (role === 'witch' ? '#211e32' : '#292535'), offset: [0, 0, 0], size: [.088, .120, .038], glossy: true },
      { color: '#fff9e8', offset: [-.023, .045, .034], size: [.028, .036, .015], glossy: false },
      { color: identity?.glint ?? '#ffcd68', offset: [.028, -.05, .031], size: [.015, .018, .009], glossy: false },
    ];
    const transform = new T.Object3D();
    for (const [index, layer] of layers.entries()) {
      const material = layer.glossy
        ? new T.MeshStandardMaterial({ color: layer.color, roughness: .13, metalness: .04 })
        : new T.MeshBasicMaterial({ color: layer.color });
      const mesh = new T.InstancedMesh(this.geometry, material, 2);
      mesh.name = `${role}_eye_layer_${index}`;
      for (let eye = 0; eye < 2; eye++) {
        transform.position.set((eye === 0 ? -1 : 1) * (identity?.spacing ?? .19) + layer.offset[0]!, layer.offset[1]!, layer.offset[2]!);
        transform.scale.fromArray(layer.size);
        transform.scale.x *= identity?.width ?? 1; transform.scale.y *= identity?.height ?? 1;
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
    if (this.browLeft) this.browLeft.rotation.z = shape.brow + this.browOffset;
    if (this.browRight) this.browRight.rotation.z = -shape.brow - this.browOffset;
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
