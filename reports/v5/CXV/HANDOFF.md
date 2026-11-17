# CXV handoff
ACTIVE: V1 skill timeline (started 2026-11-17T05:32Z; deadline 10:32Z). V0 DONE.
NEXT 1: sed -n '41,79p' apps/web/src/game/cardrpg/spine/vfx-registry.ts
NEXT 2: Read spine/vfx.ts and vfx-layered/player.ts in <=40-line slices; inspect AG2 manifest and actual skill IDs.
NEXT 3: Implement pure timeline + procedural playback + texture registration; test ordering/duration/reduced-motion and capture 12 hero sheets.
Running PIDs + logs: none.
Last pushed SHA: ecb553f29 (V0 report checkpoint follows).
Last RULES re-read UTC: 2026-11-17T05:32Z.
Mailbox read offsets: BOARD 16, USER 5, INBOX-CXV 5; no STOP present.
CXI owns spine/manifest-loader.ts + assets.ts + atlas-delivery.ts; expose registration API via vfx-registry.ts; scene.ts remains CXV.
AG2 texture delivery b31ccd864 announced; inspect manifest read-only in /Users/bao/th-v5-ag2, never merge their branch.
Owner: free tools preapproved when logged; no login/key/payment. No new dependency without CXI.
