"""Run with Blender: density must not be mistaken for a change of surface."""
import importlib.util
from pathlib import Path
import numpy as np

path = Path(__file__).with_name('surface-distance.py')
spec = importlib.util.spec_from_file_location('surface_distance', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
vertices = np.array([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], dtype=float)
faces = np.array([[0, 1, 2], [0, 2, 3]])
points = np.array([[.3, .4, 0], [.5, .6, 0], [.7, .8, 0]])
unchanged = module.sample_surface_distances(points, vertices, faces)
assert unchanged['max'] < 1e-6, unchanged
shifted = module.sample_surface_distances(points + [0, 0, .02], vertices, faces)
assert shifted['p95'] > .015, shifted
reversed_winding = module.sample_surface_distances(points, vertices, faces[:, ::-1])
assert reversed_winding['max'] < 1e-6, reversed_winding
outside = module.sample_surface_distances(np.array([[1.1, .5, 0]]), vertices, faces)
assert abs(outside['max'] - .1) < 1e-6, outside
print('4 closest-surface diagnostics PASS; unchanged .015 drift bound')
