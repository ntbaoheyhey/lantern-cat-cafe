"""Closest-surface distance for Blender repair diagnostics, not vertex spacing."""
import numpy as np
from mathutils.bvhtree import BVHTree


def sample_surface_distances(points, vertices, faces, samples=20000):
    tree = BVHTree.FromPolygons(vertices.tolist(), faces.tolist(), all_triangles=True)
    selected = points[::max(1, len(points)//samples)]
    distances = np.asarray([tree.find_nearest(p)[3] for p in selected], dtype=float)
    if not len(distances) or not np.isfinite(distances).all():
        raise ValueError('Cannot measure distance to an empty or invalid surface')
    return {'method': 'sampled points to closest triangle surface (BVHTree)',
            'samples': len(selected), 'p95': float(np.quantile(distances, .95)),
            'max': float(distances.max())}
