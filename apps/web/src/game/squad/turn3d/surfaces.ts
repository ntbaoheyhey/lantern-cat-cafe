/** Original canvas bakes for cafe wood, woven cloth and warm windows. */
import * as T from 'three';
import woodUrl from '../../../../../../assets/cardrpg3b/textures/stage-wood.png?url';
import clothUrl from '../../../../../../assets/cardrpg3b/textures/stage-cloth.png?url';
import windowUrl from '../../../../../../assets/cardrpg3b/textures/stage-window.png?url';

type StageSurface = 'wood' | 'cloth' | 'window';

function* bakeStageTexture(kind: StageSurface): Generator<void, T.CanvasTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  if (kind === 'window') {
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#5b5266');
    gradient.addColorStop(.55, '#b88171');
    gradient.addColorStop(1, '#e8ba86');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = '#e7cda24f';
    for (let index = 0; index < 18; index++) {
      context.beginPath();
      context.arc(18 + (index * 47) % 228, 35 + (index * 31) % 195, 6 + (index % 4) * 4, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    const pixels = context.createImageData(256, 256);
    const base = kind === 'wood' ? [203, 155, 112] : [211, 204, 195];
    for (let y = 0; y < 256; y++) {
      if (y % 16 === 0) yield;
      for (let x = 0; x < 256; x++) {
        const noise = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
        const shade = kind === 'wood'
          ? .68 + .11 * Math.sin(x * .20 + Math.sin(y * .021) * 3)
            + .07 * Math.sin(x * .71 + Math.sin(y * .03)) + noise * .035
          : .85 + ((x % 5 < 2) !== (y % 5 < 2) ? -.09 : .04) + noise * .035;
        const offset = (y * 256 + x) * 4;
        pixels.data[offset] = Math.round(base[0]! * shade);
        pixels.data[offset + 1] = Math.round(base[1]! * shade);
        pixels.data[offset + 2] = Math.round(base[2]! * shade);
        pixels.data[offset + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(kind === 'wood' ? 3 : kind === 'cloth' ? 5 : 1,
    kind === 'wood' ? 1 : kind === 'cloth' ? 3 : 1);
  texture.anisotropy = 4;
  return texture;
}

export function stageTexture(kind: StageSurface): T.CanvasTexture {
  const work = bakeStageTexture(kind);
  let step = work.next();
  while (!step.done) step = work.next();
  return step.value;
}

export async function prepareStageTexture(kind: StageSurface): Promise<T.Texture> {
  const texture = await new T.TextureLoader().loadAsync({ wood: woodUrl, cloth: clothUrl, window: windowUrl }[kind]);
  texture.name = `original_baked_stage_${kind}_256`;
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(kind === 'wood' ? 3 : kind === 'cloth' ? 5 : 1,
    kind === 'wood' ? 1 : kind === 'cloth' ? 3 : 1);
  texture.anisotropy = 4;
  return texture;
}
