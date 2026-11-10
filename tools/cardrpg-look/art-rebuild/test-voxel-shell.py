"""No-model shell recovery checks; use external TRELLIS Python."""
import importlib.util
from pathlib import Path
import unittest
import numpy as np
import trimesh

spec = importlib.util.spec_from_file_location('shell', Path(__file__).with_name('repair-voxel-shell.py'))
shell = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shell)


class ShellRecovery(unittest.TestCase):
    def setUp(self):
        xyz = np.indices((32, 32, 32)).reshape(3, -1).T
        a = np.linalg.norm(xyz - [9, 16, 16], axis=1)
        b = np.linalg.norm(xyz - [23, 16, 16], axis=1)
        self.cells = xyz[((a > 4) & (a < 5.5)) | ((b > 3) & (b < 4.5))]

    def test_closed_oriented_shells_keep_separated_parts(self):
        v, f, _ = shell.extract_shell(self.cells, np.zeros(3), 1 / 512)
        mesh = trimesh.Trimesh(v, f, process=False)
        self.assertTrue(mesh.is_watertight)
        self.assertTrue(mesh.is_winding_consistent)
        self.assertEqual(len(mesh.split()), 2)

    def test_invalid_cell_grid_is_rejected(self):
        with self.assertRaises(ValueError):
            shell.extract_shell(self.cells + .1, np.zeros(3), 1 / 512)
        with self.assertRaises(ValueError):
            shell.extract_shell(np.array([[0, 0, 0], [10000, 10000, 10000]]), np.zeros(3), 1 / 512)


if __name__ == '__main__':
    unittest.main()
