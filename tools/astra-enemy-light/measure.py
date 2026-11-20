"""Assess the lossless paired battlefield and body passes before evidence encoding."""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("root", type=Path)
parser.add_argument("--report", type=Path, required=True)
parser.add_argument("--main", type=Path)
args = parser.parse_args()


def rgb(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.int16)


def linear(srgb):
    f = srgb / 255.0
    return np.where(f <= 0.04045, f / 12.92, ((f + 0.055) / 1.055) ** 2.4)


rows = {}
for d in sorted(args.root.iterdir()):
    meta = json.loads((d / "after.json").read_text())
    before, after = (rgb(d / f"{mode}-frame.png") for mode in ("before", "after"))
    b0, w0, b1, w1 = (rgb(d / (mode+"-"+bg+".png")) for mode in ("before", "after") for bg in ("black", "white"))
    # These are actual opaque-target composites, so exact black+white backgrounds
    # identify exterior pixels even for the very darkest/lightest painted features.
    exterior = (b0.max(axis=2) == 0) & (w0.min(axis=2) == 255)
    opaque = ((w0 - b0).max(axis=2) <= 5)
    assert np.count_nonzero(opaque) > 500 and exterior.mean() > .3, "Invalid alpha pass"
    delta = after - before
    base = linear(b0[opaque]) @ [.2126, .7152, .0722]
    lit = linear(b1[opaque]) @ [.2126, .7152, .0722]
    cats = np.zeros(before.shape[:2], bool)
    k = meta["width"] / meta["cssWidth"]
    for actor in meta["actors"].values():
        if actor["tier"] != "cat":
            continue
        box = actor["bounds"]
        x, y = max(0, int(box["x"]*k)), max(0, int(box["y"]*k))
        right, bottom = int(np.ceil((box["x"]+box["width"])*k)), int(np.ceil((box["y"]+box["height"])*k))
        cats[y:bottom,x:right] = True
    assert cats.any()
    changed = (delta != 0).any(axis=2)
    row = dict(changedCatBoxPixels=int(changed[cats].sum()), catBoxPixels=int(cats.sum()),
               outsideAddedOver2=int((delta.max(axis=2)[rgb(d / 'before-enemies.png')[:,:,0] == 0] > 2).sum()),
               outsideBodyPassOver2=int(((b1-b0).max(axis=2)[exterior] > 2).sum()),
               bodyPixels=int(opaque.sum()), bodyChanged=int(changed[opaque].sum()),
               luminanceChangePct=round(float((lit.mean()/base.mean()-1)*100),3))
    if args.main:
        pristine = rgb(args.main / d.name / "before-frame.png")
        row["offVsPristine"] = int((pristine != before).any(axis=2).sum())
    rows[d.name] = row
args.report.write_text(json.dumps(rows, indent=2) + "\n")
for name, row in rows.items():
    print(name, row["changedCatBoxPixels"], row["outsideAddedOver2"], row["outsideBodyPassOver2"],
          row["luminanceChangePct"], row.get("offVsPristine", ""))
