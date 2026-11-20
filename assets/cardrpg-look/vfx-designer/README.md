# Optional designer skill effects

Lane C provides all effects. An accepted export replaces its exact skill ID, without code edits; failed or missing exports keep the painted effect. Original art only. Character exports remain independent.

Create an `effect.json` beside the PNGs/atlas/skeleton in your delivery folder:

```json
{"id":"mochi-1","format":"sequence","frames":["000.png","001.png"],"fps":24,"width":256,"height":256,"scale":1,"socket":"vfxOrigin","cue":"hit"}
```

For Spine use `format:"spine"`, `skeleton:"spark.json"` (or a `.skel` filename), `atlas:"effect.atlas"`, and `animation:"effect"` instead of frames/fps. Export runtime 4.2, centered on root (0,0), inside the declared width/height. Prefer PMA, pages <=2048. For both formats give dimensions in Spine units (512 = a cat), matching frame aspect. Socket: feet/vfxOrigin/mainHand/offHand/head/chest; cue: cast/hit. Cast uses the caster socket; hit uses each target socket. At most180frames,1–60fps,10seconds. No absolute or parent paths. Avoid face-height opaque fills.

Run `node tools/cardrpg-look/spine/vfx-intake.mjs <skill-id> <delivery-folder> --install`. This reads the source and publishes an immutable accepted revision in this folder, then atomically updates registry.json. Rebuild/reload to pick it up. Eight independent players per skill are prepared before casting; overload drops extra instances. Runtime loading failures retain the built-in effect. PNG sequences require no Spine Editor/runtime for that effect.
