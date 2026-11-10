"""Recover a coherent shell from the saved native voxel cells, with no inference.

Run through run-lock.mjs using the external TRELLIS Python. All original data
is preserved; Blender checks the same two-direction .015 surface drift bound.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

import numpy as np
from scipy import ndimage
from skimage.measure import marching_cubes


def extract_shell(coords, origin, voxel_size):
    if not np.array_equal(coords, np.rint(coords)):
        raise ValueError('Expected integer native cells')
    cells = coords.astype(np.int32)
    low = cells.min(0) - 4
    shape = cells.max(0) - low + 5
    if np.prod(shape.astype(np.int64)) > 600 ** 3:
        raise ValueError('Shell reconstruction exceeds the bounded 512 source grid')
    occupied = np.zeros(shape, dtype=bool)
    occupied[tuple((cells - low).T)] = True
    # One-cell closing joins the local surface band. Filling enclosed regions
    # establishes an outside/inside orientation absent from the decoded quads.
    solid = ndimage.binary_fill_holes(ndimage.binary_closing(occupied, iterations=1))
    field = ndimage.gaussian_filter(solid.astype(np.float32), sigma=.65)
    vertices, faces, _, _ = marching_cubes(field, .5, allow_degenerate=False)
    vertices = (vertices + low + .5) * voxel_size + origin
    return vertices.astype(np.float32), faces.astype(np.uint32), {
        'gridShape': shape.tolist(), 'occupiedCells': int(occupied.sum()),
        'filledCells': int(solid.sum()), 'closeCells': 1, 'sigmaCells': .65,
    }


def recover_checkpoint(checkpoint, out, blender):
    """Shared cleanup stage, also usable by a generation already holding a lease."""
    out.mkdir(parents=True, exist_ok=False)
    with np.load(checkpoint, allow_pickle=False) as source:
        vertices, faces, metrics = extract_shell(source['voxel_coords'], source['origin'], source['voxel_size'].item())
    metrics.update(checkpointSha256=hashlib.sha256(checkpoint.read_bytes()).hexdigest(),
                   modelRequests=0, runtimeAccepted=False)
    candidate = out / 'shell.npz'
    np.savez(candidate, vertices=vertices, faces=faces, metrics=np.asarray(json.dumps(metrics)))
    surface = out / 'repaired-surface.npz'
    with (out / 'repair.log').open('w') as log:
        subprocess.run([str(blender), '-b', '--threads', '4', '--python-exit-code', '1', '--python',
                        str(Path(__file__).with_name('finish-voxel-shell.py')), '--',
                        '--checkpoint', str(checkpoint), '--shell', str(candidate), '--out', str(surface)],
                       stdout=log, stderr=subprocess.STDOUT, check=True, timeout=240)
    return surface


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--checkpoint', type=Path, required=True)
    p.add_argument('--generation-receipt', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    args = p.parse_args()
    root = Path(__file__).resolve().parents[3]
    if (root / 'STOP-B').exists():
        raise InterruptedError('STOP-B requested')
    lease = json.loads(Path('/tmp/cardrpg-big-locks/timing.lock/owner.json').read_text())
    if lease.get('lane') != 'B-LOOK' or lease.get('pid') != os.getppid():
        raise ValueError('Run through the shared timing lease')
    blender = str(Path.home() / 'tools/cardrpg-look/Blender.app/Contents/MacOS/Blender')
    surface = recover_checkpoint(args.checkpoint, args.out, blender)
    # exec preserves the lease parent's identity for export-decoded's guard.
    os.execv(sys.executable, [sys.executable, str(Path(__file__).with_name('export-decoded.py')),
             '--checkpoint', str(args.checkpoint), '--generation-receipt', str(args.generation_receipt),
             '--surface-checkpoint', str(surface), '--out', str(args.out / 'export')])


if __name__ == '__main__':
    main()
