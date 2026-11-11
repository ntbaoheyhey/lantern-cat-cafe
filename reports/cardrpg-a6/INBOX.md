# User writes corrections here

INBOX NOTE FOR LANE A6 — lane B switches to real 3D (2026-11-11)
(Append to reports/cardrpg-a6/INBOX.md, or paste into the running A6 session. Short; does not change your queue order.)

USER DECISION 11 Nov: lane B replaces the 2.5D illustrated puppets with REAL 3D rigged models for every cat, enemy and boss, and makes all skill/ultimate effects 3D. B also sets a size standard (cats all the same height, bosses 1.7-1.95x, small enemies 0.8-1.0x, elites 1.1-1.3x). New B flag: lookV3D, with per-unit fallback to the puppet until each 3D model is accepted.

What this means for you:
1. Do not build anything new on puppet internals (part layers, puppet rig JSON, plane offsets). Treat B's battle canvas as a black box behind the same actor/event API.
2. Anchor HP bars, labels, damage numbers and targeting rings from B's per-unit manifest sockets (head, hpAnchor, mainHand, offHand, chest, feet, vfxOrigin), not from fixed pixel offsets. Unit sizes on screen will change.
3. Keep your 2D portraits and card art; B only re-renders them if they stop matching the 3D model.
4. Keep merging B's published tip as before (merge commits in your branch are fine; no PR merge/deploy). Read B-OUTBOX.md for lookV3D, budgets and known issues. Combined demo stays <= 40 MB; B targets <= ~16 MB of 3D unit assets.
5. If a screen of yours depends on puppet-specific behavior, write a REQUEST in A6-OUTBOX.md and continue.
