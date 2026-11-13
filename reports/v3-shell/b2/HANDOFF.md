# V3B2 handoff
NOW: U4 PASS: 62s real menu tour with sound, 6.7 MiB; runtime median 60 fps; max shift 0.030401 across both runs. Full suite: 2514 web, 724 server, 1388 rules (+2 expected failures/11 skips).
NEXT 1: S5 real audio renders: battle 180s, boss 120s, home/bag/gacha/forge 60s. Reuse scripts/audio/capture-page.mjs. Measure with analyse.py; tune actual runtime mix.
NEXT 2: U4 motion/tour, then S5-S7 sound acceptance; continue E1-E5, T1/C1, E6/P without stopping.
NEXT 3: Dated syncs 16/18/19 Nov 12:00 UTC. No sync due yet.
LAST GOOD COMMIT: U4 in this commit; prior U3 7c6a9f8a6.
OPEN: U3 has 54 real captured states (53 baseline plus new batch dialog), all <=25 words; A-owned preparation has four plain/glyph controls.
OPEN: Visual gaps include hero pedestal/detail density, season pass placeholder, settings, receipt labels and chapter map. No full U3 PASS claimed.
OPEN: jsdom wallet tests repaired for native dialog semantics; exact test preserved flag and focus checks.
OPEN: Invitation odds now use readable rarity/Base/Next labels (16 words); offline warning/close are inline SVG and survive disconnected network.
OPEN: Compact fusion primary fits; footer recovery/help still needs space at 720p and is scored FAIL. No hidden acceptance gaps.
OPEN: V recognition-only permitted PARTIAL after nine measured iterations; all other V gates pass.
OPEN: Sound-map coverage refreshed for moved controls; no unresolved calls. Audio payload unchanged.
PIDS: 67495 UI-kit static 5995; 11042 Vite 5994; 10918 local.mjs 5996/5997 with child Anvil 10937 on 8546. Never touch session A servers.
PIDS: captures and suites finished. Local chain tours only open/cancel buys; no market mutation since restart.

LEARNED: Discovery toast geometry is fixed. Tour output is -23.1 LUFS, true peak -10.99; S5 must raise menus into -20..-16 and measure voices/ticks.
