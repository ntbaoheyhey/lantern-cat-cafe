"""Regression: a transparent polygon surround must not duplicate a whole limb."""
import unittest
import cv2
import numpy as np
from build import part_overlap


class PartOverlapTests(unittest.TestCase):
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
