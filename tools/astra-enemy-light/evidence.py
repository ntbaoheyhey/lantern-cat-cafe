"""Index the compact review exhibit and its exact source recipes."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/astra-enemy-light-2026-11-21"
REPORT = ROOT / "reports/astra-enemy-light"
rows = []
maps = json.loads((OUT / "maps.json").read_text())
align = json.loads((REPORT / "alignment.json").read_text())
for image in sorted(OUT.rglob("*.webp")):
    section = image.parent.name
    command, inputs = "", []
    if section == "alignment":
        command = "node tools/astra-enemy-light/learn.mjs && python tools/astra-enemy-light/overlay.py"
        sources = list(align.values())
        if image.stem.startswith("review-"):
            n = (int(image.stem.split("-")[1]) - 1) * 4
            sources = sources[n:n+4]
        else:
            sources = [align[image.stem]]
        inputs = [v[k] for v in sources for k in ["texture","source"]]
    elif section.startswith("blind-"):
        phase = section.split("-")[-1]
        command = f"node tools/astra-enemy-light/ab.mjs {phase}"
        inputs = [f"reports/astra-enemy-light/phase-{phase}/dpr-2", f"reports/astra-enemy-light/blind-{phase}/key.json"]
    elif section in ("gallery","battle"):
        phase = "C" if (REPORT / "measure-C.json").exists() else "B" if (REPORT / "measure-B.json").exists() else "A"
        gallery = section == "gallery"
        command = "node tools/astra-enemy-light/capture.mjs --dpr=2 " + ("--mode=after --gallery" if gallery else f"--out=reports/astra-enemy-light/phase-{phase}")
        unit = next(k for k in align if image.name.startswith(k+"-"))
        inputs = [align[unit]["texture"], "apps/web/public/units/"+unit+"/relight-normal.webp",
                  "apps/web/src/game/cardrpg/spine/scene.ts", "tools/astra-enemy-light/fixture.mjs"]
    elif section == "motion":
        command = "node tools/astra-enemy-light/motion.mjs"
        inputs = ["tools/astra-enemy-light/fixture.mjs", "apps/web/src/game/cardrpg/spine/scene.ts"]
    else:
        raise ValueError(section)
    data = image.read_bytes()
    assert len(data) <= 600000, image
    rows.append(dict(file=str(image.relative_to(OUT)), sha256=hashlib.sha256(data).hexdigest(),
                     bytes=len(data), command=command, sources=inputs, date="2026-11-21"))
(OUT / "evidence.json").write_text(json.dumps(rows, indent=2)+"\n")
total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
assert total <= 25000000, total
print(len(rows), "review images;", total, "total evidence bytes")
