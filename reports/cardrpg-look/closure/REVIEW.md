# Lane B closure review

The published L7 evidence remains at draft378. This work is a separate compatibility/repair checkpoint, not a replacement for its 860-case measurement.

## Presentation

Personally reviewed round3 1024-cooldowns, 1280-boss-phase and 1440-earned PNGs. The first attempt's cooldowns overlapped the caption at y580–600. Grid rows now reserve their actual height; all four fixture skills fit without crossing the bottom or each other. The second run failed because the injected event fixture left starter cats with three skills; the harness now also uses the fixture's exact skill lists. Both failed attempts remain saved.

Specific remaining visual limitations: at1024 the Greenhouse skill name truncates but its full title and cooldown remain available; the compact type is small; HP portraits are small; the crew bar takes stage space; the earned badge is demonstrated on a B battle, not in A's Invitations screen. Phase text in screenshots comes from a fixture and does not assert a natural Pantry Crown encounter.

## Effect pilot

Personally viewed the original Clover contact sheet and both closure pilots. The taller, narrower greenhouse arch reads more like an enclosing conservatory, retaining its feet and ground position; it no longer looks as close to a shallow shield. Five visible issues: pale material over the teal rug, thin arch ribs, leaf cluster at ground contact, a wide empty opponent half, and repeated arches aligned through the party. Height, width and ground anchoring address the silhouette; material softness and composition remain limitations. No new high-quality smoke/cloth claims.

Pilot1 improves65 of66 Clover distances versus the L4 published row but regresses Yarn Giant by.0052683. Pilot2 narrows that regression to.0010028. Both retain no face or overdraw offenders. Final-source1.65height was personally reviewed in effects/reviewed/clover-runtime-1.png. Its taller pointed roof stays grounded, faces remain clear, and all66 Clover comparisons improve against L4 with no new decrease. Exact original-baseline comparisons still have1140/2211 decreases (previously1162), so the strict historical gate remains missed. This incremental audit reuses unchanged66 historical rows; fresh six-effect captures cover15 pairs with no absolute/face/overdraw offenders. Pale material and wire-like ribs remain visible limitations.

## Startup and performance

Static imports keep LOOK code inside the existing lazy3D route, avoiding extra shared Three/preload chunks at the app entry. Default startup sizes and module memberships match the baseline, with zero Three/model modules. This moves more code into the optional classic3D route; it is not a claim that that route's download size is unchanged. URL registries do not fetch models; resource creation remains gated by LOOK.

The retained native label benchmark is120 deterministic output-parity cases and seven alternating samples, 960calls/sample: median58.3037→50.7579ms. It does not measure browser GC or explain the four historical cast stalls. Exact label collision tests pass. Actor costume metadata is resolved at React snapshot updates instead of each rendered frame.

The first startup audit assumed all non-entry hashes identical; two additional hash changes propagate through entry import references. The corrected audit explicitly reports8/11 byte-identical scripts and verifies per-chunk byte counts/module membership plus normalized entry/all five preload branches. It does not claim binary parity.

## Completed targeted verification

Source 8ba0a3879 and artifact 7e092b1a remain bound to 1,944 unchanged inputs. All five source gates pass (1,770 web/421 E2E). The 20 natural replays completed with 21 retained snapshots, no page errors, and constant 537 geometries/103 textures/43 programs. Heap grew 1,116,232 bytes, within the recorded 2 MiB tolerance; literal flatness and absence of leaks are not established.

Current performance misses are retained: 8/24 hero windows exceed 50 ms (peak 633.3 ms), 11/24 miss 99% <=20 ms; the four targeted CPU4 first casts peak 133.3/100.0/133.3/216.6 ms, with Brioche/Velvet also over exact 33 ms p95. Cold7 reaches 666.6 ms and natural post-ready gaps 400 ms; the targeted gallery full-page peak 716.7 ms is separate. Registered ABBA has old/current/current/old first/repeat maxima 83.3/16.8, 50.0/183.4, 16.8/16.8, 99.9/16.8 ms. Stalls on both artifacts do not establish a causal patch improvement or an external cause. See COLD-REVIEW and audit.json for all raw-bound results.

No browser samples were retried to obtain a pass. The ABBA collector's incorrect completion-field assertion was corrected after all observations had ended; the original failed helper log is retained. No source/runtime rebuild or second full matrix followed.

The plan's strict effect-pair and all-frame performance aspirations remain unmet. B renderer implementation, measured evidence and integration contract are delivered; those measured limitations are not reclassified as completed optimizations. A still owns live Invitations receipt forwarding, icon/frame integration and merged delivery. Native macOS; no Docker, subagents, generative assets, protected/shared changes, merge or deploy.
