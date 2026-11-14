import {readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

// The B2 specification uses decimal MB, including both browser formats.
export const SHIPPED_AUDIO_LIMIT_BYTES = 16_000_000;
export const withinAudioBudget = bytes => Number.isSafeInteger(bytes) && bytes >= 0 && bytes <= SHIPPED_AUDIO_LIMIT_BYTES;

export function shippedAudioBytes(folder) {
  return readdirSync(folder, {withFileTypes: true}).reduce((total, entry) => {
    const path = join(folder, entry.name);
    return total + (entry.isDirectory() ? shippedAudioBytes(path)
      : /\.(mp3|webm|opus|ogg|flac|wav)$/i.test(entry.name) ? statSync(path).size : 0);
  }, 0);
}
