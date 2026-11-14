# Original UI art kit

U2 is complete. The generator plan contains 74 distinct source images: reusable frame/ribbon/tab art, nine button states, six rarity frames, five item tags, a pedestal, constellation node, radial light, three result titles, six guide poses, five room backdrops and 34 painted icons. Three ribbon sizes produce 76 runtime exports. The minimum file count will not substitute for completing these categories.

All generation uses the built-in image tool. The first image in each family uses text only. Guide poses and button interaction states use their own generated base as a reference to retain identity and corner geometry. No reference-game frame has entered a generator. Exact prompts and permitted own-image paths are in `assets/v3-shell/b2/prompts.json`; each exported file has its own row in `assets/provenance.json` and `UI-ART.json`.

The runtime budget is eight million bytes across all newly shipped WebPs. Archival source PNGs and review sheets are not served by the game. Exports use twice their nominal display dimensions; the manifest also discloses generator source dimensions and any backdrop upscaling rather than claiming native resolution the tool did not supply. Transparent artwork retains generated alpha, with no chroma-key background removal.

The reusable components are in `apps/web/src/game/cardrpg/shell/PaintedKit.tsx`. They expose decorative icons, accessible item tiles, primary/secondary buttons, small icon actions, a nine-slice panel, ribbon headings and guide poses. The kit preview at `docs/ui-kit/index.html` shows source-sized art plus stretched panel/button examples. This card does not claim that the 53 screens have been rebuilt; that acceptance belongs to U3.

Review findings so far: the gold panel stretches without clipping its corners; the ribbon supports a live heading; orange, gold and grey button states read as different actions; secondary labels use dark plum for contrast; guide poses retain face, fur and apron identity. The workshop keeps its central wall quiet for controls. The first browser pass loaded all eleven initial exports; the final browser pass loads all seventy-six exports, loads the bundled display font, and has zero browser errors or horizontal overflow. New React components pass the web typecheck.

Reproduction: `tools/.venv/bin/python scripts/ui/export-kit-b2.py`, serve the repository locally at port 5995, then `node scripts/ui/review-kit-b2.mjs`. The exporter caches only files whose source, prompt, exporter version and output hash still match.

Small-size review: currency/material icons remain distinct at 32 and 64 px; compressed result lettering remains clear at 200 px. Corner badges were too small at 24 px, so the shared tile now uses 32 px badges. All five background sources require the same 1.5311× upscale to the requested 2560×1440 canvas.

Final export: 76 WebP files, 3,997,810 bytes, 34 painted icons, 74 original source images, no missing categories. Chromium loaded all 76 assets with the bundled display font, zero browser errors and no horizontal overflow. The full contact sheet was visually checked for consistent silhouettes, alpha, frames, guide identity, lettering and backdrop composition. Source image inputs are limited to the project’s own generated button/guide images.
