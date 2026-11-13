"""Save one original built-in ImageGen output and make a <=1280px review image."""
import argparse
import json
import shutil
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('id')
parser.add_argument('source')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
plan = json.loads((root/'assets/v3-shell/b2/prompts.json').read_text())
assert args.id in [a['id'] for a in plan['assets']], 'Unknown asset'
source = Path(args.source).resolve()
assert source.is_relative_to(Path('/Users/bao/.codex/generated_images')), 'Only our built-in output is accepted'
destination = root/'assets/v3-shell/b2/sources'/f'{args.id}.png'
destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(source, destination)
preview = root/'reports/v3-shell/b2/shots/kit-review'/f'{args.id}.png'
preview.parent.mkdir(parents=True, exist_ok=True)
image = Image.open(destination)
image.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
image.save(preview, optimize=True)
print(json.dumps({'id': args.id, 'source': str(destination), 'preview': str(preview)}))
