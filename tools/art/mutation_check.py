#!/usr/bin/env python3
"""Apply genuine faults in disposable copies; unchanged tests must fail by assertion."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent
MUTANTS = [
    ('snap-samples-left-edge', '(2 * x + 1) * image.width // (2 * width)', 'x * image.width // width', 'PixelTests.test_nearest_centres_not_top_left'),
    ('palette-chooses-farthest', 'closest = min(palette,', 'closest = max(palette,', 'PixelTests.test_palette_nearest_and_idempotent'),
    ('alpha-threshold-off-by-one', "if p[3] < threshold:", "if p[3] <= threshold:", 'PixelTests.test_palette_distance_tie_and_threshold'),
    ('trim-drops-right-column', 'max(x for x, _ in occupied) + 1', 'max(x for x, _ in occupied)', 'PixelTests.test_trim_includes_last_occupied_row_column'),
    ('pad-shifts-right', '(width - image.width) // 2', '(width - image.width + 1) // 2', 'PixelTests.test_pad_asymmetric_remainder'),
    ('atlas-reverses-order', 'sorted(frames.items())', 'sorted(frames.items(), reverse=True)', 'AtlasTests.test_sorted_sheet_positions_gutters_and_metadata'),
    ('png-accepts-bad-crc', 'if zlib.crc32(kind + payload) != crc:', 'if False:', 'PngTests.test_crc_corruption_rejected'),
    ('writer-overwrites-existing', "with path.open('xb') as stream:", "with path.open('wb') as stream:", 'CliTests.test_exclusive_write_preserves_existing_file'),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--logs', type=Path, required=True)
    args = parser.parse_args()
    args.logs.mkdir(parents=True, exist_ok=True)
    original = (HERE / 'pipeline.py').read_text()
    results = []
    for name, old, new, test in MUTANTS:
        if original.count(old) != 1:
            raise ValueError('mutation anchor is not unique: ' + name)
        with tempfile.TemporaryDirectory(prefix='mutation-', dir=HERE) as folder:
            folder = Path(folder)
            for file in ('pipeline.py', 'test_pipeline.py', 'palette.json'):
                shutil.copyfile(HERE / file, folder / file)
            (folder / 'pipeline.py').write_text(original.replace(old, new))
            command = [sys.executable, '-B', '-m', 'unittest', '-v', 'test_pipeline.' + test]
            result = subprocess.run(command, cwd=folder, text=True, capture_output=True)
            output = result.stdout + result.stderr
            # A crash/import error is not a valid kill. The named behavior assertion must fail.
            killed = result.returncode == 1 and 'FAIL: ' in output and 'AssertionError' in output and 'ERROR: ' not in output
            (args.logs / (name + '.log')).write_text('SCRATCH COPY MUTATION: ' + name + '\nREPLACE: ' + old + '\nWITH: ' + new + '\nCOMMAND: ' + ' '.join(command) + '\n' + output + '\nEXIT: ' + str(result.returncode) + '\n')
            results.append({'mutant': name, 'test': test, 'exit': result.returncode, 'assertionKilled': killed})
            print(name + ': exit=' + str(result.returncode) + ', assertionKilled=' + str(killed))
    (args.logs / 'summary.json').write_text(json.dumps(results, indent=2) + '\n')
    if (HERE / 'pipeline.py').read_text() != original:
        raise RuntimeError('production pipeline changed during mutation run')
    print(f'{sum(r["assertionKilled"] for r in results)}/{len(results)} mutations produced assertion failures; scratch copies removed')
    return 0 if all(r['assertionKilled'] for r in results) else 1


if __name__ == '__main__':
    sys.exit(main())
