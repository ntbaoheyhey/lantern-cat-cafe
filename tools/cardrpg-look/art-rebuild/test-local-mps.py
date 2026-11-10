"""Local generation guards: no inference, network, or installed model required."""
import importlib.util
import json
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image

SCRIPT = Path(__file__).with_name('image-to-3d.py')
spec = importlib.util.spec_from_file_location('local_mps', SCRIPT)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class LocalMpsGuards(unittest.TestCase):
    def test_opaque_input_cannot_trigger_background_model(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / 'input.png'
            for mode, color in [('RGB', (10, 20, 30)), ('RGBA', (10, 20, 30, 255)), ('RGBA', (0, 0, 0, 0))]:
                Image.new(mode, (4, 4), color).save(p)
                with self.assertRaises(ValueError):
                    runner.validate_alpha(p)
            im = Image.new('RGBA', (4, 4), (0, 0, 0, 0))
            im.putpixel((2, 2), (10, 20, 30, 255))
            im.save(p)
            self.assertEqual(runner.validate_alpha(p)['alphaRange'], [0, 255])

    def test_rmbg_patch_is_bounded_and_idempotent(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            p = root / 'TRELLIS.2/trellis2/pipelines/trellis2_image_to_3d.py'
            p.parent.mkdir(parents=True)
            p.write_text("pipeline.rembg_model = getattr(rembg, args['rembg_model']['name'])(**args['rembg_model']['args'])\n")
            first = runner.disable_rmbg(root)
            self.assertEqual(runner.disable_rmbg(root), first)
            self.assertIn('pipeline.rembg_model = None', p.read_text())
            p.write_text('changed upstream loader\n')
            with self.assertRaises(ValueError):
                runner.disable_rmbg(root)

    def test_export_must_be_complete_and_self_contained(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / 'asset.glb'
            def store(doc):
                raw = json.dumps(doc).encode()
                p.write_bytes(struct.pack('<IIIII', 0x46546C67, 2, 20 + len(raw), len(raw), 0x4E4F534A) + raw)
            store({'meshes': [{}], 'images': [{'bufferView': 0}]})
            self.assertEqual(runner.validate_glb(p)['images'], 1)
            store({'meshes': [{}], 'images': [{'uri': 'texture.png'}]})
            with self.assertRaises(ValueError):
                runner.validate_glb(p)
            p.write_bytes(p.read_bytes()[:-1])
            with self.assertRaises(ValueError):
                runner.validate_glb(p)

    def test_explicit_submission_and_completed_sources_are_guarded(self):
        for extra in [[], ['--backend', 'hf-space', '--submit'], ['--backend', 'local-mps', '--submit', '--id', 'mochi', '--seed', '1']]:
            result = subprocess.run([sys.executable, str(SCRIPT), '--out', '/tmp/must-not-generate'] + extra, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
        self.assertFalse(Path('/tmp/must-not-generate').exists())


if __name__ == '__main__':
    unittest.main()
