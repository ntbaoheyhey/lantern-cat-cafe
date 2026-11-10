# Portrait/icon source review

25 portraits,60 skill/passive icons and4 rarity frame pairs were derived locally from the existing original generated masters. No new image generation, third-party reference or runtime change. The manifest has source/output hashes and explicit opt-in adoption; it is not loaded at startup.

Viewed both contact sheets. The cat eyes, warm edge light, cloth and hostile red/brass palette are consistent. Ultimate silhouettes are distinct at icon size: Mochi arch, Soot crescent, Clover wreath, Mallow flame, Cinnamon spiral, Velvet ribbon, Inkcap veil. Support/passive icon pairs intentionally reuse the source charge component with a passive badge.

Known limits: these are illustrated master crops, not new renders of reconstructed meshes; several crops retain most of the body. Runtime identity for the unfinished roster must be compared before Q8 closes. Soot's reconstructed warm forehead differs from this source portrait. No shell code has been edited. Delivery manifest: assets/cardrpg-look/v3-portraits/manifest.json.

Small-slot delivery 2026-11-10: A6 requested face crops for56–72px formation/tower slots. Added25 authored face ROIs at56/72/144px under each portrait's `uiPortrait`, preserving existing card crops. Visually reviewed actual-size before/after sheet; tightened Soot/Velvet/Sorrel/Inkcap and narrow enemy heads in one refinement. Eyes and hostile silhouettes are larger and readable; long props may be cropped intentionally.75output hashes verified. Source identity remains pending the runtime roster; no shell adoption or startup default changed.
