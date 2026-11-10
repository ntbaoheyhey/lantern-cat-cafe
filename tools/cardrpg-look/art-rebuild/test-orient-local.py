"""Verify native basis conversion without model inference or image resampling."""
import importlib.util
import json
import struct
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('orient', Path(__file__).with_name('orient-local-glb.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Orientation(unittest.TestCase):
    def test_basis_preserves_uv_texture_and_refuses_second_conversion(self):
        with tempfile.TemporaryDirectory() as td:
            source, target = Path(td)/'source.glb', Path(td)/'target.glb'
            payload = struct.pack('<ffffff', 1, 2, 3, -4, 5, -6) + b'unchangedUVimage!'
            doc = {'asset': {'version': '2.0'}, 'buffers': [{'byteLength': len(payload)}],
                   'bufferViews': [{'buffer': 0, 'byteLength': 24}],
                   'accessors': [{'bufferView': 0, 'componentType': 5126, 'type': 'VEC3', 'count': 2,
                                  'min': [-4, 2, -6], 'max': [1, 5, 3]}],
                   'meshes': [{'primitives': [{'attributes': {'POSITION': 0}}]}]}
            chunk = json.dumps(doc).encode(); chunk += b' '*(-len(chunk) % 4)
            source.write_bytes(struct.pack('<IIIII', 0x46546C67, 2, 28+len(chunk)+len(payload), len(chunk), 0x4E4F534A)
                               + chunk + struct.pack('<II', len(payload), 0x004E4942) + payload)
            before = source.read_bytes()
            module.orient(source, target)
            raw = target.read_bytes(); size = struct.unpack_from('<I', raw, 12)[0]
            actual = json.loads(raw[20:20+size]); binary = raw[28+size:]
            self.assertEqual(struct.unpack_from('<ffffff', binary), (1, 3, -2, -4, -6, -5))
            self.assertEqual(binary[24:], payload[24:])
            self.assertEqual(actual['accessors'][0]['min'], [-4, -6, -5])
            self.assertEqual(actual['accessors'][0]['max'], [1, 3, -2])
            self.assertEqual(source.read_bytes(), before)
            with self.assertRaises(ValueError): module.orient(target, Path(td)/'double.glb')
            with self.assertRaises(ValueError): module.orient(source, target)


if __name__ == '__main__':
    unittest.main()
