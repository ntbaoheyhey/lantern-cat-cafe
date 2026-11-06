import * as T from 'three';

/** Original primitive dressing. All variants join the loading-time shader warmup. */
export function decorateChapterStage(stage: T.Group) {
  for (const chapter of [1, 2, 3]) {
    const group = new T.Group();
    group.userData.chapter = chapter;
    stage.add(group);
    const colors = chapter === 1 ? ['#b97873', '#e4bc7f'] : chapter === 2 ? ['#6e9779', '#d6a45d'] : ['#86739e', '#cfb295'];
    const material = new T.MeshStandardMaterial({ color: colors[0], roughness: .85 });
    const accent = new T.MeshStandardMaterial({ color: colors[1], roughness: .7 });
    for (const x of [-3.9, 3.9]) {
      const container = new T.Mesh(new T.BoxGeometry(1.8, .5, .65), material);
      container.position.set(x, .55, -3.35);
      group.add(container);
      if (chapter === 2) {
        for (let index = 0; index < 4; index++) {
          const leaf = new T.Mesh(new T.SphereGeometry(.28, 8, 6), material);
          leaf.scale.set(.7, 2, .6);
          leaf.position.set(x - .55 + index * .37, 1.1, -3.35);
          leaf.rotation.z = (index - 1.5) * .2;
          group.add(leaf);
          const fruit = new T.Mesh(new T.SphereGeometry(.15, 8, 6), accent);
          fruit.position.set(leaf.position.x + .12, .95, -3.1);
          group.add(fruit);
        }
      } else {
        for (let index = 0; index < 3; index++) {
          const geometry = chapter === 3 ? new T.CylinderGeometry(.18, .2, .52, 10) : new T.TorusGeometry(.22, .065, 6, 12);
          const piece = new T.Mesh(geometry, accent);
          piece.position.set(x - .55 + index * .55, 1.05, -3.35);
          group.add(piece);
        }
      }
    }
  }
}
