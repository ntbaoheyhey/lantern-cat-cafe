# Optional designer VFX delivery

Lane C supplies all skill effects. A designer may replace one effect by delivering an `effect.json` descriptor plus its PNG frames or Spine export. Use an exact skill ID from `slots.json`, including colons in enemy IDs. Portable install folders replace colons with hyphens. Character deliveries continue to use DESIGNER-SPEC.md.

The descriptor's `cue` is `cast` or `hit`. Cast attaches to the acting unit; hit attaches to the actual friendly/hostile recipients selected by the current combat outcome. Supported `socket` values: `feet`, `vfxOrigin`, `mainHand`, `offHand`, `head`, `chest`. Secondary heal/shield paint in mixed actions remains separate. Spool Ram preparation retains its distinct painted cue; its standard override replaces the subsequent strike.

`width` and `height` describe unscaled world units, centered on the attachment socket. `scale` must be finite and positive; each scaled dimension is at most2048units. A cat is512units high. Camera zoom and the small stage depth scale apply; target species/height and animated head positions do not change the export's dimensions. Preserve clear faces, HP bars and readable painted silhouettes. Timing is measured at×1 and follows the presentation clock at×2/×3.

## PNG frames

Export PNGs with straight alpha, one shared canvas size and an aspect ratio matching width/height. Use1–180frames at1–60fps; total duration must be at most10seconds. All files must end in lowercase `.png`. This complete descriptor represents a one-second still effect; for animation, list every frame in playback order and set the intended fps.

```json
{
  "id": "mochi-4",
  "format": "sequence",
  "socket": "vfxOrigin",
  "cue": "hit",
  "width": 512,
  "height": 512,
  "scale": 1,
  "fps": 1,
  "frames": ["frames/000.png"]
}
```

## Spine effect

Use the project's runtime major.minor (currently4.2). Provide a `.json` or `.skel` skeleton, an `.atlas` file and lowercase `.png` atlas pages, each at most2048×2048. The selected animation must have a finite duration greater than zero and at most10seconds. Its setup attachments must fit the centered declared bounds. Keep animated geometry inside those bounds to avoid clipping. Prefer correctly premultiplied atlas pages with `pma:true`; straight atlas alpha is accepted with WARN and converted by the loader. More than40bones is WARN.

```json
{
  "id": "mochi-4",
  "format": "spine",
  "socket": "vfxOrigin",
  "cue": "hit",
  "width": 512,
  "height": 512,
  "scale": 1,
  "skeleton": "effect.skeleton.json",
  "atlas": "effect.atlas",
  "animation": "effect"
}
```

The descriptor must be named `effect.json`; use a distinct skeleton filename, as in the example. The VFX export does not need the character bone or animation list.

## Intake and review

Paths are relative to the export folder (atlas page names are relative to their atlas). Use ordinary directory segments, for example `frames/000.png`; avoid `.`/`..`, empty segments, absolute paths or escaping symlinks. Renaming PNG bytes to another extension does not make a supported runtime file.

Run `node tools/cardrpg-look/spine/vfx-intake.mjs mochi-4 /absolute/path/to/export` to validate without installation. Add `--install` after validation to write an immutable revision under `assets/cardrpg-look/vfx-designer/mochi-4/accepted/` and update `registry.json`. Rebuild/reload to discover it; no TypeScript edits. FIX leaves the accepted registry unchanged. Source files are never edited.

Structural PASS requires visual review in the skill gallery and battle at1280×720/1440×900,×1/×2/×3 and reduced motion. Inspect event/socket attachment, alpha edges, size, face/HP clearance and expiry. Record PASS/FIX and original-art provenance before considering the delivered look accepted. No optional VFX export has been accepted at this checkpoint.
