STATUS: DONE

# Demo video and screenshots: every character class

Date: 2026-10-26 (Asia/Saigon). User requested a demo video and screenshots, then explicitly requested every character type.

## Delivered

- [60.64-second showcase](demo-media/taskbar-hero-demo.mp4): all seven classes, equipment, boss arena, chapter map, first-clear chest, forge and mobile layout.
- Seven individual class clips, plus [feature walkthrough](demo-media/feature-walkthrough.mp4) and [mobile walkthrough](demo-media/mobile-walkthrough.mp4): 10 MP4 videos total.
- 26 unedited browser screenshots: seven full class images, seven stage details, eight desktop feature images and four mobile images.
- [Offline gallery](demo-media/index.html), [README](demo-media/README.md), [WebVTT captions](demo-media/captions/taskbar-hero-demo.vtt) and [capture manifest](demo-media/capture-manifest.json).
- Local download bundle: /workspace/taskbar-captures/taskbar-hero-demo-media.zip. Open index.html after extracting.

## Each class recorded

| class | weapon / passive | clip | screenshot | duration |
|---|---|---|---|---:|
| Warrior | Sword · Cleave | [warrior.mp4](demo-media/character-clips/warrior.mp4) | [warrior.png](demo-media/screenshots/characters/warrior.png) | 10.24s |
| Guardian | Hammer · Bonk | [guardian.mp4](demo-media/character-clips/guardian.mp4) | [guardian.png](demo-media/screenshots/characters/guardian.png) | 9.92s |
| Rogue | Daggers · Twin Strike | [rogue.mp4](demo-media/character-clips/rogue.mp4) | [rogue.png](demo-media/screenshots/characters/rogue.png) | 10.20s |
| Hunter | Spear · Mark Prey | [hunter.mp4](demo-media/character-clips/hunter.mp4) | [hunter.png](demo-media/screenshots/characters/hunter.png) | 10.52s |
| Archer | Bow · Volley | [archer.mp4](demo-media/character-clips/archer.mp4) | [archer.png](demo-media/screenshots/characters/archer.png) | 10.48s |
| Witch | Staff · Burn | [witch.mp4](demo-media/character-clips/witch.mp4) | [witch.png](demo-media/screenshots/characters/witch.png) | 10.12s |
| Alchemist | Flasks · Poison | [alchemist.mp4](demo-media/character-clips/alchemist.mp4) | [alchemist.png](demo-media/screenshots/characters/alchemist.png) | 10.04s |

## Capture method and scope

Actual gameplay was recorded in Chromium from the unchanged static demo source snapshot 7d3da052dc9754917ade195843d7108ddac876a8, previously deployed for review. All seven classes were genuinely selected through the picker, and the persisted classId was checked before and after loading the corresponding prepared midGame save. A 30-second clock advance triggers claim-driven combat; the footage then records the resulting animations in real time. The video labels staged saves and current in-game art. No proposed class art was substituted, no economy values changed, and no live account, backend, private key, blockchain mint or transaction was used.

The feature walkthrough uses separate midGame, bossReadyWeak, bossReadyStrong and forgeRich saves. Its scenes are edited together, not represented as one continuous fresh-account progression. The individual class clips retain picker selection and the prepared-save transition. The standalone feature and mobile recordings retain their scene changes. Videos are silent with English burned-in labels; the showcase also has a WebVTT transcript.

Desktop video is 1600×900 at 25 fps; mobile video is 390×844. MP4s use H.264 with yuv420p and fast-start metadata. The mobile portion of the showcase is scaled and padded so its navigation remains visible above the label bar. Screenshots come directly from Playwright (full viewport, full page or the actual game-stage region); no image generation or screenshot retouching was used.

## Verification

- PASS: all 9 capture scenarios (7 classes, feature walkthrough, mobile), 1.9 minutes total.
- PASS: zero console/page errors in all capture contexts; no horizontal overflow at screenshot checkpoints.
- PASS: per-class picker/state checks; real claim increases Fish; bulk Equip best persists both upgrades; actual boss victory/chest; crafting increases bag count.
- PASS: all 10 MP4s fully decoded without errors; seven class files have distinct hashes and matching screenshots.
- PASS: PNG headers/dimensions checked; ZIP CRC checked; representative Witch/Guardian and mobile frames visually inspected.
- PASS: source checkout hosting the original static bundle remains clean at 7d3da05; no product branch, main, Site assets, sharing setting, deployment, signed number, auth, contract, dependency or lock/workspace file was changed by this capture task.
- Report/media-only branch checks: pinned frozen install and gen:deno drift passed; full suite skipped: docs only. The capture itself is separately verified above, not claimed as a full game regression rerun.
- NOT VERIFIED: narration/audio, hosted authenticated browser use, real server/Fuji behavior, or final contest/submission approval. These are review recordings.

