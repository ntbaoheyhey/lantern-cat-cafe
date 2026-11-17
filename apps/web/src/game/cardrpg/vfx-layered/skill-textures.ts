/** CXI owns fetching/decoding. This registry accepts pixels without network or DOM work. */
export interface V5DecodedTexture {
  image: CanvasImageSource;
  width: number;
  height: number;
  cols: number;
  rows: number;
  frameMs: number;
  /** Manifest composition contract. Omitted by older loaders: use authored layer blend. */
  blend?: 'add' | 'screen' | 'normal';
}
const textures = new Map<string, Readonly<V5DecodedTexture>>();
export function registerV5Texture(key: string, texture: V5DecodedTexture): boolean {
  if (!/^[a-z0-9-]+$/.test(key) || !texture.image ||
      (texture.blend !== undefined && !['add', 'screen', 'normal'].includes(texture.blend)) ||
      ![texture.width, texture.height, texture.cols, texture.rows].every(n => Number.isInteger(n) && n > 0) ||
      !Number.isFinite(texture.frameMs) || texture.frameMs <= 0 || texture.cols * texture.rows > 256 ||
      texture.width % texture.cols !== 0 || texture.height % texture.rows !== 0) return false;
  textures.set(key, Object.freeze({...texture}));
  return true;
}
export const getV5Texture = (key: string) => textures.get(key);
export const clearV5Textures = () => textures.clear();
export interface V5TextureRect {x: number; y: number; width: number; height: number}
/** Retime the entire flipbook to its layer; never cut off later frames of an AG2 sheet. */
export function v5TextureRect(texture: V5DecodedTexture, progress: number, out: V5TextureRect): void {
  const count = texture.cols * texture.rows;
  const frame = Math.min(count - 1, Math.max(0, Math.floor((Number.isFinite(progress) ? progress : 0) * count)));
  out.width = texture.width / texture.cols; out.height = texture.height / texture.rows;
  out.x = frame % texture.cols * out.width; out.y = Math.floor(frame / texture.cols) * out.height;
}
