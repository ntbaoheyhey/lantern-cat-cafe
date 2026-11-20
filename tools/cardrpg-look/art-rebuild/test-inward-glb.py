"""No-model regression for inward native exports and immutable atlas data."""
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest

import numpy as np

spec = importlib.util.spec_from_file_location('inward', Path(__file__).with_name('fix-inward-glb.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def fixture(path, inward=True):
    positions = np.asarray([[0,0,0],[1,0,0],[0,1,0],[0,0,1]], dtype='<f4')
    normals = np.asarray([[1,1,1],[-1,0,0],[0,-1,0],[0,0,-1]], dtype='<f4')
    uv = np.asarray([[0,0],[1,0],[0,1],[1,1]], dtype='<f4')
    faces = np.asarray([[0,2,1],[0,1,3],[0,3,2],[1,2,3]], dtype='<u4')
    if inward:
        faces[:,[1,2]] = faces[:,[2,1]]
    payload = positions.tobytes()+normals.tobytes()+uv.tobytes()+faces.tobytes()+b'original texture bytes!!'
    payload += b'\0'*(-len(payload)%4)
    doc = {'asset':{'version':'2.0'}, 'buffers':[{'byteLength':len(payload)}],
           'bufferViews':[{'buffer':0,'byteOffset':offset,'byteLength':size}
                          for offset,size in [(0,48),(48,48),(96,32),(128,48)]],
           'accessors':[{'bufferView':i,'componentType':5125 if i==3 else 5126,
                         'count':12 if i==3 else 4, 'type':['VEC3','VEC3','VEC2','SCALAR'][i]}
                        for i in range(4)],
           'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'TEXCOORD_0':2},'indices':3}]}]}
    chunk = json.dumps(doc).encode(); chunk += b' '*(-len(chunk)%4)
    path.write_bytes(struct.pack('<IIIII',0x46546C67,2,28+len(chunk)+len(payload),len(chunk),0x4E4F534A)
                     +chunk+struct.pack('<II',len(payload),0x004E4942)+payload)
    return payload


class InwardSource(unittest.TestCase):
    def test_corrects_culling_without_moving_surface_or_texture(self):
        with tempfile.TemporaryDirectory() as directory:
            source, target = Path(directory)/'source.glb', Path(directory)/'target.glb'
            before = fixture(source)
            source_bytes = source.read_bytes()
            receipt = module.fix(source,target)
            raw = target.read_bytes(); size = struct.unpack_from('<I',raw,12)[0]; after = raw[28+size:]
            self.assertEqual(source.read_bytes(),source_bytes)
            self.assertEqual(after[:48],before[:48])
            self.assertEqual(after[96:128],before[96:128])
            self.assertEqual(after[176:],before[176:])
            np.testing.assert_array_equal(np.frombuffer(after[48:96],'<f4'),-np.frombuffer(before[48:96],'<f4'))
            np.testing.assert_array_equal(np.frombuffer(after[128:176],'<u4').reshape(-1,3),
                                          np.frombuffer(before[128:176],'<u4').reshape(-1,3)[:,[0,2,1]])
            self.assertAlmostEqual(receipt['primitives'][0]['signedVolumeAfter'],1/6)
            with self.assertRaises(ValueError): module.fix(target,Path(directory)/'twice.glb')
            with self.assertRaises(ValueError): module.fix(source,target)

    def test_rejects_already_outward_source(self):
        with tempfile.TemporaryDirectory() as directory:
            source, target = Path(directory)/'source.glb', Path(directory)/'target.glb'
            fixture(source,inward=False)
            with self.assertRaisesRegex(ValueError,'not demonstrably inward'): module.fix(source,target)
            self.assertFalse(target.exists())


if __name__ == '__main__':
    unittest.main()
