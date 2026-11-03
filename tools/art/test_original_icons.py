"""Independent delivery checks for the newly authored static icon set."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import unittest
from pipeline import ROOT, decode_png, load_palette
from original_icons import SPECS

class OriginalIconTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry=json.loads((ROOT/'tools/art/original-icons.json').read_text())
        cls.atlas=json.loads((ROOT/cls.registry['atlas']['metadata']).read_text())
        cls.sheet=decode_png((ROOT/cls.registry['atlas']['image']).read_bytes())
    def test_complete_unique_authored_set(self):
        entries=self.registry['entries'];self.assertEqual(Counter(row['kind'] for row in entries),{'stat':12,'item':15,'skill':7})
        self.assertEqual({row['id'] for row in entries},{f'{kind}-{key.lower()}' for kind,rows in SPECS.items() for key in rows})
        self.assertEqual(len({row['sha256'] for row in entries}),34)
        self.assertEqual({(row['kind'],row['key']) for row in entries},{(kind,key) for kind,rows in SPECS.items() for key in rows})
        self.assertEqual(set(self.atlas['frames']),{row['id'] for row in entries})
    def test_palette_alpha_padding_and_exact_atlas_pixels(self):
        palette={color[:3] for color in load_palette()}
        for row in self.registry['entries']:
            with self.subTest(id=row['id']):
                raw=(ROOT/row['path']).read_bytes();self.assertEqual(hashlib.sha256(raw).hexdigest(),row['sha256'])
                image=decode_png(raw);self.assertEqual((image.width,image.height),(32,32));colors=set();opaque=0
                frame=self.atlas['frames'][row['id']]['frame'];self.assertEqual((frame['w'],frame['h']),(32,32))
                for y in range(32):
                    for x in range(32):
                        pixel=image.at(x,y);self.assertIn(pixel[3],(0,255));self.assertEqual(pixel,self.sheet.at(frame['x']+x,frame['y']+y))
                        if pixel[3]:
                            opaque+=1;colors.add(pixel[:3]);self.assertIn(pixel[:3],palette)
                            self.assertTrue(2<=x<=29 and 2<=y<=29)
                        else:self.assertEqual(pixel,bytes(4))
                self.assertGreater(opaque,30);self.assertLessEqual(len(colors),16)
    def test_prompt_date_method_and_generator_are_recorded(self):
        self.assertEqual(hashlib.sha256((ROOT/self.registry['generator']).read_bytes()).hexdigest(),self.registry['generatorSha256'])
        for row in self.registry['entries']:
            self.assertGreater(len(row['prompt']),80);self.assertRegex(row['date'],r'^2026-11-03$')
            self.assertIsNone(row['imageModel']);self.assertIsNone(row['seed']);self.assertIn('coordinate',row['tool'])
            self.assertEqual(row['postProcessing'],['snap32','palette-lock cafe-night-v1','trim','center-pad32','lossless optimize','check32 max16 colors','pack atlas gutter1'])

if __name__=='__main__':unittest.main()
