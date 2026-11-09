import * as T from 'three';

/** Identical contact quads share two draws; articulated bodies remain untouched. */
export class LookContactPool {
  readonly root = new T.Group();
  private readonly geometry = new T.PlaneGeometry(1, 1);
  private readonly pools: T.InstancedMesh<T.PlaneGeometry, T.MeshBasicMaterial>[];
  private readonly transform = new T.Matrix4();
  private readonly size = new T.Matrix4();

  constructor(source: T.MeshBasicMaterial) {
    this.root.name = 'look-contact-pool';
    this.pools = [false, true].map(boss => {
      const material = source.clone();
      if (boss) { material.color.set('#49293e'); material.opacity = .78; }
      const mesh = new T.InstancedMesh(this.geometry, material, 12);
      mesh.name = boss ? 'boss-contact-instances' : 'regular-contact-instances';
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false;
      // A real identity instance lets the loading queue upload both variants.
      mesh.setMatrixAt(0, this.transform);
      mesh.count = 1;
      this.root.add(mesh);
      return mesh;
    });
  }

  begin() { for (const mesh of this.pools) mesh.count = 0; }

  add(shadow: T.Mesh, visible: boolean) {
    if (!visible) return;
    const boss = (shadow.material as T.MeshBasicMaterial).opacity === .78;
    const mesh = this.pools[boss ? 1 : 0]!;
    // Preserve the source quad if an unexpected roster exceeds the fixed pool.
    if (mesh.count === 12) { shadow.visible = true; return; }
    shadow.updateWorldMatrix(true, false);
    const geometry = shadow.geometry as T.PlaneGeometry;
    this.size.makeScale(geometry.parameters.width, geometry.parameters.height, 1);
    this.transform.multiplyMatrices(shadow.matrixWorld, this.size);
    mesh.setMatrixAt(mesh.count++, this.transform);
    shadow.visible = false;
  }

  end() {
    for (const mesh of this.pools) {
      mesh.visible = mesh.count > 0;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  dispose() {
    this.root.removeFromParent();
    this.geometry.dispose();
    for (const mesh of this.pools) { mesh.material.dispose(); mesh.dispose(); }
  }
}
