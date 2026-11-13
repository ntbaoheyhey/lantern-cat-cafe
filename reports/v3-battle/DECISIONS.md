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

### A4 complete — 13 November 2026
- All 13 full plates ship; no cut line used. Twenty-four active and twelve basic tracks consume approved paintings with deterministic geometric paths and particles on the existing VFX canvas.
- Visual review caught Panko/Mochi similarity despite different signature strings. Panko now uses an oven-door rush with horizontal streaks. Fixed-clock export passed again.
- Static lab now plays/scrubs all 36 field sequences from generated runtime data, with before/after and quarter speed under file://. Its OFL font is self-contained.
- Added boss portrait and hit/status/death/voice cue crossings through the shared audio bridge. No second audio engine.
- Local evidence: 49 browser sequences, 74 relevant unit tests, 10 cardrpg E2E, typecheck. Cinematic media totals 5,999,616 bytes.

## A5 continuation: approved pixels and honest alpha gate (2026-11-13)
Reuse the approved split atlas artwork for 22 non-designer units. A connected, weighted mesh keeps the rest pose; canonical bones, independent seeded blinks and the shared motion set supply animation. Separate facial/weapon slots that are still embedded in the art are explicitly listed in parts.json. This authorized section 0.6 method change avoids a redundant generation/re-split of already approved original art. Mochi, Soot and Clover remain authored deliveries; only non-destructive socket/event aliases are added at intake.

The first alpha-hole method counted every enclosed transparent pixel, including anti-alias pinholes. Corrected erosion of each transparent region by two pixels removes pinholes but retains deliberate handle and tail openings (Marigold reference: 301 pixels). This is the second measurement method; preserve original negative spaces and report the literal zero-hole gate as PARTIAL if any remain, with visual extreme-pose evidence. Never suppress failing units. Pilots are auto-approved under the user's final decisions; clips are copied to Desktop/TaskbarHero-REVIEW and batching continues.

A5 visual repair: projected arm weights bent upward-pointing staff props. The four staff users now use radial shoulder-to-hand weights so remote staff pixels follow the hand rigidly; original setup coordinates and pixels remain identical. Re-render the affected four units and the Marigold pilot. This is a visual deformation fix, with no battle rule changes.

## A6 first available sync (2026-11-13)
Merge Session B's published B1–B5 head 84b4e49f9 now, ahead of the planned calendar checkpoints, to expose integration issues while B finishes B6. Section 0.6 authorizes this earlier sync; it does not imply a future scheduled merge was run. Preserve Session B shell/audio/fonts/icons/chain code and Session A battle code. Resolve the two conflicts by unioning root scripts/dependencies and retaining both original-asset provenance lists. No battle-owned source conflicts. Fetch B again before final capture and publication.

## A6 toolbar integration repair
The global audio mute/Mix controls covered the battle guide and More buttons. Reserve their 112px width in the battle-owned topbar/menu (only when the audio controls exist). Preserve pointer assertions and all audio-owned files. This repairs the three-viewport C2 control timeout.

## A5 bounded end-of-queue revisit
While B prepares its final published integration commit, perform the single A5 revisit rather than idle. Diagnose gaps at overlapping pieces receiving different transforms. Pilot a continuous alpha-weighted skin field with shared world-space mesh lines on Sorrel; it changes geometry only, preserving every approved atlas pixel and authored negative space. Keep the strict raw-alpha gate and compare visual poses/performance before adopting. This revisit is the final attempt, not a new unbounded art pass.

A5 revisit outcome: reject shared-skin candidate after Sorrel visual review. Peak holes fell 1006→684 but staff bending/foot slivers worsened. Restore exact committed compiler/runtime. Close A5 PARTIAL after one bounded revisit, retain failing measurements and rejected patch. No broadened batch or softened gate.
