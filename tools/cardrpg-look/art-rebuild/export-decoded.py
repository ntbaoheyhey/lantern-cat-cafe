"""Recover a timed-out native export without loading models or generating again.

Run with trellis-mac's Python through the shared timing lease. Input is the
immutable .decoded.npz checkpoint; output must be new. Never installs runtime.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--checkpoint', required=True, type=Path)
parser.add_argument('--out', required=True, type=Path)
parser.add_argument('--generation-receipt', required=True, type=Path)
repair_group = parser.add_mutually_exclusive_group()
repair_group.add_argument('--surface-checkpoint', type=Path, help='Explicit local geometry repair of the immutable checkpoint')
repair_group.add_argument('--repair-surface', action='store_true', help='One bounded Blender remesh, export and views under this same lease')
parser.add_argument('--trellis-root', type=Path, default=Path.home() / 'art/trellis-mac')
parser.add_argument('--blender', type=Path, default=Path.home() / 'tools/cardrpg-look/Blender.app/Contents/MacOS/Blender')
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
if (root / 'STOP-B').exists():
    raise InterruptedError('STOP-B requested')
lease = json.loads(Path('/tmp/cardrpg-big-locks/timing.lock/owner.json').read_text())
if lease.get('lane') != 'B-LOOK' or lease.get('pid') != os.getppid():
    raise ValueError('Run through the shared run-lock.mjs')
generation = json.loads(args.generation_receipt.read_text())
if generation.get('status') not in ('INTERRUPTED', 'FAILED'):
    raise ValueError('Only recover a terminal failed export; preserve any successful or active generation')
if generation.get('backend') != 'local-mps' or generation.get('runtimeAccepted') is not False:
    raise ValueError('Expected an unaccepted native generation receipt')
if args.checkpoint.resolve().parent != args.generation_receipt.resolve().parent:
    raise ValueError('Checkpoint must belong to the recorded generation')
args.out.mkdir(parents=True, exist_ok=False)
started = time.monotonic()
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
receipt = dict(status='EXPORTING', checkpoint=str(args.checkpoint), checkpointSha256=sha(args.checkpoint),
               generationReceipt=str(args.generation_receipt), generationReceiptSha256=sha(args.generation_receipt),
               unit=generation['id'], seed=generation['seed'], sourceSha256=generation['sourceSha256'],
               modelRequests=0, runtimeAccepted=False, uvMethod='Blender Smart UV Project 66deg, fractional margin .0001, area .25')
def save(**values):
    receipt.update(values, elapsedSeconds=round(time.monotonic() - started, 3))
    (args.out / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
save()
try:
    if args.repair_surface:
        args.surface_checkpoint = args.out / 'repaired-surface.npz'
        with (args.out / 'repair.log').open('w') as log:
            subprocess.run([str(args.blender), '-b', '--threads', '4', '--python',
                            str(Path(__file__).with_name('repair-decoded.py')), '--',
                            '--checkpoint', str(args.checkpoint), '--out', str(args.surface_checkpoint)],
                           stdout=log, stderr=subprocess.STDOUT, check=True, timeout=240)
    surface_checkpoint = args.surface_checkpoint or args.checkpoint
    with np.load(surface_checkpoint, allow_pickle=False) as data:
        source = {k: data[k] for k in data.files}
    if args.surface_checkpoint:
        repair = json.loads(source['surface_repair'].item())
        if repair.get('sourceCheckpointSha256') != receipt['checkpointSha256'] or repair.get('modelRequests') != 0:
            raise ValueError('Repair must name this exact decoded checkpoint without inference')
        with np.load(args.checkpoint, allow_pickle=False) as original:
            for key in ('voxel_coords', 'voxel_attrs', 'origin', 'voxel_size', 'texture_size'):
                if not np.array_equal(source[key], original[key]):
                    raise ValueError('Surface repair changed decoded colour data')
        save(surfaceRepair=repair, surfaceCheckpoint=str(surface_checkpoint), surfaceCheckpointSha256=sha(surface_checkpoint))
    required = {'vertices', 'faces', 'voxel_coords', 'voxel_attrs', 'origin', 'voxel_size', 'texture_size'}
    if not required.issubset(source) or not all(np.isfinite(source[k]).all() for k in required):
        raise ValueError('Incomplete or nonfinite decoded checkpoint')
    if source['vertices'].ndim != 2 or source['vertices'].shape[1] != 3 or source['faces'].ndim != 2 or source['faces'].shape[1] != 3:
        raise ValueError('Expected triangular geometry')
    if source['faces'].min() < 0 or source['faces'].max() >= len(source['vertices']) or source['voxel_size'].item() <= 0:
        raise ValueError('Invalid geometry indices or voxel size')
    uv_path = args.out / 'surface-uv.npz'
    command = [str(args.blender), '-b', '--threads', '4', '--python', str(Path(__file__).with_name('unwrap-decoded.py')),
               '--', '--checkpoint', str(surface_checkpoint), '--out', str(uv_path)]
    with (args.out / 'uv.log').open('w') as log:
        subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True, timeout=240)
    with np.load(uv_path, allow_pickle=False) as uv:
        vertices, faces, uvs = uv['vertices'], uv['faces'], uv['uvs']
        mapping = uv['original_vertex']
        original_face = uv['original_face']
        if not np.array_equal(vertices, source['vertices'][mapping]):
            raise ValueError('UV stage changed original positions')
        if not np.array_equal(mapping[faces], source['faces'][original_face]):
            raise ValueError('UV stage changed retained triangle indices or winding')
        expected_faces = np.unique(np.sort(source['faces'], axis=1), axis=0)
        if not np.array_equal(np.unique(np.sort(mapping[faces], axis=1), axis=0), expected_faces):
            raise ValueError('UV stage changed unique surface coverage')
    save(uvSeconds=round(time.monotonic()-started, 3), sourceTriangles=len(source['faces']),
         exportedTriangles=len(faces), duplicateFacesRemoved=len(source['faces'])-len(faces))
    triangles_uv = uvs[faces]
    du, dv = triangles_uv[:, 1] - triangles_uv[:, 0], triangles_uv[:, 2] - triangles_uv[:, 0]
    uv_area = float(np.abs(du[:, 0] * dv[:, 1] - du[:, 1] * dv[:, 0]).sum() * .5)
    save(uvArea=uv_area)
    if not .15 <= uv_area <= 1.01:
        raise ValueError(f'UV atlas area {uv_area:.5f} is unusable; preserve failed UVs, do not bake')
    sys.path.insert(0, str(args.trellis_root))
    from backends.texture_baker import bake_texture
    import trimesh
    from PIL import Image
    color, mr, mask = bake_texture(vertices, faces, uvs, source['voxel_coords'], source['voxel_attrs'],
                                  source['origin'], source['voxel_size'].item(), texture_size=int(source['texture_size']))
    native = args.out / 'source.native-z-up.glb'
    source_mesh = trimesh.Trimesh(vertices=source['vertices'], faces=source['faces'][original_face], process=False)
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces,
                           vertex_normals=source_mesh.vertex_normals[mapping], process=False)
    material = trimesh.visual.material.PBRMaterial(baseColorTexture=Image.fromarray(color),
        metallicRoughnessTexture=Image.fromarray(mr), metallicFactor=0., roughnessFactor=.8)
    mesh.visual = trimesh.visual.TextureVisuals(uv=uvs, material=material)
    mesh.export(str(native))
    spec = importlib.util.spec_from_file_location('orientation', Path(__file__).with_name('orient-local-glb.py'))
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    model = args.out / 'source.glb'
    orientation = module.orient(native, model, native_uv=True)
    save(status='EXPORTED_REVIEW_REQUIRED', model=str(model), modelSha256=sha(model), orientation=orientation,
         uvSha256=sha(uv_path), paddedTextureFraction=float(mask.mean()),
         positionsUnchanged=not bool(args.surface_checkpoint), uniqueSurfaceCoverageUnchanged=not bool(args.surface_checkpoint),
         uvPositionsUnchanged=True, uvUniqueSurfaceCoverageUnchanged=True,
         bakerSha256=sha(args.trellis_root / 'backends/texture_baker.py'),
         exporterSha256=sha(__file__), unwrapSha256=sha(Path(__file__).with_name('unwrap-decoded.py')))
    export_seconds = round(time.monotonic() - started, 3)
    review_out = args.out / 'review'
    with (args.out / 'review.log').open('w') as log:
        subprocess.run([str(args.blender), '-b', '--threads', '4', '--python',
                        str(Path(__file__).with_name('review-generated.py')), '--',
                        '--model', str(model), '--out', str(review_out)],
                       stdout=log, stderr=subprocess.STDOUT, check=True, timeout=300)
    save(exportSeconds=export_seconds, reviewDirectory=str(review_out),
         reviewStatus='CAPTURED_NOT_INSPECTED')
except BaseException as error:
    save(status='FAILED', error=str(error), errorType=type(error).__name__)
    raise
print(json.dumps(receipt))
