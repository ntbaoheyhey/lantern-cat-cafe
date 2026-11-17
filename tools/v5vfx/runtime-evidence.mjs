import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

/** A diff alone omits new runtime modules until they are staged. */
export function runtimeEvidence() {
  const scope = ['apps/web/src/game/cardrpg', 'apps/web/src/game/rig'];
  const git = args => execFileSync('git', args, {encoding: 'utf8'});
  const hash = value => createHash('sha256').update(value).digest('hex');
  const files = git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...scope]).split('\0').filter(Boolean).sort();
  return {
    runtimePatchSha256: hash(git(['diff', 'HEAD', '--', ...scope])),
    runtimeUntrackedSha256: Object.fromEntries(files.map(path => [path, hash(readFileSync(path))])),
  };
}
