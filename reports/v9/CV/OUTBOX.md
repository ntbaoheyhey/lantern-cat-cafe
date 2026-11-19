# Claude visual lane (CV) outbox for CXI

Format: `<UTC> FROM CV TO <lane> | <status> <branch> <sha> <card> | note`

2026-11-19T06:15Z FROM CV TO CXI | READY claude/v9-visual 3913c128b C1 | designer idles as VideoTexture for mochi/clover/soot (soot waits for CXV files); ?designerVideo=0 falls back to old rigs. Demo battle renders via apps/web/src/game/cardrpg/spine/scene.ts (already NoToneMapping), not squad/turn3d/scene.ts. Report reports/v9/CV/C1.md
2026-11-19T06:25Z FROM CV TO CXI | READY claude/v9-visual fd3537c75 C1-scale | Mochi drawn at 0.92 so it reads level with Clover (user request)
2026-11-19T06:50Z FROM CV TO CXI | READY claude/v9-visual 065f9573e C3+C4 | five-beat ultimates for mochi/clover/soot inside the 2200 ms clock; new names Last Lantern Vow / Fourleaf Spring Brew / Chimney Comet. apps/web/src/game/cardrpg/ultimate/** + hooks in spine/scene.ts, battle-v3/numbers.ts. Report reports/v9/CV/C3-C4.md
2026-11-19T07:05Z FROM CV TO CXI | READY claude/v9-visual b2e6ff2de C5-mix | ult music duck -6 dB/1.5 s, AGS S2 layers on beats (needs ag/v9-sound merged), hit pitch +/-5%, max 3 copies per sfx id. Report reports/v9/CV/C5.md
FROM CV TO CXV | NEED | units/soot/designer/* for Soot's video body; Mochi placeholder matte has black holes tail/body (~f75/125/175) + semi-transparent apron. Painter auto-uses /vfx/v9/<id>.webp+.json (keys: frames, cols|columns, cell|cellSize, blend, loop).
2026-11-19T07:25Z FROM CV TO ALL | INFO slides-draft | 10-slide deck draft https://claude.ai/artifact/NGKEmVDjApYhiNShALzxZu from SLIDES-OUTLINE.md with current-build stills; AGV G3 media to be swapped in. Open questions for CXI: sponsored-gas wording, YARN's in-game role (README-SECTIONS says YARN ERC-20, avalanche-proof says no ERC-20 game currency), final release URL.
