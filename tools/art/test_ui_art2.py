"""Delivery contracts for original ART2 pixels, catalog and provenance."""
from collections import Counter
import hashlib
import json
import re
import unittest
from pathlib import Path
from pipeline import ROOT, decode_png, load_palette
from ui_art2 import drawings

class Art2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=json.loads((ROOT/'tools/art/ui-art2.json').read_text())['entries']

    def test_complete_unique_small_delivery(self):
        ids={r['id'] for r in self.rows}
        expected={f'{kind}-{shape}-{quality}' for kind in ['rune','pet'] for shape in ['frame','slot'] for quality in ['common','uncommon','rare','epic','legendary']}
        expected|={'skill-frame-'+name for name in ['seamsweep','kettlepulse','hempair','windowthrust','rafterecho','lanternarc','mossparcel']}
        expected|={'bag-empty','market-empty','forge-no-materials','no-wallet','offline','landing'}
        self.assertEqual(ids,expected);self.assertEqual(len(self.rows),33)
        self.assertEqual(len({r['sha256'] for r in self.rows}),33)
        self.assertEqual({r['path'] for r in self.rows},{str(p.relative_to(ROOT)) for p in (ROOT/'apps/web/public/ui-art2').glob('*.png')})
        self.assertLess(sum(r['bytes'] for r in self.rows),50_000)

    def test_native_palette_binary_alpha_and_transparent_frame_centres(self):
        palette={p[:3] for p in load_palette()}
        for row in self.rows:
            with self.subTest(id=row['id']):
                raw=(ROOT/row['path']).read_bytes();image=decode_png(raw)
                self.assertEqual(hashlib.sha256(raw).hexdigest(),row['sha256'])
                self.assertEqual((image.width,image.height),(row['width'],row['height']))
                visible=set();opaque=0
                for y in range(image.height):
                    for x in range(image.width):
                        p=image.at(x,y);self.assertIn(p[3],(0,255))
                        if p[3]:
                            visible.add(p[:3]);opaque+=1;self.assertIn(p[:3],palette)
                            self.assertTrue(2<=x<image.width-2 and 2<=y<image.height-2)
                        else:self.assertEqual(p,bytes(4))
                self.assertGreater(opaque,100);self.assertLessEqual(len(visible),16)
                if '-frame-' in row['id']:
                    self.assertTrue(all(image.at(x,y)==bytes(4) for y in range(8,40) for x in range(8,40)))

    def test_recipe_reproduces_every_pixel_and_records_exact_provenance(self):
        by_id={r['id']:r for r in self.rows};record=(ROOT/'reports/asset-provenance.md').read_text()
        for name,image,prompt in drawings():
            row=by_id[name];self.assertEqual(image,decode_png((ROOT/row['path']).read_bytes()))
            self.assertEqual(prompt,row['prompt']);self.assertIn(row['sha256'],record);self.assertIn(prompt,record)
            self.assertEqual(hashlib.sha256((ROOT/row['generator']).read_bytes()).hexdigest(),row['generatorSha256'])
            self.assertIn('no media input',row['source'].lower());self.assertEqual(row['date'],'2026-11-03')

    def test_static_preview_and_catalog_match_delivered_files(self):
        preview=ROOT/'docs/ui/art/art2.html';source=preview.read_text()
        sources=re.findall(r'<img src="([^"]+)"',source)
        self.assertEqual({(preview.parent/p).resolve() for p in sources},{(ROOT/r['path']).resolve() for r in self.rows})
        self.assertEqual(len(sources),33);self.assertEqual(source.count(' alt="'),33)
        catalog=json.loads((ROOT/'docs/ui/art/manifest.json').read_text())
        delivered={r['id']:r for r in catalog['slots'] if r['id'].startswith('art2.')}
        self.assertEqual(set(delivered),{'art2.'+r['id'] for r in self.rows})
        for row in self.rows:self.assertEqual(delivered['art2.'+row['id']]['path'],row['path'])

if __name__=='__main__':unittest.main()
