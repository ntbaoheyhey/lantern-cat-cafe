import * as T from 'three';
import { addCardStageLife, animateCardStageLife } from '../../squad/turn3d/card-stage-life';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

interface AmbientStage {
  dust: T.Points;
  steam: T.Mesh[];
  critters: { body: T.Group; wings: T.Mesh[]; restY: number }[];
}
const themes = [
  { wall: '#6f4c4b', trim: '#cdaa79', leaf: '#729483', light: '#ffe0a8' },
  { wall: '#45665d', trim: '#bea16b', leaf: '#82ad7c', light: '#e4e4b1' },
  { wall: '#60516e', trim: '#c7a782', leaf: '#a392b6', light: '#e6d2f5' },
];

/** Original café scenery, built once from primitives and instanced shelf details. */
export function decorateChapterStage(stage: T.Group) {
  stage.userData.candle = { flame: stage.getObjectByName('cafe-candle-flame'), halo: stage.getObjectByName('cafe-candle-halo') };
  for (const [index, theme] of themes.entries()) {
    const group = new T.Group();
    group.userData.chapter = index + 1;
    group.name = `chapter-${index + 1}-scenery`;
    stage.add(group);
    const ceramic = new T.MeshStandardMaterial({ color: theme.wall, roughness: .55 });
    const brass = new T.MeshStandardMaterial({ color: theme.trim, roughness: .48, metalness: .15 });
    const leaf = new T.MeshStandardMaterial({ color: theme.leaf, roughness: .9 });
    const glow = new T.MeshBasicMaterial({ color: theme.light });
    const mesh = (geometry: T.BufferGeometry, material: T.Material, x: number, y: number, z: number) => {
      const object = new T.Mesh(geometry, material);
      object.position.set(x, y, z);
      group.add(object);
      return object;
    };

    // Layered window arches and a shelf sit behind the playable table.
    for (const x of [-4.6, 0, 4.6]) {
      mesh(new T.TorusGeometry(1.16, .045, 5, 28, Math.PI), brass, x, 2.85, -5.34);
      mesh(new T.CylinderGeometry(.15, .19, .34, 10), ceramic, x - .76, 1, -5.02);
      for (let sprig = 0; sprig < 3; sprig++) {
        const foliage = mesh(new T.SphereGeometry(.17, 7, 5), leaf, x - .88 + sprig * .12, 1.3 + sprig % 2 * .12, -5.02);
        foliage.scale.set(.5, 1.8, .6);
        foliage.rotation.z = (sprig - 1) * .4;
      }
      mesh(new T.BoxGeometry(.035, .7, .035), brass, x + .7, 3.55, -4.94);
      mesh(new T.CylinderGeometry(.22, .3, .35, 6), ceramic, x + .7, 3.08, -4.94);
      mesh(new T.CylinderGeometry(.17, .23, .2, 6), glow, x + .7, 2.94, -4.94);
    }

    const shelfObjects = new T.InstancedMesh(new T.CylinderGeometry(.16, .18, .4, 10), ceramic, 12);
    const shelfLids = new T.InstancedMesh(new T.CylinderGeometry(.19, .19, .07, 10), brass, 12);
    const transform = new T.Object3D();
    for (let jar = 0; jar < 12; jar++) {
      const side = jar < 6 ? -1 : 1;
      transform.position.set(side * (3.9 + jar % 6 * .23), .95, -4.4);
      transform.scale.set(1, .8 + jar % 3 * .16, 1);
      transform.updateMatrix();
      shelfObjects.setMatrixAt(jar, transform.matrix);
      transform.position.y += .24 * transform.scale.y;
      transform.updateMatrix();
      shelfLids.setMatrixAt(jar, transform.matrix);
    }
    group.add(shelfObjects, shelfLids);

    // Each chapter has a different tabletop craft, kept behind both formations.
    for (const x of [-4.9, 4.9]) {
      mesh(new T.CylinderGeometry(.65, .68, .06, 20), brass, x, .035, -3.35);
      if (index === 0) {
        for (let bun = 0; bun < 3; bun++) {
          const bread = mesh(new T.TorusGeometry(.2, .085, 6, 14), ceramic, x + (bun - 1) * .37, .18, -3.35);
          bread.rotation.x = Math.PI / 2;
        }
      } else if (index === 1) {
        mesh(new T.CylinderGeometry(.42, .3, .4, 12), ceramic, x, .25, -3.35);
        for (let sprig = 0; sprig < 5; sprig++) {
          const foliage = mesh(new T.SphereGeometry(.22, 8, 5), leaf, x + Math.sin(sprig * 2.4) * .26, .65 + sprig % 2 * .16, -3.35 + Math.cos(sprig * 2.4) * .2);
          foliage.scale.set(.6, 1.7, .55);
          foliage.rotation.z = Math.sin(sprig) * .5;
        }
      } else {
        for (let spool = 0; spool < 3; spool++) {
          mesh(new T.CylinderGeometry(.19, .19, .38, 12), leaf, x + (spool - 1) * .35, .25, -3.35);
          mesh(new T.CylinderGeometry(.23, .23, .04, 12), brass, x + (spool - 1) * .35, .46, -3.35);
        }
      }
    }

    // Bake fixed decorations into one draw per material. Ambient parts stay movable.
    const staticGeometry = new Map<T.Material, T.BufferGeometry[]>();
    for (const object of [...group.children]) {
      if (!(object instanceof T.Mesh) || object instanceof T.InstancedMesh) continue;
      const material = object.material as T.Material;
      const geometries = staticGeometry.get(material) ?? [];
      object.updateMatrix();
      geometries.push(object.geometry.clone().applyMatrix4(object.matrix));
      staticGeometry.set(material, geometries);
      object.geometry.dispose();
      group.remove(object);
    }
    for (const [material, geometries] of staticGeometry) {
      const geometry = mergeGeometries(geometries);
      if (!geometry) throw new Error('Chapter decoration geometry could not merge');
      group.add(new T.Mesh(geometry, material));
      geometries.forEach(part => part.dispose());
    }

    addCardStageLife(group, index + 1);
    const particles = new Float32Array(44 * 3);
    for (let mote = 0; mote < 44; mote++) {
      particles[mote * 3] = Math.sin(mote * 12.9898) * 6;
      particles[mote * 3 + 1] = .4 + (mote % 11) * .24;
      particles[mote * 3 + 2] = -3.1 - (mote % 7) * .27;
    }
    const dustGeometry = new T.BufferGeometry();
    dustGeometry.setAttribute('position', new T.BufferAttribute(particles, 3));
    const dust = new T.Points(dustGeometry, new T.PointsMaterial({ color: theme.light, size: .025, transparent: true, opacity: .35, depthWrite: false }));
    group.add(dust);

    const steamMaterial = new T.MeshBasicMaterial({ color: theme.light, transparent: true, opacity: .12, depthWrite: false });
    const steam = Array.from({ length: 3 }, (_, plume) => {
      const points = Array.from({ length: 9 }, (_, step) => new T.Vector3(Math.sin(step * .85 + plume) * .06, step * .085, 0));
      const curve = new T.CatmullRomCurve3(points);
      return mesh(new T.TubeGeometry(curve, 16, .008, 4, false), steamMaterial, -5.4 + plume * .035, .62, -2.7);
    });

    const critters = [-1, 1].map(side => {
      const body = new T.Group();
      body.position.set(side * 5.7, .92, -4.7);
      group.add(body);
      const seed = new T.Mesh(new T.SphereGeometry(.12, 8, 6), ceramic);
      seed.scale.set(1, .7, 1.3);
      body.add(seed);
      const wings = [-1, 1].map(wingSide => {
        const wing = new T.Mesh(new T.ConeGeometry(.11, .26, 3), brass);
        wing.position.x = wingSide * .12;
        wing.rotation.z = wingSide * 1.1;
        body.add(wing);
        return wing;
      });
      return { body, wings, restY: body.position.y };
    });
    group.userData.ambient = { dust, steam, critters } satisfies AmbientStage;
  }
}

