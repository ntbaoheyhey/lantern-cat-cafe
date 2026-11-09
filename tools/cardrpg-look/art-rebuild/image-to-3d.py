"""Authorized direct image-to-3D trial, using the official TRELLIS.2 demo.

Explicit --submit required; no API keys, implicit tokens, model helpers or agents.
Run with an external gradio_client environment, never repo runtime dependencies.
Retain every attempt; do not use this script to replace a failed receipt.
"""
import argparse
import hashlib
import json
import os
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path

os.environ['HF_HUB_DISABLE_IMPLICIT_TOKEN'] = '1'
from gradio_client import Client, handle_file

p = argparse.ArgumentParser()
p.add_argument('--submit', action='store_true')
p.add_argument('--id', choices=['mochi', 'soot', 'button-guard', 'yarn-giant'], default='mochi')
p.add_argument('--out', required=True)
a = p.parse_args()
if not a.submit:
    p.error('Generation requires --submit; user authorized external image-to-3D in the active session.')
root = Path(__file__).resolve().parents[3]
source = root / f'assets/source/look-v3/concepts/{a.id}.png'
out = Path(a.out).expanduser()
out.mkdir(parents=True, exist_ok=False)
params = dict(seed=20261109, resolution='1024', ss_guidance_strength=7.5,
              ss_guidance_rescale=.7, ss_sampling_steps=12, ss_rescale_t=5.,
              shape_slat_guidance_strength=7.5, shape_slat_guidance_rescale=.5,
              shape_slat_sampling_steps=12, shape_slat_rescale_t=3.,
              tex_slat_guidance_strength=1., tex_slat_guidance_rescale=0.,
              tex_slat_sampling_steps=12, tex_slat_rescale_t=3.)
receipt = dict(status='PREPARING', source=str(source.relative_to(root)),
               sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
               provider='https://huggingface.co/spaces/microsoft/TRELLIS.2',
               endpoint='https://microsoft-trellis-2.hf.space',
               model='microsoft/TRELLIS.2-4B', params=params,
               extraction=dict(decimation_target=100000, texture_size=2048),
               authorization='User: Cho phép image-to-3D bên ngoài',
               startedAt=datetime.now(timezone.utc).isoformat(), events=[])

def record(status, **extra):
    receipt['status'] = status
    receipt.update(extra)
    receipt['events'].append(dict(status=status, at=datetime.now(timezone.utc).isoformat()))
    (out / 'receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(status=status, **extra), ensure_ascii=False), flush=True)

def result(job, stage, limit=600):
    start = time.monotonic()
    while not job.done():
        if time.monotonic() - start > limit:
            job.cancel()
            raise TimeoutError(stage + ' exceeded the bounded ten-minute request window')
        state = job.status()
        print(json.dumps(dict(stage=stage, status=str(state.code), rank=state.rank,
                              elapsed=round(time.monotonic() - start))), flush=True)
        time.sleep(15)
    return job.result()

client = None
try:
    record('CONNECTING')
    client = Client(receipt['endpoint'], token=False, verbose=False,
                    analytics_enabled=False, max_workers=1,
                    download_files=str(out / 'downloads'))
    client.predict(api_name='/start_session')
    record('UPLOADING_ORIGINAL_IMAGE')
    processed = client.predict(handle_file(str(source)), api_name='/preprocess_image')
    if isinstance(processed, dict):
        processed = processed['path']
    record('IMAGE_TO_3D_SUBMITTED')
    preview = result(client.submit(image=handle_file(processed), **params,
                                   api_name='/image_to_3d'), 'generation')
    (out / 'provider-preview.html').write_text(preview)
    record('MESH_GENERATED_EXTRACTING')
    files = result(client.submit(**receipt['extraction'], api_name='/extract_glb'), 'extraction')
    model = out / f'{a.id}.glb'
    shutil.copyfile(files[0], model)
    record('GENERATED_NOT_REVIEWED', model=str(model), bytes=model.stat().st_size,
           sha256=hashlib.sha256(model.read_bytes()).hexdigest())
except Exception as error:
    record('FAILED', error=str(error), errorType=type(error).__name__)
    raise
finally:
    if client is not None:
        client.close()
