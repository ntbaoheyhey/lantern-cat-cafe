# Illustrated puppet pipeline

Build/resume one original concept with:

```sh
nice -n 10 /Users/bao/tools/cardrpg-look/venv/bin/python tools/cardrpg-look/art-rebuild/puppet/build.py mochi
```

Author normalized semantic polygons and pivots in `configs/<id>.json`. Frontmost
parts are listed first; the remaining pixels form the body. The cutter keeps all
visible source pixels, extends the hidden overlap using local Telea inpainting,
and writes parts and receipts to `/Users/bao/art/look-v3/puppets/<id>/`. It never
modifies the original concept or any native-era mesh. `--force` rebuilds only the
selected unit. Input/config/tool fingerprints allow an unchanged unit to resume.

Delivery is one WebP atlas (1024 maximum; bosses 1536) and `<id>.rig.json` in
`assets/cardrpg-look/v3-puppets/`. Runtime discovers these files, validates them,
uses semantic sockets and joint pivots, and plays the real battle action clock.
The existing `lookV2 && lookArt=v3` opt-in chooses puppets by default; classic
mode stays off. `artPipeline=generated|painted|sculpt` preserves old diagnostics.

Per-unit acceptance still requires a real battle capture, motion contact sheet,
face/HP check, and scored visual inspection. Successful packing is not visual
acceptance. Large diagnostic masters remain outside git.
