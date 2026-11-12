# Decisions

- 2026-11-13: User final decisions govern: free audio only (Session B); no Spine runtime, cut-out contract for all units; designer hand-authors mochi/soot/clover only.
- A3 and A5 pilot reviews are auto-approved by the user; self-score, gates and review copies remain required.
- Local CI only. No deploys, main merges, migrations or contract deployments. Work alone.
- No stopped-lane worktree is flagged prunable, so none meets the user cleanup predicate.

- R2: independent cut-out adapter supports the existing original region and weighted-mesh art with one draw per atlas; this preserves Mochi/Clover painted layers without re-splitting them or shipping the licensed runtime. Shared template authored in A5.

- A1 tuning: start positions produced 49–65% bounding-box overlap for large hats/wings and crowded the wave-3 rear bodies. Increase same-column foot step to .36 and move rear x to .16/.19, retaining .42 core height and a <=15% centre gap. Validate actual alpha occlusion as well as clipping; silhouette rectangles overestimate empty areas.

- A1 core review: teapot/helmet lids belong to the enemy head; only finials and crowns are excluded. Corrected initially over-tight enemy ROIs that enlarged their bodies. The manual semantic regions are committed and the alpha/scale check catches subsequent drift.

## A1 completion
- Dense formation tuned to front x=.36/.39, rear x=.16/.19; vertical step .37. Wide enemy silhouettes need more stagger than the starting sketch. Alpha-mask maximum occlusion 20.8%, no clipping in wave 1/3/boss. Bounding boxes overestimate wing occlusion.
- Updated obsolete 15% empty-box overlap assertion to the V3 dense contract. Actual alpha occlusion is captured separately; 387 battle tests and 10 browser tests pass.
- Full-body exclusion could suppress numbers; lower-body fallback lanes retain contact feedback below faces.
- Postprocessing 6.39.6 / quarks 0.16.0 installed for next cards.

## A2 completion
- Scoped battle-v3 HUD; only integration imports in Battle.tsx and BattleHudV3.tsx. These are battle-only files and required to activate A-owned UI. B non-battle files untouched.
- Baloo 2 5.3.0 OFL dependency temporarily supplies the same display token while B global typography is pending.
- Manual ultimate queues wait for the actual actor turn. Default Auto preserves a seeded full battle byte-for-byte.
- Phone uses a letterboxed 16:9 field to preserve formation; desktop remains primary. Auto-next moved into More, retaining the original behavior.

### A3 implementation — 13 November 2026
- Battle-only edits in `depth/model.ts` apply sequence timing after A6 pacing; this is presentation ownership, with no changes to rule values or action selection. B's non-battle screens remain untouched.
- Compositor uses original Canvas2D motifs over a Three shader plus seeded three.quarks particles. Both libraries resolve through the same app module and quarks shader registration is explicit; Vite's optimizer otherwise loses the registration side effect.
- Pre-rendered plates contain no downloaded reference art. Each pilot WebM is below 400 KB at 1280×720/30 fps; MP4 fallback and posters are generated from the same fixed frames.
- A3 pilots: auto-approved after deterministic export, size checks, local timing/reduced-motion tests and browser inspection. Review media is copied to the Desktop folder; any later INBOX corrections still apply.
- The file:// lab previews a short CC0 Kenney release sample extracted from B's existing pack. Its licence/source is documented beside the sample; B's audio engine remains untouched.
