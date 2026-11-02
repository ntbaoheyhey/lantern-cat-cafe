"""Original in-memory fixture pixels only; no application art is ever an output."""
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib

from pipeline import (Image, SIGNATURE, chunk, decode_png, encode_png, optimize_png, json_bytes,
                      load_palette, pack, pad, palette_lock, snap, trim, write_new)

HERE = Path(__file__).resolve().parent
RED, GREEN, BLUE, CLEAR = bytes([255, 0, 0, 255]), bytes([0, 255, 0, 255]), bytes([0, 0, 255, 255]), bytes(4)


def fixture():
    """Three-pixel asymmetric pennant; authored here for ART1, no randomness/input art."""
    return Image(4, 3, CLEAR * 5 + RED + GREEN + CLEAR * 3 + BLUE + CLEAR)


def raw_png(width, height, mode, raw, extra=b'', depth=8, interlace=0):
    # Independent filter byte fixtures; deliberately do not call the production encoder.
    return (SIGNATURE + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, depth, mode, 0, 0, interlace))
            + extra + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))


class PixelTests(unittest.TestCase):
    def test_nearest_centres_not_top_left(self):
        image = Image(4, 2, RED + GREEN + BLUE + CLEAR + BLUE + RED + GREEN + BLUE)
        self.assertEqual(snap(image, 2, 1).pixels, RED + BLUE)

    def test_odd_resize_and_identity(self):
        image = Image(3, 1, RED + GREEN + BLUE)
        self.assertEqual(snap(image, 2, 1).pixels, RED + BLUE)
        self.assertEqual(snap(image, 3, 1), image)

    def test_resize_rejects_bad_grid(self):
        for dims in [(0, 1), (5, 1), (1, 4)]:
            with self.assertRaises(ValueError):
                snap(fixture(), *dims)

    def test_palette_distance_tie_and_threshold(self):
        image = Image(4, 1, bytes([1, 0, 0, 255, 2, 0, 0, 127, 2, 0, 0, 128, 8, 9, 10, 0]))
        palette = [bytes([0, 0, 0]), bytes([2, 0, 0])]
        self.assertEqual(palette_lock(image, palette).pixels, bytes([0, 0, 0, 255]) + CLEAR + bytes([2, 0, 0, 255]) + CLEAR)

    def test_palette_nearest_and_idempotent(self):
        image = Image(1, 1, bytes([250, 2, 1, 200]))
        locked = palette_lock(image, [RED[:3], BLUE[:3]])
        self.assertEqual(locked.pixels, RED)
        self.assertEqual(palette_lock(locked, [RED[:3], BLUE[:3]]), locked)

    def test_locked_palette_has_48_distinct_colors(self):
        palette = load_palette(HERE / 'palette.json')
        self.assertEqual(len(palette), 48)
        self.assertEqual(len(set(palette)), 48)
        self.assertEqual(palette[0], bytes.fromhex('100c18'))

    def test_bad_palette(self):
        for palette, threshold in [([], 128), ([b'bad!'], 128), ([RED[:3]], 0)]:
            with self.assertRaises(ValueError):
                palette_lock(fixture(), palette, threshold)

    def test_palette_file_contract_rejects_malformed_values(self):
        with tempfile.TemporaryDirectory(dir=HERE) as folder:
            path = Path(folder) / 'palette.json'
            for value in ([], {}, {'schemaVersion': 2, 'colors': ['#000000']},
                          {'schemaVersion': 1, 'colors': []}, {'schemaVersion': 1, 'colors': [5]},
                          {'schemaVersion': 1, 'colors': ['#000000', '#000000']},
                          {'schemaVersion': 1, 'colors': ['#ABCDEF']}):
                path.write_text(json.dumps(value))
                with self.assertRaises(ValueError):
                    load_palette(path)

    def test_trim_includes_last_occupied_row_column(self):
        image, rect = trim(fixture())
        self.assertEqual((image.width, image.height), (2, 2))
        self.assertEqual(image.pixels, RED + GREEN + CLEAR + BLUE)
        self.assertEqual(rect, {'x': 1, 'y': 1, 'w': 2, 'h': 2, 'empty': False})

    def test_empty_and_single_pixel_trim(self):
        image, rect = trim(Image(4, 3, CLEAR * 12))
        self.assertEqual(image, Image(1, 1, CLEAR))
        self.assertEqual(rect['empty'], True)
        self.assertEqual(trim(Image(1, 1, RED))[0], Image(1, 1, RED))

    def test_pad_asymmetric_remainder(self):
        image = pad(Image(2, 1, RED + GREEN), 5, 4)
        self.assertEqual(image.at(1, 1), RED)
        self.assertEqual(image.at(2, 1), GREEN)
        self.assertEqual(image.at(3, 1), CLEAR)
        self.assertEqual(image.at(1, 2), CLEAR)
        self.assertEqual(image.at(0, 0), CLEAR)
        with self.assertRaises(ValueError):
            pad(fixture(), 1, 1)
        with self.assertRaises(ValueError):
            pad(fixture(), 100_000, 100_000)


