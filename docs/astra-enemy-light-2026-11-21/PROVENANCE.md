# Enemy lighting provenance

All source pixels come from the existing project. The bevel baker reads only alpha from the listed native atlases and drawing keys. It stores smoothed distance normals in RG, distance in B and crease occlusion in A. The 512-pixel native pages preserve the original aspect. The four drawing sets use five 320-pixel tiles in a 960 × 640 atlas. Original colour, coverage, expression and animation stay in the existing materials.

On 21 November 2026 in Vietnam the maps were generated with `python tools/astra-enemy-light/bake.py`, Python 3.12, Pillow 13.0.0, NumPy 2.5.5, SciPy 1.18.1. The reproducible parameters are in that script. [Each output, source path, dimensions and SHA-256](maps.json).

The alignment overlays use `node tools/astra-enemy-light/learn.mjs` then `python tools/astra-enemy-light/overlay.py`. Each combines the observed idle colour map and its enemy's nominal depth page in normalized UV at 50%. The dated capture manifest lists the commands, source receipt and digest of every evidence image.
