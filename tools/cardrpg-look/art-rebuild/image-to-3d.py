"""Explicit local TRELLIS generation. The historical Space backend defaults OFF.

Run with the existing art Python environment (Pillow); weights/deps stay outside git.
Use the shared timing lease and only one inference process. No automatic rig acceptance.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import signal
import struct
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
LOCAL = Path.home() / 'art/look-v3/local-generation'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, value):
    path = Path(path)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')
    temp.replace(path)


def validate_alpha(source):
    from PIL import Image
    with Image.open(source) as im:
        if im.format != 'PNG' or im.mode != 'RGBA':
            raise ValueError('Use an RGBA PNG with its background already removed')
        lo, hi = im.getchannel('A').getextrema()
        if lo >= 255 or hi <= 204:
            raise ValueError('Input must have transparency and an opaque foreground')
        return {'size': list(im.size), 'alphaRange': [lo, hi]}


def disable_rmbg(trellis):
    # Upstream constructs RMBG even when the image has alpha. Suppress that load;
    # preprocessing still uses the original alpha/crop path. Never fetch its weights.
    path = trellis / 'TRELLIS.2/trellis2/pipelines/trellis2_image_to_3d.py'
    old = "pipeline.rembg_model = getattr(rembg, args['rembg_model']['name'])(**args['rembg_model']['args'])"
    new = 'pipeline.rembg_model = None  # Lane B: prevalidated alpha only; no RMBG weights'
    body = path.read_text()
    if new not in body:
        if body.count(old) != 1:
            raise ValueError('Upstream RMBG loader changed; inspect before patching')
        path.write_text(body.replace(old, new))
    return {'path': str(path), 'sha256': sha(path), 'replacement': new}


def validate_glb(path):
    data = path.read_bytes()
    if len(data) < 20 or struct.unpack_from('<III', data) != (0x46546C67, 2, len(data)):
        raise ValueError('Missing or truncated GLB2 export')
    size, kind = struct.unpack_from('<II', data, 12)
    if kind != 0x4E4F534A or size > len(data) - 20:
        raise ValueError('Invalid GLB JSON chunk')
    doc = json.loads(data[20:20 + size])
    if not doc.get('meshes') or not doc.get('images'):
        raise ValueError('A textured mesh is required')
    for row in doc.get('buffers', []) + doc.get('images', []):
        if row.get('uri') and not row['uri'].startswith('data:'):
            raise ValueError('Export must embed all textures and buffers')
    return {'meshes': len(doc['meshes']), 'images': len(doc['images']), 'bytes': len(data)}


def trace_decoders(trellis):
    # Timings only: preserve model operations and sampler settings.
    path = trellis / 'TRELLIS.2/trellis2/pipelines/trellis2_image_to_3d.py'
    body = path.read_text()
    old = ('        meshes, subs = self.decode_shape_slat(shape_slat, resolution)\n'
           '        tex_voxels = self.decode_tex_slat(tex_slat, subs)')
    new = ('        print("Lane B: decode shape started", flush=True)\n' + old.split('\n')[0] + '\n'
           '        print("Lane B: decode shape complete; decode texture started", flush=True)\n' + old.split('\n')[1] + '\n'
           '        print("Lane B: decode texture complete", flush=True)')
    if new not in body:
        if body.count(old) != 1:
            raise ValueError('Upstream decoder changed; inspect before tracing')
        path.write_text(body.replace(old, new))
    return {'path': str(path), 'sha256': sha(path), 'purpose': 'stage logging only'}


def local_generate(args):
    if not re.fullmatch(r'[a-z][a-z0-9-]*', args.id):
        raise ValueError('Invalid unit id')
    if args.id in ('mochi', 'soot') and not args.smoke:
        raise ValueError('Preserve completed Mochi/Soot conversions; only isolated --smoke is allowed')
    if args.seed is None:
        raise ValueError('A fixed --seed is required')
    if (ROOT / 'STOP-B').exists():
        raise InterruptedError('STOP-B requested')
    source = ROOT / f'assets/source/look-v3/concepts/{args.id}.png'
    alpha = validate_alpha(source)
    trellis = Path(args.local_root).expanduser().resolve()
    python = trellis / '.venv/bin/python'
    if not python.is_file():
        raise ValueError('Local TRELLIS environment is not installed')
    # Loading this port outside a lease can collide with other lanes' perf jobs.
    lease = json.loads(Path('/tmp/cardrpg-big-locks/timing.lock/owner.json').read_text())
    if lease.get('lane') != 'B-LOOK' or lease.get('pid') != os.getppid():
        raise ValueError('Run through tools/cardrpg-look/skills-v5/full/run-lock.mjs')
    os.kill(lease['pid'], 0)
    out = Path(args.out).expanduser().resolve()
    LOCAL.mkdir(parents=True, exist_ok=True)
    lock = LOCAL / '.running'
    lock.mkdir()  # Exclusive across all units; never delete another process's lock.
    started = time.monotonic()
    receipt = None
    child = None
    stopped = False

    def stop_handler(_signal, _frame):
        nonlocal stopped
        stopped = True

    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, stop_handler)

    try:
        write_json(lock / 'owner.json', {'pid': os.getpid(), 'unit': args.id})
        ledger_dir = LOCAL / ('smoke' if args.smoke else 'roster') / args.id
        ledger_dir.mkdir(parents=True, exist_ok=True)
        previous = [json.loads(p.read_text()) for p in sorted(ledger_dir.glob('attempt-*.json'))]
        if len(previous) >= 3:
            raise ValueError('Two retries exhausted; record failed and continue the queue')
        if any(p['seed'] == args.seed for p in previous):
            raise ValueError('A retry needs a new recorded seed')
        if any(p.get('status') == 'GENERATED_NOT_REVIEWED' for p in previous):
            raise ValueError('Successful conversion already exists; reuse it')
        out.mkdir(parents=True, exist_ok=False)
        ledger_path = ledger_dir / f'attempt-{len(previous) + 1}.json'
        receipt = dict(status='PREPARING', provider='trellis-mac (local)', backend='local-mps',
                       id=args.id, seed=args.seed, attempt=len(previous) + 1, smoke=args.smoke,
                       pipelineType=args.pipeline_type, textureSize=args.texture_size,
                       source=str(source.relative_to(ROOT)), sourceSha256=sha(source), alpha=alpha,
                       startedAt=datetime.now(timezone.utc).isoformat(), runtimeAccepted=False,
                       trellisCommit=subprocess.check_output(['git', '-C', str(trellis), 'rev-parse', 'HEAD'], text=True).strip(),
                       upstreamCommit=subprocess.check_output(['git', '-C', str(trellis / 'TRELLIS.2'), 'rev-parse', 'HEAD'], text=True).strip(),
                       alphaOnlyPatch=disable_rmbg(trellis), decoderTracePatch=trace_decoders(trellis),
                       generateSha256=sha(trellis / 'generate.py'))

        def save(status, **extra):
            receipt.update(status=status, elapsedSeconds=round(time.monotonic() - started, 3), **extra)
            write_json(out / 'receipt.json', receipt)
            write_json(ledger_path, receipt)

        command = [str(python), '-u', str(trellis / 'generate.py'), str(source),
                   '--output', str(out / args.id), '--seed', str(args.seed),
                   '--pipeline-type', args.pipeline_type, '--texture-size', str(args.texture_size)]
        save('GENERATING', command=command)
        env = os.environ.copy()
        env['PYTHONUNBUFFERED'] = '1'
        env['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'
        with (out / 'generation.log').open('w') as log:
            child = subprocess.Popen(command, cwd=trellis, env=env, stdout=log,
                                     stderr=subprocess.STDOUT, start_new_session=True)
            while child.poll() is None:
                if stopped or (ROOT / 'STOP-B').exists() or time.monotonic() - started > args.timeout:
                    os.killpg(child.pid, signal.SIGTERM)
                    try:
                        child.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        os.killpg(child.pid, signal.SIGKILL)
                        child.wait()
                    raise InterruptedError('Stopped by pause/STOP-B or bounded inference timeout')
                time.sleep(2)
        if child.returncode:
            raise RuntimeError(f'Local generation exited {child.returncode}; see generation.log')
        model = out / f'{args.id}.glb'
        structure = validate_glb(model)
        # The upstream Metal exporter rotates (x,z,-y), whereas the KDTree
        # exporter writes native Z-up vertices directly. Preserve its raw bytes.
        if 'Baking PBR textures via KDTree' in (out / 'generation.log').read_text():
            native = out / f'{args.id}.native-z-up.glb'
            model.rename(native)
            orientation = subprocess.check_output([
                sys.executable, str(Path(__file__).with_name('orient-local-glb.py')),
                str(native), str(model)], text=True)
            receipt['orientation'] = json.loads(orientation)
            structure = validate_glb(model)
        model_hash = sha(model)
        save('GENERATED_NOT_REVIEWED', model=str(model), modelSha256=model_hash, structure=structure,
             cooldownRecommendedSeconds=120 if time.monotonic() - started > 900 else 0)
        if not args.smoke:
            inbox = Path.home() / 'art/look-v3/inbox'
            inbox.mkdir(parents=True, exist_ok=True)
            destination = inbox / f'{args.id}.glb'
            if destination.exists() and sha(destination) != model_hash:
                raise FileExistsError('Inbox model differs; preserve it and inspect before replacement')
            if not destination.exists():
                temp = inbox / f'.{args.id}-{os.getpid()}.glb.tmp'
                shutil.copyfile(model, temp)
                # Exclusive link publishes a complete file without overwriting another writer.
                os.link(temp, destination)
                temp.unlink()
            save('GENERATED_NOT_REVIEWED', inbox=str(destination))
        print(json.dumps(receipt, ensure_ascii=False))
    except BaseException as error:
        if receipt is not None:
            save('INTERRUPTED' if isinstance(error, (InterruptedError, KeyboardInterrupt)) else 'FAILED',
                 error=str(error), errorType=type(error).__name__)
        raise
    finally:
        if child is not None and child.poll() is None:
            os.killpg(child.pid, signal.SIGTERM)
            child.wait(timeout=10)
        (lock / 'owner.json').unlink(missing_ok=True)
        lock.rmdir()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', choices=['off', 'local-mps', 'hf-space'], default='off')
    parser.add_argument('--submit', action='store_true')
    parser.add_argument('--id', default='mochi')
    parser.add_argument('--out', required=True)
    parser.add_argument('--seed', type=int)
    parser.add_argument('--pipeline-type', choices=['512', '1024', '1024_cascade'], default='1024')
    parser.add_argument('--texture-size', type=int, choices=[512, 1024, 2048], default=1024)
    parser.add_argument('--local-root', default=str(Path.home() / 'art/trellis-mac'))
    parser.add_argument('--smoke', action='store_true', help='Isolated comparison; never publish into inbox')
    parser.add_argument('--timeout', type=int, default=1080)
    args = parser.parse_args()
    if not args.submit or args.backend == 'off':
        parser.error('Generation is OFF; choose --backend local-mps --submit explicitly')
    if not 1 <= args.timeout <= 1080:
        parser.error('Timeout must fit within the shared 19-minute timing lease')
    if args.backend == 'hf-space':
        parser.error('Historical Space implementation retained in image-to-3d-space.py; browser/Space generation disabled by current INBOX')
    local_generate(args)


if __name__ == '__main__':
    main()