class PngTests(unittest.TestCase):
    def test_known_rgba_filters_all_five(self):
        # The same two pixel row reconstructed from PNG filter 0, 1, 2, 3, 4 bytes.
        # Previous row is [10,20,30,255, 20,40,60,255]. Second is [30,50,70,255, 40,80,100,255].
        first = bytes([10, 20, 30, 255, 20, 40, 60, 255])
        second = bytes([30, 50, 70, 255, 40, 80, 100, 255])
        encoded = [second, bytes([30, 50, 70, 255, 10, 30, 30, 0]),
                   bytes([20, 30, 40, 0, 20, 40, 40, 0]),
                   bytes([25, 40, 55, 128, 15, 35, 35, 0]),
                   bytes([20, 30, 40, 0, 10, 30, 30, 0])]
        for filter_type, row in enumerate(encoded):
            with self.subTest(filter=filter_type):
                self.assertEqual(decode_png(raw_png(2, 2, 6, b'\0' + first + bytes([filter_type]) + row)).pixels, first + second)

    def test_rgb_gray_grayalpha_indexed_transparency(self):
        cases = [
            (2, b'\0\xff\0\0', b'', RED),
            (2, b'\0\xff\0\0', chunk(b'tRNS', struct.pack('>HHH', 255, 0, 0)), RED[:3] + b'\0'),
            (0, b'\0\x80', b'', bytes([128, 128, 128, 255])),
            (0, b'\0\x80', chunk(b'tRNS', b'\0\x80'), bytes([128, 128, 128, 0])),
            (4, b'\0\x40\x80', b'', bytes([64, 64, 64, 128])),
            (3, b'\0\x01', chunk(b'PLTE', RED[:3] + BLUE[:3]) + chunk(b'tRNS', b'\xff\x00'), BLUE[:3] + b'\0')]
        for mode, raw, extra, expected in cases:
            with self.subTest(mode=mode, extra=extra):
                self.assertEqual(decode_png(raw_png(1, 1, mode, raw, extra)).pixels, expected)

    def test_lossless_rgba_including_hidden_rgb_and_partial_alpha(self):
        image = Image(4, 1, RED + bytes([22, 33, 44, 0, 55, 66, 77, 127]) + CLEAR)
        self.assertEqual(decode_png(encode_png(image)), image)

    def test_more_than_256_colors(self):
        image = Image(257, 1, b''.join(bytes([i % 256, i // 256, 0, 255]) for i in range(257)))
        self.assertEqual(decode_png(encode_png(image)), image)

    def test_repeatable_optimized_bytes_and_metadata_removed(self):
        image = fixture()
        source = raw_png(4, 3, 6, b''.join(b'\0' + image.pixels[i:i + 16] for i in range(0, 48, 16)), chunk(b'tEXt', b'author\0fixture' * 40))
        encoded = encode_png(decode_png(source))
        self.assertLess(len(encoded), len(source))
        self.assertNotIn(b'tEXt', encoded)
        self.assertEqual(encode_png(decode_png(encoded)), encoded)
        self.assertEqual(decode_png(encoded), image)

    def test_optimizer_never_grows_and_is_idempotent(self):
        image = fixture()
        raw = b''.join(b'\0' + image.pixels[i:i + 16] for i in range(0, 48, 16))
        for source in (raw_png(4, 3, 6, raw), encode_png(image)):
            optimized = optimize_png(source)
            self.assertLessEqual(len(optimized), len(source))
            self.assertEqual(decode_png(optimized), image)
            self.assertEqual(optimize_png(optimized), optimized)

    def test_crc_corruption_rejected(self):
        corrupted = bytearray(encode_png(fixture()))
        corrupted[20] ^= 1
        with self.assertRaisesRegex(ValueError, 'CRC'):
            decode_png(bytes(corrupted))

    def test_malformed_and_unsupported_rejected(self):
        good = encode_png(fixture())
        bad = [b'not png', good[:-1], good + b'junk', raw_png(1, 1, 6, b'\0' + RED, depth=16),
               raw_png(1, 1, 6, b'\0' + RED, interlace=1), raw_png(1, 1, 6, b'\x05' + RED),
               raw_png(1, 1, 6, b'\0' + RED + RED), raw_png(0, 1, 6, b''),
               raw_png(1, 1, 3, b'\0\x02', chunk(b'PLTE', RED[:3])),
               raw_png(1, 1, 6, b'\0' + RED, chunk(b'acTL', bytes(8))),
               raw_png(1, 1, 6, b'\0' + RED, chunk(b'ABCD', b''))]
        for value in bad:
            with self.subTest(length=len(value)):
                with self.assertRaises(ValueError):
                    decode_png(value)


class AtlasTests(unittest.TestCase):
    def test_sorted_sheet_positions_gutters_and_metadata(self):
        sheet, atlas = pack({'z': Image(1, 1, BLUE), 'a': Image(2, 1, RED + GREEN), 'm': Image(1, 2, GREEN + RED)}, columns=2)
        self.assertEqual((sheet.width, sheet.height), (8, 8))
        self.assertEqual(atlas['meta']['frameOrder'], ['a', 'm', 'z'])
        self.assertEqual(atlas['frames']['z']['frame'], {'x': 1, 'y': 5, 'w': 1, 'h': 1})
        self.assertEqual(sheet.at(1, 1), RED)
        self.assertEqual(sheet.at(2, 1), GREEN)
        self.assertEqual(sheet.at(5, 2), RED)
        self.assertEqual(sheet.at(1, 5), BLUE)
        self.assertEqual(sheet.at(3, 1), CLEAR)
        self.assertEqual(sheet.at(4, 1), CLEAR)
        self.assertEqual(atlas['meta']['reducedMotionFrame'], 'a')

    def test_trimmed_atlas_reconstructs_source(self):
        image = fixture()
        sheet, atlas = pack({'f': image}, do_trim=True)
        entry = atlas['frames']['f']
        self.assertEqual(entry['spriteSourceSize'], {'x': 1, 'y': 1, 'w': 2, 'h': 2})
        self.assertEqual(entry['sourceSize'], {'w': 4, 'h': 3})
        reconstructed = bytearray(48)
        frame, source = entry['frame'], entry['spriteSourceSize']
        for y in range(frame['h']):
            for x in range(frame['w']):
                i = ((source['y'] + y) * 4 + source['x'] + x) * 4
                reconstructed[i:i + 4] = sheet.at(frame['x'] + x, frame['y'] + y)
        self.assertEqual(bytes(reconstructed), image.pixels)

    def test_atlas_determinism_permuted_inputs(self):
        a = pack({'z': fixture(), 'a': Image(1, 1, RED)})
        b = pack({'a': Image(1, 1, RED), 'z': fixture()})
        self.assertEqual(encode_png(a[0]), encode_png(b[0]))
        self.assertEqual(json_bytes(a[1]), json_bytes(b[1]))

    def test_invalid_sheet_options(self):
        for frames, columns, gutter, fps in [({}, 1, 1, 12), ({'bad/id': fixture()}, 1, 1, 12),
                                            ({'ok': fixture()}, 0, 1, 12), ({'ok': fixture()}, 1, 0, 12), ({'ok': fixture()}, 1, 1, 0)]:
            with self.assertRaises(ValueError):
                pack(frames, columns, gutter, fps)


class CliTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run([sys.executable, '-B', str(HERE / 'pipeline.py'), *map(str, args)], capture_output=True, text=True)

    def test_exclusive_write_preserves_existing_file(self):
        with tempfile.TemporaryDirectory(dir=HERE) as folder:
            output = Path(folder) / 'existing.png'
            output.write_bytes(b'existing original')
            with self.assertRaises(FileExistsError):
                write_new(output, b'changed')
            self.assertEqual(output.read_bytes(), b'existing original')

    def test_whole_cli_chain_twice_and_validation(self):
        with tempfile.TemporaryDirectory(dir=HERE) as folder:
            folder = Path(folder)
            original = folder / 'fixture.png'
            original.write_bytes(encode_png(fixture()))
            old = original.read_bytes()
            for run in ('one', 'two'):
                base = folder / run
                base.mkdir()
                commands = [
                    ('snap', original, base / 'snap.png', '--width', 4, '--height', 3),
                    ('lock', base / 'snap.png', base / 'lock.png', '--palette', HERE / 'palette.json'),
                    ('trim', base / 'lock.png', base / 'trim.png', '--metadata', base / 'trim.json'),
                    ('pad', base / 'trim.png', base / 'pad.png', '--width', 32, '--height', 32),
                    ('optimize', base / 'pad.png', base / 'optimized.png'),
                    ('check', base / 'optimized.png', '--width', 32, '--height', 32, '--palette', HERE / 'palette.json'),
                    ('sheet', base / 'sheet', base / 'pad.png', base / 'trim.png', '--columns', 1, '--trim')]
                for command in commands:
                    result = self.run_cli(*command)
                    self.assertEqual(result.returncode, 0, result.stderr)
                atlas = json.loads((base / 'sheet/atlas.json').read_text())
                self.assertEqual(atlas['meta']['image'], 'sheet.png')
            for name in ('snap.png', 'lock.png', 'trim.png', 'trim.json', 'pad.png', 'optimized.png', 'sheet/sheet.png', 'sheet/atlas.json'):
                self.assertEqual((folder / 'one' / name).read_bytes(), (folder / 'two' / name).read_bytes())
            self.assertEqual(original.read_bytes(), old)
            for command in [('optimize', original, original), ('sheet', folder / 'one/sheet', original),
                            ('sheet', folder / 'duplicates', original, original),
                            ('check', original, '--width', 4, '--height', 3, '--palette', HERE / 'palette.json'),
                            ('trim', original, folder / 'same', '--metadata', folder / 'same')]:
                self.assertEqual(self.run_cli(*command).returncode, 1)
            self.assertEqual(original.read_bytes(), old)


if __name__ == '__main__':
    unittest.main()
