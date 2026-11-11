# Designer contract — Lane C

Animate the existing soft-painted original concepts. The separate PSD-split session publishes read-only PSDs, `<id>-3-4-parts.json` and rig notes under `/Users/bao/Desktop/TaskbarHero-PSD-cho-designer-2026-11-11/`. Preserve its lowercase-kebab layer names, character-local `l-`/`r-`, hidden `ref-flat`/`ref-pivots`, eye-closed and mouth-open alternatives. Rig notes explicitly flag automatic hidden fills; the designer reviews them. No final character generation by Lane C.

Use the right-facing 3/4 view. Draw every character facing right; the game flips enemies. Root is between the soles at y=0; +y is up. Shared runtime version is `assets/cardrpg-look/spine/config.json` (`runtimeVersion`, default 4.2). Export with the matching major.minor. Editor patch versions may differ. JSON is preferred for review; binary `.skel` is supported by the same official parser. Spine license confirmation remains a user-only item; PNG sequences avoid loading the Spine runtime for those assets.

Required bones: `root`, `hip`, `head`, `hp-anchor`, `vfx-origin`, `main-hand`, `off-hand`. `hp-anchor` is above ears/hat, head is the face center, vfx-origin is torso center, hand bones sit at actual effect contact points. HUD maps these to `feet`, `chest`, `head`, `hpAnchor`, `vfxOrigin`, `mainHand`, `offHand`. Bone names must be lowercase ASCII kebab-case and unique. Attach multiple color/detail layers to one useful bone; do not create one bone per paint patch.

Cats: 512 units regardless of rarity. Small enemies: 410–512 (target461); standard/elite: 563–666 (target614); bosses: 870–998 (target922), width at most1126.4. Pollen Scout is combat-elite with a small silhouette; Kettle Knight is standard-sized elite. Only Yarn Giant, Rain Spool and Pantry Crown use boss sizing. The validator measures setup attachments, not only declared JSON height. An optional `intake.json` with `{"scale":0.5}` converts 1024-unit exports to 512 without editing source art. The actual scale is recorded in validation and manifest. Keep oversized transparent margins out of attachments.

| Clip | Duration | Behavior / events |
|---|---|---|
| idle | 2–3s | loop; breathing, blink, ear/tail/cloth secondary motion |
| appear | 0.5–0.8s | one entrance |
| attack | 0.6–0.9s | hit at contact |
| skill | 0.8–1.2s | cast at release, hit at contact |
| ult | 1.5–2.5s | ult-start, optional cast, one or more hit, ult-end |
| hurt | 0.3–0.4s | short readable recoil |
| ko | 0.8–1.2s | hold final pose |
| victory | 1.5–2s | loop |
| idle-phase2 | 2–3s | bosses only, loop |
| enrage | 0.8–1.2s | bosses only, cast cue |

Missing events use named timed defaults, recorded as WARN. All event times are seconds from clip start; repeated hit events are supported. Live battle timing remains owned by the deterministic action timeline; animation is retimed to fit it. Each actor owns an AnimationState with0.15s mixes; shared SkeletonData and atlas are cached. No gameplay damage is calculated by the art runtime.

Export `<id>.json` OR `<id>.skel`, `<id>.atlas`, `<id>.png` plus extra named PNG pages in the same export folder. Each page<=2048×2048,2–4px gutters, linear filtering, clamp. Prefer premultiplied-alpha PNG + `pma:true`; straight alpha is accepted with WARN and premultiplied once by the loader. Never label straight pixels as PMA. No absolute paths, parent-directory paths or symlinks escaping the export. Cat budget~40bones/~400mesh vertices; boss~80bones/~800vertices;<=1clipping attachment.

Delivery layout: `/Users/bao/art/designer-inbox/<id>/{source,export,notes.txt,preview.mp4}`. Put PSD/.spine sources under source, runtime files under export. Notes: tool/version, license confirmation, original-art confirmation, changed sockets/timing, known limits. Lane C reads sources only. Run `node tools/cardrpg-look/spine/validate.mjs <id> <export-folder>` then `node tools/cardrpg-look/spine/intake.mjs <id> <export-folder> --install`. `--scan` checks the common inbox. Installation writes immutable revision folders and changes only slots.json; malformed replacements preserve the last accepted revision. Rebuild/reload to discover newly added files; no TypeScript edits.

FIX: names, missing bones/animations, major.minor mismatch, invalid atlas/PNG, nonfinite transforms, measured height/width. Keep the unit's previous accepted export or placeholder. WARN: budgets, clip duration, missing/out-of-order events, straight alpha; accept structurally and list follow-up. Reports go to `reports/cardrpg-c/spine/<id>/{validation.json,PASS-FIX-VI.md}`. Structural PASS is separate from visual acceptance. After installing, capture every clip as a filmstrip plus battle shots at1280×720/1440×900; inspect edges, sockets, ground contact, scale, face/HP visibility and every event before recording visual PASS. Acceptance harness is connected with the C3 stage; designer arrivals use C8 continuously.

PNG fallback: place `sequence.json` and frames in export. Shape: `{"id":"mochi","facing":"right","height":512,"width":400,"scale":1,"fps":24,"sockets":{"root":[0,0],"hip":[0,240],"head":[0,390],"hp-anchor":[0,550],"vfx-origin":[0,260],"main-hand":[160,260],"off-hand":[-100,240]},"animations":{"idle":{"frames":["idle/000.png","idle/001.png"],"events":[]}}}`. Include ALL required clips with enough frames for their stated duration; all frames share a canvas, alpha and root. Sockets are Spine-unit positions at the setup pose; optional per-frame socket tracks may be supplied in a later compatible revision. The example's two-frame idle is schematic, not a passing delivery. Cubism `.model3.json`/`.moc3` is detected, recorded in NEEDS-USER and uses the sequence path pending tooling confirmation.

Lane C owns every skill/status VFX. Exact skill IDs, animation mappings and origin/impact bones are in `slots.json` and ASSET-SLOTS. Optional designer effects go in `assets/cardrpg-look/vfx-designer/<portable-skill-id>/` (`enemy:foo` becomes `enemy-foo`) as a Spine export or `sequence.json`. Keep effects separate from character body animation. The registry switches to a validated override without code edits. Retiming uses event/socket metadata. Painted palette and glow/rim/timing values stay in one shared token file.

Spool Ram preparation: the rules charge event (not an extra required Spine event) selects the existing `skill` clip for either basic/signature ID. Its `cast`/`hit` cues wind the caster bobbin; hit is a contact marker, not guaranteed damage. The following actual strike keeps the usual attack/skill mapping. Standard designer VFX slots override strikes only; the cached painted preparation variant stays distinct.

Mixed actions: `hit` marks contact, not guaranteed damage. Current combat outcomes choose each recipient: hostile damage/debuff goes to the affected enemy; heal/shield goes to the affected ally or caster. Clover Leaf tap recovery rises from the patient root/feet; Cinnamon drain uses its caster root/feet. Marigold Spring pruning can apply or fail statuses without any damage/hurt cue. Keep these event semantics when retiming designer clips; no new bones or required events.
