import * as T from 'three';
import colorUrl from '../../../../../../assets/cardrpg3/textures/felt-color.png?url';
import normalUrl from '../../../../../../assets/cardrpg3/textures/felt-normal.png?url';

/** A shared 1024px surface pair avoids repeating texture bytes in every GLB. */
export class CardSurfaces {
  readonly ready: Promise<void>;
  private textures: T.Texture[] = [];
  private disposed = false;

  constructor(renderer: T.WebGLRenderer) {
    const loader = new T.TextureLoader();
    this.ready = Promise.all([colorUrl, normalUrl].map(async (url, index) => {
      const texture = await loader.loadAsync(url);
      if (this.disposed) {
        texture.dispose();
      } else {
        this.textures[index] = texture;
        texture.name = `original_card_felt_${index === 0 ? 'color' : 'normal'}_1024`;
        texture.colorSpace = index === 0 ? T.SRGBColorSpace : T.NoColorSpace;
        texture.wrapS = texture.wrapT = T.RepeatWrapping;
        texture.flipY = false;
        texture.minFilter = T.LinearMipmapLinearFilter;
        texture.magFilter = T.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
      }
    })).then(() => undefined).catch(error => {
      this.dispose();
      throw error;
    });
  }

  apply(material: T.MeshStandardMaterial) {
    if (!/felt|knit/.test(material.name)) return;
    material.map = this.textures[0]!;
    material.normalMap = this.textures[1]!;
    material.normalScale.set(.22, .22);
    material.roughness = .87;
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `
        #include <lights_fragment_end>
        float feltRim = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 3.0);
        reflectedLight.indirectDiffuse += diffuseColor.rgb * feltRim * 0.13;
      `);
    };
    material.customProgramCacheKey = () => 'card-felt-rim-v1';
  }

  dispose() {
    this.disposed = true;
    for (const texture of this.textures) texture?.dispose();
    this.textures = [];
  }
}
