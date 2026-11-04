"""Compare original runner screenshots with reviewed PNGs; never rewrite either."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools/art"))
from pipeline import decode_png

parser = argparse.ArgumentParser()
parser.add_argument("actual", type=Path)
parser.add_argument("baseline", type=Path)
args = parser.parse_args()
a_bytes, b_bytes = args.actual.read_bytes(), args.baseline.read_bytes()
a, b = decode_png(a_bytes), decode_png(b_bytes)
assert (a.width, a.height) == (b.width, b.height)
columns = {}
count = 0
for i in range(a.width * a.height):
    if a.pixels[i * 4:i * 4 + 4] != b.pixels[i * 4:i * 4 + 4]:
        x, y = i % a.width, i // a.width
        columns.setdefault(x, []).append(y)
        count += 1
groups = []
for x in sorted(columns):
    if not groups or x > groups[-1][-1] + 1:
        groups.append([])
    groups[-1].append(x)
print(json.dumps({
    "actual": str(args.actual), "baseline": str(args.baseline),
    "actualSha256": hashlib.sha256(a_bytes).hexdigest(),
    "baselineSha256": hashlib.sha256(b_bytes).hexdigest(),
    "width": a.width, "height": a.height, "differentPixels": count,
    "changedColumnGroups": [[min(g), min(y for x in g for y in columns[x]),
                             max(g) + 1, max(y for x in g for y in columns[x]) + 1]
                            for g in groups],
}, indent=2))
