"""Camera motion must not manufacture effects; neutral light must still count."""
import importlib.util
import unittest
from pathlib import Path

import cv2
import numpy as np

spec = importlib.util.spec_from_file_location('colour', Path(__file__).with_name('field-colour-metrics.py'))
colour = importlib.util.module_from_spec(spec)
spec.loader.exec_module(colour)


class FieldColourTest(unittest.TestCase):
    def fixture(self, coloured=True):
        rng = np.random.default_rng(13)
        before = rng.integers(15, 105, (480, 960, 3), dtype=np.uint8)
        before = cv2.GaussianBlur(before, (5, 5), 0)
        for _ in range(250):
            x, y = rng.integers([0, 0], [960, 480])
            cv2.circle(before, (int(x), int(y)), int(rng.integers(3, 10)), (110, 95, 80), 1)
        transform = np.array([[1.067, 0, -110], [0, 1.067, -18]], dtype=float)
        after = cv2.warpAffine(before, transform, (960, 480), borderMode=cv2.BORDER_REFLECT)
        cv2.rectangle(after, (460, 180), (540, 260), (45, 100, 255) if coloured else (240, 240, 240), -1)
        return before, after

    def test_zoom_and_pan_do_not_count_as_effects(self):
        before, after = self.fixture()
        result, mask, _ = colour.measure(before, after, [0, 0, 960, 480], [])
        outside = mask.copy()
        outside[178:263, 458:543] = False
        self.assertLess(int(outside.sum()), 100)
        self.assertGreater(result['pixels'], 6000)
        self.assertAlmostEqual(result['cameraRegistration']['affine'][0][0], 1.067, places=2)

    def test_white_effect_is_included_without_saturation_filter(self):
        before, after = self.fixture(False)
        result, mask, _ = colour.measure(before, after, [0, 0, 960, 480], [])
        self.assertGreater(int(mask[185:255, 465:535].sum()), 4800)
        self.assertLess(result['meanSaturation'], .01)
        self.assertGreater(result['peakLuminance'], 235)


if __name__ == '__main__':
    unittest.main()
