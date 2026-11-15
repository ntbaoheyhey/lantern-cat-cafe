/** Diagnostic-only pixels identify the actual frame accepted by the compositor.
 * They are never part of the game or its asset bundle. A checksum rejects a
 * partially painted/JPEG-corrupted marker instead of guessing a frame. */
export const marker = Object.freeze({width: 128, height: 8, cell: 4, bits: 24});
export function markerWord(index) {
  if (!Number.isInteger(index) || index < 0 || index >= 0xffffff) throw Error('Frame marker out of range');
  const value = index + 1;
  const checksum = ((value & 255) ^ ((value >>> 8) & 255) ^ ((value >>> 16) & 255) ^ 0xa5) & 255;
  return (value * 256 + checksum) >>> 0;
}
export function decodeMarker(data, channels = 3) {
  let word = 0;
  for (let bit = 0; bit < 32; bit++) {
    let sum = 0;
    for (let y = 2; y < 6; y++) for (let x = bit * 4 + 1; x < bit * 4 + 3; x++) {
      const p = (y * marker.width + x) * channels;
      sum += (data[p] + data[p + 1] + data[p + 2]) / 3;
    }
    word = (word * 2 + Number(sum / 8 > 127)) >>> 0;
  }
  const value = word >>> 8;
  if (!value) return null;
  const expected = ((value & 255) ^ ((value >>> 8) & 255) ^ ((value >>> 16) & 255) ^ 0xa5) & 255;
  return (word & 255) === expected ? value - 1 : null;
}
