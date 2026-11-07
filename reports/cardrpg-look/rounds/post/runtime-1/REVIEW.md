# L3 runtime round1 — rejected

Actual1440x900/DPR2 stage1-wide bbd6898e viewed beside exact L2 stage3. Same3.2s/camera. Stage2/3 and other camera samples are retained. These are visual trials, not phase acceptance.

Five defects (CSS pixels):
1. AO speckle on curtains x570–655/y320–435 and foreground ceramics x1270–1410/y700–805 makes the finish gritty; worse than L2. Fix first: stable evenly sampled AO kernel and lower clamp/strength, protect faces completely.
2. Foreground table x1260–1425/y700–810 stays as sharp as heroes. Replace fixed16.5–23 depth threshold with camera-target relative focal distance and gentle near/far falloff.
3. Pendant shades x480–560/y310–350 still have no visible soft halo. Need threshold response to actual HDR lamp emission and broader radius without face leakage.
4. Soot lower body x405–458/y650–700 improved slightly but still merges with teal floor at a glance. Retain subtle blue fill; quantify before raising it further.
5. Broad rug/floor x760–1200/y610–790 remain nearly evenly lit. Add a restrained directional gradient through actual key/fill balance; do not hide weakness by dark vignette.

Fix top1–3 before next visual round. Provisional self grades: post5 (grain regression), depth5.5, face clarity7, focal hierarchy6.5. HUD is visibly crisp and outside the canvas post; pixel comparison pending.
