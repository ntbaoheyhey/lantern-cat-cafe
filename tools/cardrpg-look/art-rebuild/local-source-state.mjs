import {stat} from 'node:fs/promises';
import {join} from 'node:path';

// Export failures must not discard a completed decode or trigger fresh inference.
export async function retainedDecode(directory, id, receipt) {
  if (receipt.status === 'GENERATED_NOT_REVIEWED') return null;
  for (const suffix of ['raw', 'decoded']) {
    const path = join(directory, `${id}.${suffix}.npz`);
    const info = await stat(path).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (info?.isFile() && info.size > 0) return path;
  }
  return null;
}
