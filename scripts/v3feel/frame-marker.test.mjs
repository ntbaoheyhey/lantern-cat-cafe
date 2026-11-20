import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {marker, markerWord, decodeMarker} from './frame-marker.mjs';

function pixels(index) {
  const data = Buffer.alloc(marker.width * marker.height * 3);
  const word = markerWord(index);
  for (let y = 0; y < marker.height; y++) for (let x = 0; x < marker.width; x++) {
    const on = (word >>> (31 - Math.floor(x / marker.cell))) & 1;
    data.fill(on ? 255 : 0, (y * marker.width + x) * 3, (y * marker.width + x + 1) * 3);
  }
  return data;
}

test('identifies rendered ordinals after lossy screenshot compression', async () => {
  for (const index of [0, 1, 255, 256, 899, 3665, 65535, 1000000]) {
    const input = pixels(index);
    const jpeg = await sharp(input, {raw: {...marker, channels: 3}}).jpeg({quality: 88}).toBuffer();
    const output = await sharp(jpeg).raw().toBuffer();
    assert.equal(decodeMarker(output), index);
  }
});

test('rejects a missing or partially overwritten frame instead of inventing timing', () => {
  assert.equal(decodeMarker(Buffer.alloc(marker.width * marker.height * 3)), null);
  const damaged = pixels(123);
  for (let y = 0; y < marker.height; y++) damaged.fill(255, (y * marker.width) * 3, (y * marker.width + 4) * 3);
  assert.equal(decodeMarker(damaged), null);
});
