# OMG 3Q reference video notes (learn only, never copy art/names/assets; never feed frames to generators)
Sources (Mac /Users/bao/Downloads): V1 newbie guide 44:49 1620x1080@60; V2 battle "one hit one kill" 14:45 1920x888@30.
Frames: /mnt/project-files/taskbar-hero/omg-ref-2026-11-12/ (v1 every 12 s, v2 every 3 s, 3x3 sheets) + Mac /Users/bao/tools/omg-ref-2026-11-12/burst (5 fps bursts at 26-38 s and 43-55 s, spectrogram).

## Battle (V2)
- 6v6, two mirrored blocks, each 2 columns x 3 rows staggered; units overlap 20-40%, block fills ~45% screen width each, units ~22-28% of screen height (chibi 2.5 heads), back row slightly higher+smaller. Big wings/pets/auras make it feel "full". Center gap only ~10% width.
- HUD: top thin strip (turn 1/20 hourglass, wave 1/1, power numbers tiny). Bottom center: ONE row of 6 square bust portraits (face close-up, strong frame: gold glow = ultimate ready, greyscale = dead), under each 2 slim bars (HP green, rage orange). Bottom-left big "x3" speed, bottom-right "Skip". Nothing else. Enemy has no portrait bar.
- Over units: tiny HP bar + 1-2 status glyph icons (shield, crossed swords, skull) only. Status/buff names float as stacked outlined words in buff color (cyan=defense, gold=attack, red=lifesteal/immune, green=heal) and fade in 0.6 s.
- Damage numbers: large italic gradient digits with heavy outline; crit uses bigger red/orange; heal green "+". "Total damage" banner (italic label + big gold numbers on dark slash ribbon) after each skill.
- ULTIMATE cinematic (measured at 5 fps, V2 46.6-52.4 s, ~5.5 s total at x3 speed):
  1 Cut-in 0.6 s: radial flash ring -> horizontal banner across left 60% of screen with hero BUST art sliding in + speed lines, skill name in huge gold-orange outlined display font. Battle behind dims to ~40%.
  2 Charge 0.4 s: caster glows, flare at target, scene darkens.
  3 White flash -> full-screen VFX clip ~3.4 s, its own background (not the battlefield): slash arcs, close-up silhouette in crystal/energy, vortex, time/clock motif, shard burst, 2 whiteouts as cuts. Portrait bar stays visible.
  4 Return 0.6 s: impact on enemy side (crater, pillars of light, debris), multi-hit numbers popping, total damage ribbon.
  5 Resolve: buff words float, rage +N words, next actor.
- Normal skill: 1-1.5 s in-field (dash/slash arc, element burst at target, numbers). Summons (phoenix, tiger, dragon) appear as large overlays over the block.
- Element color language per hero: ice=cyan/white shards, fire=orange spiral, thunder=violet bolts, nature=green orbs, holy=gold pillars.
- Audio (spectrogram 26-56 s): continuous BGM bed + dense layered SFX transients each hit; clear harmonic voice contours on each skill cast (shout/voice line ~0.5-1 s) roughly every 7-10 s; short silence gaps at cut transitions (ducking).

## Out-of-battle (V1)
- Login: full-bleed key art, logo top-center, server picker, one big orange "Enter" CTA, age/health notice, terms checkbox.
- Home: main hero(es) standing LARGE on a stage in center (seasonal backdrop); top-left avatar+level+power number; top-right currency pills with "+"; right column event icons (top-up, events, shop, quests); left column (tavern gacha, AFK farm); bottom dock 9 icons (formation, heroes, bag, destiny, guild, fun, challenge, dungeon). Icons = painted chunky objects with thick outline, red dot badge, "new" ribbon.
- Panels: dark navy/purple gradient, gold bevel frame, ribbon title, orange primary CTA, grey secondary; item tiles with rarity frame (green/blue/purple/orange/red) + count bottom-right + "new"/"need" corner tags; batch-use dialog (Min/-10/-/+/+10/Max).
- Hero screen: hero on round pedestal left, stat table right with green +deltas, tabs (info / level / advance / star-chart / how-to-get). Constellation star-chart upgrade (nodes light up).
- Formation screen: hero center, 6 gear slots around (helm, weapon, armor, boots, ring, mount) with level badges, big POWER number with glowing font. Formation grid 6 tiles (2x3 skewed).
- Stage: 3-star clear, "sweep x10" button, drop preview tiles, stamina cost. Campaign = painted world map with chapter nodes + chest progress bar.
- Modes: Arena (rank, honor currency), Tower (floor path), World Boss (daily 21:00 window, damage ranking rewards), AFK auto-farm stage with chest, quiz events.
- Economy patterns: shards ("Manh") of heroes/gear bought in mode-specific shops with per-day limits + timed refresh; dismantle/recycle returns materials; multiple currencies per mode (honor, guild, tower soul); 7-day server-open login track; level-milestone gifts; VIP track; enhance success burst.
- Victory: "WIN" ribbon + hero pose burst; level-up overlay with hero art and gold title.
- Fonts: everything in heavy display face with outline + gradient (gold->orange for titles, white with dark stroke for labels), condensed for UI; never plain sans.
