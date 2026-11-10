"""Regression: a transparent polygon surround must not duplicate a whole limb."""
import unittest
import json
from pathlib import Path
from PIL import Image, ImageDraw
import cv2
import numpy as np
from build import part_overlap, authored_mask


class PartOverlapTests(unittest.TestCase):
    def test_crumb_complete_shield_gauntlet_chest_and_boots_have_distinct_owners(self):
        cfg = json.loads((Path(__file__).parent/'configs/crumb-sentinel.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((550,110),'head'),((450,360),'head'),((700,340),'head'),((500,480),'body'),((300,510),'body'),((580,800),'body'),((288,700),'body'),((200,480),'armL'),((262,558),'armL'),((156,777),'armL'),((820,430),'armR'),((845,540),'armR'),((1000,640),'armR'),((975,494),'armR'),((360,780),'footL'),((320,940),'footL'),((791,793),'footR'),((740,950),'footR')]:
            self.assertGreater(source.getpixel((x,y))[3],64,(x,y))
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['mainHand'][0], 'armR')
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armL')

    def test_pollen_wings_leaf_coat_basket_handle_and_boots_have_distinct_owners(self):
        cfg = json.loads((Path(__file__).parent/'configs/pollen-scout.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((600,340),'head'),((400,177),'head'),((300,400),'wingL'),((900,400),'wingR'),((790,589),'wingR'),((718,487),'body'),((720,585),'body'),((600,500),'body'),((600,700),'body'),((780,500),'armR'),((758,595),'armR'),((796,625),'armR'),((800,700),'armR'),((463,689),'armL'),((486,595),'armL'),((530,899),'footL'),((667,887),'footR')]:
            self.assertGreater(source.getpixel((x,y))[3],64,(x,y))
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['mainHand'][0], 'armR')
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armL')

    def test_teacup_spoon_palm_handle_and_saucer_stay_with_their_rigid_parts(self):
        cfg = json.loads((Path(__file__).parent/'configs/teacup-healer.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((145,251),'armL'),((149,419),'armL'),((220,957),'armL'),((300,610),'armL'),((1015,492),'armR'),((885,613),'armR'),((846,280),'body'),((850,474),'body'),((500,740),'body'),((430,775),'body'),((670,775),'body'),((510,369),'body'),((510,328),'head'),((510,110),'head'),((416,950),'footL'),((650,950),'footR')]:
            self.assertGreater(source.getpixel((x,y))[3],64,(x,y))
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['mainHand'][0], 'armL')
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armR')

    def test_needle_moth_whole_needle_wings_and_abdomen_keep_semantic_ownership(self):
        cfg = json.loads((Path(__file__).parent/'configs/needle-moth.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((300,178),'armL'),((336,600),'armL'),((383,1000),'armL'),((350,550),'armL'),((355,600),'wingL'),((400,600),'body'),((385,700),'body'),((480,395),'body'),((625,400),'wingR'),((880,700),'wingR'),((640,731),'armR'),((450,310),'head'),((610,110),'head'),((445,1090),'footL'),((575,1100),'footR')]:
            self.assertGreater(source.getpixel((x,y))[3],64,(x,y))
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['mainHand'][0], 'armL')
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armR')

    def test_velvet_whole_staff_ribbon_and_palm_exclude_cape(self):
        cfg = json.loads((Path(__file__).parent/'configs/velvet.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((849,268),'armR'),((685,1084),'armR'),((736,800),'armR'),((765,650),'armR'),((900,700),'armR'),((725,800),'body'),((747,800),'body'),((251,649),'armL'),((550,380),'head'),((550,415),'body'),((300,1000),'tail'),((600,1080),'footR')]:
            self.assertGreater(source.getpixel((x,y))[3],64,(x,y))
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['mainHand'][0], 'armR')
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armL')

    def test_button_guard_needle_shield_chest_and_boots_keep_semantic_ownership(self):
        cfg = json.loads((Path(__file__).parent/'configs/button-guard.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((1093,83),'armR'),((1000,550),'armR'),((650,396),'body'),((380,397),'body'),((842,580),'body'),((192,686),'armL'),((345,775),'body'),((650,1090),'footR'),((350,1025),'footL'),((550,340),'head')]:
            self.assertGreater(source.getpixel((x,y))[3],64,(x,y))
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['mainHand'][0], 'armR')
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armL')

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

    def test_brioche_open_basket_keeps_visible_skirt_on_body_and_tail_on_tail(self):
        cfg = json.loads((Path(__file__).parent/'configs/brioche.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((220,480),'head'),((820,740),'tail'),((320,670),'armL'),((293,789),'armL'),((250,860),'armL'),((250,780),'body'),((340,760),'body')]:
            self.assertGreater(source.getpixel((x,y))[3],64)
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armR')

    def test_marigold_keeps_pot_cheeks_tail_and_skirt_with_their_semantic_parts(self):
        cfg = json.loads((Path(__file__).parent/'configs/marigold.json').read_text())
        source = Image.open(Path(__file__).resolve().parents[4]/cfg['source']).convert('RGBA')
        source.thumbnail((1200, 1200))
        owners = np.zeros((source.height, source.width), np.uint8)
        for i, (part, polygon, _) in reversed(list(enumerate(cfg['layers']))):
            mask = authored_mask(source.size, polygon, cfg.get('holes', {}).get(part, ()))
            owners[mask > 0] = i+1
        for (x,y), expected in [((325,386),'head'),((382,430),'head'),((400,470),'body'),((550,494),'body'),((1015,461),'armR'),((903,435),'armR'),((858,480),'armR'),((263,730),'armL'),((220,650),'tail'),((280,909),'tail'),((340,926),'body'),((430,989),'body'),((650,1012),'body')]:
            self.assertGreater(source.getpixel((x,y))[3],64,(x,y))
            index = int(owners[y,x])-1
            actual = cfg['layers'][index][0] if index >= 0 else 'body'
            self.assertEqual(actual, expected, (x,y))
        self.assertEqual(cfg['socketSources']['mainHand'][0], 'armR')
        self.assertEqual(cfg['socketSources']['offHand'][0], 'armL')

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
