import {unlink} from 'node:fs/promises';
import {resolve} from 'node:path';

// Independently checked against runtime source, manifests and cold-entry requests.
// Keep the original files in public/ and git; this only trims production output.
export const unusedPosters = ['biscuit','brioche','cinnamon','clover','inkcap','mallow',
  'marigold','mochi','panko','soot','sorrel','velvet','yarn-giant']
  .map(owner => `cinematics/${owner}-ult-poster.webp`);

export function excludeUnusedPosters() {
  let output;
  return {
    name: 'v5-exclude-unused-posters',
    apply: 'build',
    configResolved(config) {
      output = resolve(config.root, config.build.outDir);
      // Never allow this output-only operation to point at source/public files.
      if (output !== resolve(config.root, 'dist')) {
        throw new Error('Poster exclusion requires the web dist output directory.');
      }
    },
    async closeBundle() {
      if (!output) return;
      await Promise.all(unusedPosters.map(async path => {
        try { await unlink(resolve(output, path)); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }));
    },
  };
}