## Hosting access observation

A read-only get_site call currently reports access_mode=public and access_policy.access_mode=public, with current_user_role=owner and zero external visitors. This differs from the earlier owner-private publication assumption. This task did not change the sharing policy, infer who changed it, or upload the new recordings to that Site. The recordings are supplied here and on this separate review branch. Claude should verify the current audience before any future private publication claim or media upload.

## Reproduce

Use the previous [combined-build report](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-demo-build-report/reports/demo-build-antigravity.md) and integration patch to reconstruct the runtime if needed. The capture/export scripts are saved under demo-media/scripts/. Their workspace paths are explicit; adapt them when using another machine.

1. Serve the unchanged static dist on loopback port 4181 (`python -m http.server 4181 --bind 127.0.0.1 --directory <dist>`).
2. Copy scripts/record.spec.ts to apps/web/e2e/capture/record.spec.ts and scripts/capture-media.config.ts to apps/web/capture-media.config.ts in the temporary demo copy.
3. From apps/web, run `CI=true PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright corepack pnpm@10.28.0 exec playwright test --config capture-media.config.ts`.
4. Run scripts/export-media.py with system ffmpeg/ffprobe available. It creates clips, caption labels, the showcase, gallery, manifest and ZIP, then decodes every output and records metadata.

## Bundle identity

- ZIP bytes: 8080690
- ZIP SHA256: `9d41102356190dd7e9444746ea8b7a27487ccd012971d63c64d1191f8474e045`
- Showcase SHA256: `7349cc03e13426206bc874e5248ab9ecfd01289481404917aa26df38250184d6`

### demo-media-record

```text

Running 9 tests using 1 worker

(node:54404) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 e2e/capture/record.spec.ts:61:3 › record Warrior (10.5s)
  ✓  2 e2e/capture/record.spec.ts:61:3 › record Guardian (10.3s)
  ✓  3 e2e/capture/record.spec.ts:61:3 › record Rogue (10.4s)
  ✓  4 e2e/capture/record.spec.ts:61:3 › record Hunter (10.7s)
  ✓  5 e2e/capture/record.spec.ts:61:3 › record Archer (10.5s)
  ✓  6 e2e/capture/record.spec.ts:61:3 › record Witch (10.4s)
  ✓  7 e2e/capture/record.spec.ts:61:3 › record Alchemist (10.3s)
  ✓  8 e2e/capture/record.spec.ts:86:1 › record feature walkthrough (28.5s)
  ✓  9 e2e/capture/record.spec.ts:129:1 › record mobile (10.8s)

  9 passed (1.9m)

```

### demo-media-export

```text
exported warrior
exported guardian
exported rogue
exported hunter
exported archer
exported witch
exported alchemist
{
  "showcase_seconds": 60.64,
  "video_count": 10,
  "screenshots": 26,
  "zip_bytes": 8080000
}

```

### demo-media-verify

```text
PASS: seven distinct class videos and matching screenshots present.
PASS: 10 H.264 MP4 files fully decoded without errors.
PASS: 26 PNG screenshot headers/dimensions verified.
PASS: all 9 capture scenarios recorded zero console/page errors.
PASS: archive CRC verified; 8080690 bytes.
PASS: served static Site source remains clean at 7d3da052dc9754917ade195843d7108ddac876a8.

```

### demo-media-report-install

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 497, downloaded 0, added 0
Progress: resolved 506, reused 497, downloaded 0, added 40
Progress: resolved 506, reused 497, downloaded 0, added 501
Progress: resolved 506, reused 497, downloaded 0, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 3.7s using pnpm v10.28.0

EXIT 0; runtime 3.82s

```

### demo-media-report-deno

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-media-report
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.41s

```

## Files touched

Only reports/demo-media.md and reports/demo-media/**: recordings, screenshots, gallery, captions, metadata and capture/export scripts. No PR or source merge.