export function animateChapterStage(stage: T.Group, time: number, reducedMotion: boolean) {
  const t = reducedMotion ? 0 : time;
  const candle = stage.userData.candle as { flame: T.Mesh; halo: T.Sprite };
  const flicker = Math.sin(t * 8.3) * .06 + Math.sin(t * 13.7) * .025;
  candle.flame.scale.y = 1.7 + flicker;
  candle.halo.material.opacity = .6 + flicker;
  for (const chapter of stage.children) {
    const ambient = chapter.userData.ambient as AmbientStage | undefined;
    if (!chapter.visible || !ambient) continue;
    animateCardStageLife(chapter as T.Group, time, reducedMotion);
    ambient.dust.position.set(Math.sin(t * .13) * .16, Math.sin(t * .3) * .13, 0);
    for (const [index, plume] of ambient.steam.entries()) {
      plume.position.y = .62 + (Math.sin(t * .7 + index) + 1) * .08;
      plume.rotation.y = Math.sin(t * .4 + index) * .4;
    }
    for (const [index, critter] of ambient.critters.entries()) {
      const flutter = Math.max(0, Math.sin(t * .8 + index * 2) - .7) / .3;
      critter.body.position.y = critter.restY + flutter * .08;
      critter.wings[0]!.rotation.z = -1.1 + Math.sin(t * 15) * flutter * .35;
      critter.wings[1]!.rotation.z = 1.1 - Math.sin(t * 15) * flutter * .35;
    }
  }
}
