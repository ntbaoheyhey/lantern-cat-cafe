"""Inspect native source topology before/after export, without modifying it.

Run under the shared timing lease for large raw checkpoints. Counts describe
topology only; a low defect count is not visual or runtime acceptance.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np


def inspect(vertices, faces):
    if vertices.ndim != 2 or vertices.shape[1] != 3 or not np.isfinite(vertices).all():
        raise ValueError('Expected finite 3D positions')
    if faces.ndim != 2 or faces.shape[1] != 3 or not np.issubdtype(faces.dtype, np.integer):
        raise ValueError('Expected integer triangle indices')
    if not len(faces) or faces.min() < 0 or faces.max() >= len(vertices):
        raise ValueError('Empty or out-of-bounds surface')
    canonical = np.sort(faces, axis=1)
    unique, first = np.unique(canonical, axis=0, return_index=True)
    retained = faces[first]
    edges = np.concatenate([retained[:, [0, 1]], retained[:, [1, 2]], retained[:, [2, 0]]])
    _, counts = np.unique(np.sort(edges, axis=1), axis=0, return_counts=True)
    a, b, c = vertices[retained[:, 0]], vertices[retained[:, 1]], vertices[retained[:, 2]]
    zero_area = np.count_nonzero(np.linalg.norm(np.cross(b-a, c-a), axis=1) <= 1e-12)
    return dict(vertices=len(vertices), triangles=len(faces), uniqueTriangles=len(unique),
                duplicateTriangles=len(faces)-len(unique), zeroAreaTriangles=int(zero_area),
                boundaryEdges=int(np.count_nonzero(counts == 1)),
                nonmanifoldEdges=int(np.count_nonzero(counts > 2)),
                maxEdgeIncidence=int(counts.max()), bounds=[vertices.min(0).tolist(), vertices.max(0).tolist()])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('checkpoints', type=Path, nargs='+')
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if args.out.exists():
        raise ValueError('Preserve existing diagnostic output')
    result = dict(modelRequests=0, runtimeAccepted=False, rows=[])
    for path in args.checkpoints:
        with np.load(path, allow_pickle=False) as source:
            row = inspect(source['vertices'], source['faces'])
        row.update(path=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest())
        result['rows'].append(row)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
