"""Regression: a transparent polygon surround must not duplicate a whole limb."""
import unittest
import json
from pathlib import Path
from PIL import Image, ImageDraw
import cv2
import numpy as np
from build import part_overlap


class PartOverlapTests(unittest.TestCase):
    def test_panko_whole_roller_and_mitten_belong_to_one_moving_arm(self):
        cfg = json.loads((Path(__file__).parent/'configs/panko.json').read_text())
        owners = Image.new('L', (1081, 1200))
        # Frontmost authored partition wins, just as at runtime packing.
        for i, (_, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            ImageDraw.Draw(owners).polygon([(round(x*1081), round(y*1200)) for x, y in polygon], fill=i+1)
        for point in [(.493,.376), (.427,.472), (.308,.551), (.300,.640)]:
            index = owners.getpixel((round(point[0]*1081),round(point[1]*1200)))-1
            self.assertGreaterEqual(index, 0)
            self.assertEqual(cfg['layers'][index][0], 'armL')
        self.assertEqual(cfg['sockets']['mainHand'][0], 'armL')
        self.assertEqual(cfg['sockets']['offHand'][0], 'armR')

    def test_mallow_whisk_and_mittens_exclude_scarf_and_tail(self):
        cfg = json.loads((Path(__file__).parent/'configs/mallow.json').read_text())
        owners = Image.new('L', (1115, 1200))
        for i, (_, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            ImageDraw.Draw(owners).polygon([(round(x*1115), round(y*1200)) for x, y in polygon], fill=i+1)
        for point, expected in [((.88,.185),'armR'),((.73,.57),'armR'),((.73,.425),'armR'),((.405,.55),'armL'),((.29,.6),'armL'),((.24,.43),'body'),((.15,.63),'tail'),((.215,.565),'tail')]:
            index = owners.getpixel((round(point[0]*1115),round(point[1]*1200)))-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected)
        self.assertEqual(cfg['sockets']['mainHand'][0], 'armR')
        self.assertEqual(cfg['sockets']['offHand'][0], 'armL')

    def test_biscuit_whole_shield_precedes_head_and_offhand_follows_shield(self):
        cfg = json.loads((Path(__file__).parent/'configs/biscuit.json').read_text())
        # Opaque golden rim pixel formerly detached into head; old UV(.674,.393) was transparent.
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        self.assertGreater(source.getpixel((707,480))[3], 200)
        owners = Image.new('L', (1036, 1200))
        for i, (_, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            ImageDraw.Draw(owners).polygon([(round(x*1036), round(y*1200)) for x, y in polygon], fill=i+1)
        for point, expected in [((.72,.39),'armR'),((707/1036,480/1200),'armR'),((.64,.54),'armR'),((.84,.70),'armR'),((.175,.345),'armL'),((.65,.36),'head')]:
            index = owners.getpixel((round(point[0]*1036),round(point[1]*1200)))-1
            self.assertGreaterEqual(index, 0)
            self.assertEqual(cfg['layers'][index][0], expected)
        self.assertEqual(cfg['sockets']['mainHand'][0], 'armL')
        self.assertEqual(cfg['sockets']['offHand'][0], 'armR')

    def test_joint_overlap_keeps_ink_but_not_the_distant_hand(self):
        alpha = np.zeros((80, 80), np.uint8)
        alpha[20:60, 20:45] = 255  # torso
        alpha[30:40, 45:70] = 255  # touching arm and distant hand
        mask = np.full_like(alpha, 255)
        mask[28:42, 45:72] = 0
        front = 255-mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        visible, extended = part_overlap(mask, alpha, front, kernel, opaque_only=True)
        self.assertTrue(np.array_equal(visible[20:60, 20:45], alpha[20:60, 20:45]))
        self.assertEqual(int(extended[35, 46]), 255)  # hidden shoulder fill
        self.assertEqual(int(extended[35, 65]), 0)  # no old hand behind moving layer
        self.assertTrue(np.all(extended[alpha == 0] == 0))

    def test_disconnected_opaque_parts_cannot_grow_from_transparent_canvas(self):
        alpha = np.zeros((80, 80), np.uint8)
        alpha[20:60, 20:40] = 255
        alpha[30:40, 60:70] = 255
        mask = np.full_like(alpha, 255)
        mask[28:42, 58:72] = 0
        _, extended = part_overlap(mask, alpha, 255-mask, np.ones((9, 9), np.uint8), opaque_only=True)
        self.assertEqual(int(extended[30:40, 60:70].max()), 0)


if __name__ == '__main__':
    unittest.main()
