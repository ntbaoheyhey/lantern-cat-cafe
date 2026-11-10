"""Cache only TRELLIS and DINOv3 weights; no RMBG and no model inference."""
import json
import os
import signal
from datetime import datetime, timezone
from pathlib import Path
from huggingface_hub import hf_hub_download

ROOT = Path(__file__).resolve().parents[3]
OUT = Path.home() / 'art/look-v3/local-setup'
OUT.mkdir(parents=True, exist_ok=True)
os.environ['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'
signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
receipt = {'status': 'DOWNLOADING', 'pid': os.getpid(), 'startedAt': datetime.now(timezone.utc).isoformat(), 'files': [], 'excluded': ['briaai/RMBG-2.0']}


def save():
    temp = OUT / 'weights.json.tmp'
    temp.write_text(json.dumps(receipt, indent=2) + '\n')
    temp.replace(OUT / 'weights.json')


def fetch(repo, file):
    if (ROOT / 'STOP-B').exists():
        raise KeyboardInterrupt('STOP-B requested')
    print(json.dumps({'repo': repo, 'file': file, 'status': 'FETCHING'}), flush=True)
    path = Path(hf_hub_download(repo, file))
    receipt['files'].append({'repo': repo, 'file': file, 'path': str(path), 'bytes': path.stat().st_size})
    save()
    print(json.dumps({'file': file, 'status': 'CACHED', 'bytes': path.stat().st_size}), flush=True)
    return path


try:
    save()
    repo = 'microsoft/TRELLIS.2-4B'
    config = json.loads(fetch(repo, 'pipeline.json').read_text())
    for value in config['args']['models'].values():
        if value.startswith('ckpts/'):
            model_repo, name = repo, value
        else:
            organization, model, name = value.split('/', 2)
            model_repo = organization + '/' + model
        for extension in ('.json', '.safetensors'):
            fetch(model_repo, name + extension)
    dino = config['args']['image_cond_model']['args']['model_name']
    for file in ('config.json', 'model.safetensors'):
        fetch(dino, file)
    receipt['status'] = 'CACHED'
except BaseException as error:
    # Avoid printing credential-bearing HTTP request objects or headers.
    receipt['status'] = 'INTERRUPTED' if isinstance(error, KeyboardInterrupt) else 'FAILED'
    receipt['errorType'] = type(error).__name__
    receipt['httpStatus'] = getattr(getattr(error, 'response', None), 'status_code', None)
    raise SystemExit(1)
finally:
    receipt['finishedAt'] = datetime.now(timezone.utc).isoformat()
    save()
