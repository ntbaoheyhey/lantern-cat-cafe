# Q2 working review — OPEN

This is a checkpoint, not an acceptance review. The current films predate the animated-alpha correction; 4/84 action sheets and all five roster-facing sheets have been inspected in this continuation. No completion or >=8 score is claimed.

## Findings
- Current setup-pose alpha: cats 194–195 px at 720p, 243 px at 900p. Animated cat spread reaches 1.1026 and minimum 187/720=.2597; this fails Q2.
- Opacity-contour experiment: cats <=1.03665 and ordinary enemies <=1.04211 with internal 98.5–101.5% scale envelope. Not integrated yet; see LEARN/Q2.md and tools/v3craft-lab/q2/normalize-study.json.
- Real screen clipping exists on teacup recoil in wave3 and one boss-helper recoil at 900p. Needs a layout correction and fresh recordings.
- Recorded number rectangles: max 2 per target, zero face intersections, visible lifetime <=634.3 ms when keyed by key + birth time. A reused key across actions is not one long-lived number. Needs final footage confirmation.
- Formation tap regression fixed using board-local coordinates. Four normal-click C2 browser tests now PASS. Prior 431 other browser cases passed. A/B historical/future evidence failures remain open for Q9 classification.

## Current footage observations
| Fixture/action | Frames | Visible observation |
|---|---|---|
| wave1 A1 Mochi basic | f2–28; impact f13 | Larger planted cat leans, gold branches travel to moth/cup; gold circular wraps follow. Numbers remain below faces and clear at action end. |
| wave1 A2 Soot basic | f29–54; impact f39 | Staff bolt travels from the rear slot, moth rocks inside a purple loop. One -72 low beside the target; clear by next action. |
| wave1 A3 Clover basic | f55–81; impact f66 | Green bolt and leaf curls; Clover support glow and moth recoil. One -38 near feet; no face occlusion. |
| wave1 A4 Panko basic | f82–107; impact f92 | Panko leans, sends gold bolt; moth recoils inside gold fans. One -58 below body; old numbers absent. |

Facing sheets tools/v3craft-lab/q2/facing-1.jpg through facing-5.jpg: all 25 sprites were inspected in idle, attack, hurt and KO. Cat muzzle/weapon silhouettes point right; enemy ram muzzles, kettle spouts and front-left eye planes point left. Pose sampling contains front-facing designs but no reversed enemy. Source rows in facing.json must remain paired with actual battle source evidence.

Q3-owned defects remain: circular main shapes, yellow/pink field washout, weak silhouette anticipation, pasted cut-out motion. Q4 names and Q5 sound remain pending. Q1 video timing remains OPEN. Full action table and final defect checklist must replace this working review after production repairs and fresh footage.
