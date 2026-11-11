# Designer contract — C0 baseline, expanded in C2
Current Lane C PROMPT.txt overrides the older redraw/cel/3D briefs.
Final characters animate original soft-painted concept art; PSDs come from the separate read-only PSD-split session.
Layer names: lowercase-kebab ASCII; character-local l-/r-; nested head/eyes/ears/limbs/cloth/tail, hidden ref-flat/ref-pivots; follow the published parts.json and rig notes.
All art faces right; runtime flips enemies. Root between soles at y0; cats512, small410–512, standard/elite563–666, boss870–998, boss width<=1126.4.
Required bones: root, hip, head, hp-anchor, vfx-origin, main-hand, off-hand.
Required animations: idle2–3s, appear0.5–0.8, attack0.6–0.9+hit, skill0.8–1.2+cast/hit, ult1.5–2.5+ult-start/hit/ult-end, hurt0.3–0.4, ko0.8–1.2 hold, victory1.5–2loop; bosses idle-phase2/enrage.
Export<id>.json or .skel, <id>.atlas, PNG pages<=2048, PMA, padding2–4; runtime major.minor4.2 pending designer confirmation.
Budgets: cat~40bones/~400vertices, boss~80bones, <=1clipping. Names/bones/animations/version/height=FIX; budgets/events/timing=WARN.
Deliver /Users/bao/art/designer-inbox/<id>/{source,export,notes.txt,preview.mp4}; source is read-only. Missing events use timed defaults and intake warning.
PNG sequence fallback for license/tool mismatch; Live2D Cubism delivery is flagged for user and uses sequence meanwhile.
C2 adds machine-readable per-unit slots, skill/socket mapping and full validation/acceptance workflow.
