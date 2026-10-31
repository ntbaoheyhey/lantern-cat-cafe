# Asset manifest (planned, generated from the demo data)

Every image the rune/skill/drop system needs. All are NEW additions: existing repo art is never replaced (monsters reuse `apps/web/src/art/monsters` where present). Until real art lands, the demo and the app use the placeholder glyphs.
Provenance: when an asset is produced, fill the last two columns of `provenance.csv` (tool, prompt id, date, human check). Never feed the reference game's art to any generator.

Counts: 163 assets. Native sizes are multiples of 8; export at 1x and scale by integer factors only.

| id | category | size | frames | file | used on screens | note | status |
|---|---|---|---|---|---|---|---|
| skill.tail.icon | skill icon | 32x32 | 1 | art/skills/tail.png | Skills, Codex, Planner | Tail Whip | planned |
| skill.tail.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/tail.png | Skills (preview) | 8-frame loop, slash | planned |
| skill.pounce.icon | skill icon | 32x32 | 1 | art/skills/pounce.png | Skills, Codex, Planner | Midnight Pounce | planned |
| skill.pounce.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/pounce.png | Skills (preview) | 8-frame loop, dash | planned |
| skill.bonk.icon | skill icon | 32x32 | 1 | art/skills/bonk.png | Skills, Codex, Planner | Cushion Bonk | planned |
| skill.bonk.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/bonk.png | Skills (preview) | 8-frame loop, slam | planned |
| skill.volley.icon | skill icon | 32x32 | 1 | art/skills/volley.png | Skills, Codex, Planner | Fur Volley | planned |
| skill.volley.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/volley.png | Skills (preview) | 8-frame loop, volley | planned |
| skill.orbit.icon | skill icon | 32x32 | 1 | art/skills/orbit.png | Skills, Codex, Planner | Yarn Orbit | planned |
| skill.orbit.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/orbit.png | Skills (preview) | 8-frame loop, orbit | planned |
| skill.cloud.icon | skill icon | 32x32 | 1 | art/skills/cloud.png | Skills, Codex, Planner | Catnip Cloud | planned |
| skill.cloud.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/cloud.png | Skills (preview) | 8-frame loop, cloud | planned |
| skill.blanket.icon | skill icon | 32x32 | 1 | art/skills/blanket.png | Skills, Codex, Planner | Warm Blanket | planned |
| skill.blanket.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/blanket.png | Skills (preview) | 8-frame loop, dome | planned |
| skill.bolt.icon | skill icon | 32x32 | 1 | art/skills/bolt.png | Skills, Codex, Planner | Whisker Bolt | planned |
| skill.bolt.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/bolt.png | Skills (preview) | 8-frame loop, chain | planned |
| skill.zoom.icon | skill icon | 32x32 | 1 | art/skills/zoom.png | Skills, Codex, Planner | Ember Zoomies | planned |
| skill.zoom.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/zoom.png | Skills (preview) | 8-frame loop, burst | planned |
| skill.purr.icon | skill icon | 32x32 | 1 | art/skills/purr.png | Skills, Codex, Planner | Purr Pulse | planned |
| skill.purr.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/purr.png | Skills (preview) | 8-frame loop, heal | planned |
| skill.laser.icon | skill icon | 32x32 | 1 | art/skills/laser.png | Skills, Codex, Planner | Laser Chase | planned |
| skill.laser.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/laser.png | Skills (preview) | 8-frame loop, mark | planned |
| skill.fishfall.icon | skill icon | 32x32 | 1 | art/skills/fishfall.png | Skills, Codex, Planner | Starfall Fish | planned |
| skill.fishfall.fx | skill effect sheet | 128x128 | 8 | art/skills/fx/fishfall.png | Skills (preview) | 8-frame loop, rain | planned |
| passive.sharp.icon | passive icon | 32x32 | 1 | art/passives/sharp.png | Passives, Codex | Sharp Nails | planned |
| passive.quick.icon | passive icon | 32x32 | 1 | art/passives/quick.png | Passives, Codex | Quick Paws | planned |
| passive.pounceI.icon | passive icon | 32x32 | 1 | art/passives/pounceI.png | Passives, Codex | Pounce Instinct | planned |
| passive.emberw.icon | passive icon | 32x32 | 1 | art/passives/emberw.png | Passives, Codex | Ember Whiskers | planned |
| passive.patience.icon | passive icon | 32x32 | 1 | art/passives/patience.png | Passives, Codex | Hunter's Patience | planned |
| passive.echo.icon | passive icon | 32x32 | 1 | art/passives/echo.png | Passives, Codex | Echoing Crits (capstone, 48x48 frame) | planned |
| passive.keen.icon | passive icon | 32x32 | 1 | art/passives/keen.png | Passives, Codex | Keen Eyes | planned |
| passive.clover.icon | passive icon | 32x32 | 1 | art/passives/clover.png | Passives, Codex | Lucky Clover | planned |
| passive.sleek.icon | passive icon | 32x32 | 1 | art/passives/sleek.png | Passives, Codex | Sleek Reflexes | planned |
| passive.nose.icon | passive icon | 32x32 | 1 | art/passives/nose.png | Passives, Codex | Treasure Nose | planned |
| passive.focus.icon | passive icon | 32x32 | 1 | art/passives/focus.png | Passives, Codex | Mouser's Focus | planned |
| passive.moonw.icon | passive icon | 32x32 | 1 | art/passives/moonw.png | Passives, Codex | Moonlit Whiskers (capstone, 48x48 frame) | planned |
| passive.fur.icon | passive icon | 32x32 | 1 | art/passives/fur.png | Passives, Codex | Thick Fur | planned |
| passive.soft.icon | passive icon | 32x32 | 1 | art/passives/soft.png | Passives, Codex | Soft Landing | planned |
| passive.wpurr.icon | passive icon | 32x32 | 1 | art/passives/wpurr.png | Passives, Codex | Warm Purr | planned |
| passive.nap.icon | passive icon | 32x32 | 1 | art/passives/nap.png | Passives, Codex | Nap Shield | planned |
| passive.aura.icon | passive icon | 32x32 | 1 | art/passives/aura.png | Passives, Codex | Cozy Aura | planned |
| passive.catnap.icon | passive icon | 32x32 | 1 | art/passives/catnap.png | Passives, Codex | Cat Nap (capstone, 48x48 frame) | planned |
| rune.purr.t1 | rune | 32x32 | 1 | art/runes/purr-t1.png | Runes, Codex, Planner | Purr Dim | planned |
| rune.purr.t2 | rune | 32x32 | 1 | art/runes/purr-t2.png | Runes, Codex, Planner | Purr Glow | planned |
| rune.purr.t3 | rune | 32x32 | 1 | art/runes/purr-t3.png | Runes, Codex, Planner | Purr Bright | planned |
| rune.purr.t4 | rune | 32x32 | 4 | art/runes/purr-t4.png | Runes, Codex, Planner | Purr Radiant (sparkle loop) | planned |
| rune.hiss.t1 | rune | 32x32 | 1 | art/runes/hiss-t1.png | Runes, Codex, Planner | Hiss Dim | planned |
| rune.hiss.t2 | rune | 32x32 | 1 | art/runes/hiss-t2.png | Runes, Codex, Planner | Hiss Glow | planned |
| rune.hiss.t3 | rune | 32x32 | 1 | art/runes/hiss-t3.png | Runes, Codex, Planner | Hiss Bright | planned |
| rune.hiss.t4 | rune | 32x32 | 4 | art/runes/hiss-t4.png | Runes, Codex, Planner | Hiss Radiant (sparkle loop) | planned |
| rune.mew.t1 | rune | 32x32 | 1 | art/runes/mew-t1.png | Runes, Codex, Planner | Mew Dim | planned |
| rune.mew.t2 | rune | 32x32 | 1 | art/runes/mew-t2.png | Runes, Codex, Planner | Mew Glow | planned |
| rune.mew.t3 | rune | 32x32 | 1 | art/runes/mew-t3.png | Runes, Codex, Planner | Mew Bright | planned |
| rune.mew.t4 | rune | 32x32 | 4 | art/runes/mew-t4.png | Runes, Codex, Planner | Mew Radiant (sparkle loop) | planned |
| rune.chirp.t1 | rune | 32x32 | 1 | art/runes/chirp-t1.png | Runes, Codex, Planner | Chirp Dim | planned |
| rune.chirp.t2 | rune | 32x32 | 1 | art/runes/chirp-t2.png | Runes, Codex, Planner | Chirp Glow | planned |
| rune.chirp.t3 | rune | 32x32 | 1 | art/runes/chirp-t3.png | Runes, Codex, Planner | Chirp Bright | planned |
| rune.chirp.t4 | rune | 32x32 | 4 | art/runes/chirp-t4.png | Runes, Codex, Planner | Chirp Radiant (sparkle loop) | planned |
| rune.trill.t1 | rune | 32x32 | 1 | art/runes/trill-t1.png | Runes, Codex, Planner | Trill Dim | planned |
| rune.trill.t2 | rune | 32x32 | 1 | art/runes/trill-t2.png | Runes, Codex, Planner | Trill Glow | planned |
| rune.trill.t3 | rune | 32x32 | 1 | art/runes/trill-t3.png | Runes, Codex, Planner | Trill Bright | planned |
| rune.trill.t4 | rune | 32x32 | 4 | art/runes/trill-t4.png | Runes, Codex, Planner | Trill Radiant (sparkle loop) | planned |
| rune.yowl.t1 | rune | 32x32 | 1 | art/runes/yowl-t1.png | Runes, Codex, Planner | Yowl Dim | planned |
| rune.yowl.t2 | rune | 32x32 | 1 | art/runes/yowl-t2.png | Runes, Codex, Planner | Yowl Glow | planned |
| rune.yowl.t3 | rune | 32x32 | 1 | art/runes/yowl-t3.png | Runes, Codex, Planner | Yowl Bright | planned |
| rune.yowl.t4 | rune | 32x32 | 4 | art/runes/yowl-t4.png | Runes, Codex, Planner | Yowl Radiant (sparkle loop) | planned |
| rune.twin.purr.overlay | rune twin overlay | 16x16 | 1 | art/runes/twin-purr.png | Runes | small badge combined with a base rune | planned |
| rune.twin.hiss.overlay | rune twin overlay | 16x16 | 1 | art/runes/twin-hiss.png | Runes | small badge combined with a base rune | planned |
| rune.twin.mew.overlay | rune twin overlay | 16x16 | 1 | art/runes/twin-mew.png | Runes | small badge combined with a base rune | planned |
| rune.twin.chirp.overlay | rune twin overlay | 16x16 | 1 | art/runes/twin-chirp.png | Runes | small badge combined with a base rune | planned |
| rune.twin.trill.overlay | rune twin overlay | 16x16 | 1 | art/runes/twin-trill.png | Runes | small badge combined with a base rune | planned |
| rune.twin.yowl.overlay | rune twin overlay | 16x16 | 1 | art/runes/twin-yowl.png | Runes | small badge combined with a base rune | planned |
| rune.socket.empty | socket | 48x48 | 1 | art/runes/socket-empty.png | Runes |  | planned |
| rune.socket.filled | socket | 48x48 | 1 | art/runes/socket-filled.png | Runes |  | planned |
| mat.yarn | material | 32x32 | 1 | art/materials/yarn.png | Drops, Workshop, Codex | Yarn | planned |
| mat.fluff | material | 32x32 | 1 | art/materials/fluff.png | Drops, Workshop, Codex | Fluff Tuft | planned |
| mat.button | material | 32x32 | 1 | art/materials/button.png | Drops, Workshop, Codex | Shiny Button | planned |
| mat.crystal | material | 32x32 | 1 | art/materials/crystal.png | Drops, Workshop, Codex | Catnip Crystal | planned |
| mat.scale | material | 32x32 | 1 | art/materials/scale.png | Drops, Workshop, Codex | Starlight Scale | planned |
| mat.pearl | material | 32x32 | 1 | art/materials/pearl.png | Drops, Workshop, Codex | Moon Pearl | planned |
| mat.dust | material | 32x32 | 1 | art/materials/dust.png | Drops, Workshop, Codex | Rune Dust (new) | planned |
| mat.ink | material | 32x32 | 1 | art/materials/ink.png | Drops, Workshop, Codex | Etch Ink (new) | planned |
| frame.rarity.common | item frame | 48x48 | 1 | art/frames/common.png | Bag-like grids, Codex | Common frame, border + shape marker | planned |
| frame.rarity.uncommon | item frame | 48x48 | 1 | art/frames/uncommon.png | Bag-like grids, Codex | Uncommon frame, border + shape marker | planned |
| frame.rarity.rare | item frame | 48x48 | 1 | art/frames/rare.png | Bag-like grids, Codex | Rare frame, border + shape marker | planned |
| frame.rarity.epic | item frame | 48x48 | 1 | art/frames/epic.png | Bag-like grids, Codex | Epic frame, border + shape marker | planned |
| frame.rarity.legendary | item frame | 48x48 | 1 | art/frames/legendary.png | Bag-like grids, Codex | Legendary frame, border + shape marker | planned |
| slot.weapon | slot glyph | 32x32 | 1 | art/slots/weapon.png | Gear, Codex | silhouette, recolourable | planned |
| slot.helmet | slot glyph | 32x32 | 1 | art/slots/helmet.png | Gear, Codex | silhouette, recolourable | planned |
| slot.armor | slot glyph | 32x32 | 1 | art/slots/armor.png | Gear, Codex | silhouette, recolourable | planned |
| slot.gloves | slot glyph | 32x32 | 1 | art/slots/gloves.png | Gear, Codex | silhouette, recolourable | planned |
| slot.boots | slot glyph | 32x32 | 1 | art/slots/boots.png | Gear, Codex | silhouette, recolourable | planned |
| slot.collar | slot glyph | 32x32 | 1 | art/slots/collar.png | Gear, Codex | silhouette, recolourable | planned |
| slot.earring | slot glyph | 32x32 | 1 | art/slots/earring.png | Gear, Codex | silhouette, recolourable | planned |
| slot.ring | slot glyph | 32x32 | 1 | art/slots/ring.png | Gear, Codex | silhouette, recolourable | planned |
| slot.charm | slot glyph | 32x32 | 1 | art/slots/charm.png | Gear, Codex | silhouette, recolourable | planned |
| item.mallet | gear icon | 32x32 | 1 | art/items/mallet.png | Runes, Codex | Cedar Mallet (Uncommon) | planned |
| item.claw | gear icon | 32x32 | 1 | art/items/claw.png | Runes, Codex | Ember Claw (Epic) | planned |
| item.fang | gear icon | 32x32 | 1 | art/items/fang.png | Runes, Codex | Moonlit Fang (Legendary) | planned |
| monster.dust-bunny | monster | 32x32 | 4 | art/monsters/dust-bunny.png | Stages, Codex | Living Room, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.loose-yarn | monster | 32x32 | 4 | art/monsters/loose-yarn.png | Stages, Codex | Living Room, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.sock-puppet | monster | 32x32 | 4 | art/monsters/sock-puppet.png | Stages, Codex | Living Room, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.roomba-scout | monster | 32x32 | 4 | art/monsters/roomba-scout.png | Stages, Codex | Living Room, elite (reuse existing repo art where it exists; only generate missing) | planned |
| monster.yarn-giant | monster | 32x32 | 4 | art/monsters/yarn-giant.png | Stages, Codex | Living Room, boss (reuse existing repo art where it exists; only generate missing) | planned |
| monster.pickle-imp | monster | 32x32 | 4 | art/monsters/pickle-imp.png | Stages, Codex | Kitchen, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.toast-mimic | monster | 32x32 | 4 | art/monsters/toast-mimic.png | Stages, Codex | Kitchen, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.spoon-bug | monster | 32x32 | 4 | art/monsters/spoon-bug.png | Stages, Codex | Kitchen, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.blender-brute | monster | 32x32 | 4 | art/monsters/blender-brute.png | Stages, Codex | Kitchen, elite (reuse existing repo art where it exists; only generate missing) | planned |
| monster.cucumber-scare | monster | 32x32 | 4 | art/monsters/cucumber-scare.png | Stages, Codex | Kitchen, boss (reuse existing repo art where it exists; only generate missing) | planned |
| monster.soap-slime | monster | 32x32 | 4 | art/monsters/soap-slime.png | Stages, Codex | Bathroom, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.rubber-duck | monster | 32x32 | 4 | art/monsters/rubber-duck.png | Stages, Codex | Bathroom, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.sponge-crab | monster | 32x32 | 4 | art/monsters/sponge-crab.png | Stages, Codex | Bathroom, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.hair-dryer-wisp | monster | 32x32 | 4 | art/monsters/hair-dryer-wisp.png | Stages, Codex | Bathroom, elite (reuse existing repo art where it exists; only generate missing) | planned |
| monster.bathtub-tyrant | monster | 32x32 | 4 | art/monsters/bathtub-tyrant.png | Stages, Codex | Bathroom, boss (reuse existing repo art where it exists; only generate missing) | planned |
| monster.mouse-trap | monster | 32x32 | 4 | art/monsters/mouse-trap.png | Stages, Codex | Basement, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.dust-moth | monster | 32x32 | 4 | art/monsters/dust-moth.png | Stages, Codex | Basement, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.wind-up-robot | monster | 32x32 | 4 | art/monsters/wind-up-robot.png | Stages, Codex | Basement, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.box-fort-knight | monster | 32x32 | 4 | art/monsters/box-fort-knight.png | Stages, Codex | Basement, elite (reuse existing repo art where it exists; only generate missing) | planned |
| monster.vacuum-beast | monster | 32x32 | 4 | art/monsters/vacuum-beast.png | Stages, Codex | Basement, boss (reuse existing repo art where it exists; only generate missing) | planned |
| monster.shadow-crow | monster | 32x32 | 4 | art/monsters/shadow-crow.png | Stages, Codex | Night Rooftops, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.moth-swarm | monster | 32x32 | 4 | art/monsters/moth-swarm.png | Stages, Codex | Night Rooftops, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.neon-dot | monster | 32x32 | 4 | art/monsters/neon-dot.png | Stages, Codex | Night Rooftops, regular (reuse existing repo art where it exists; only generate missing) | planned |
| monster.chimney-ghost | monster | 32x32 | 4 | art/monsters/chimney-ghost.png | Stages, Codex | Night Rooftops, elite (reuse existing repo art where it exists; only generate missing) | planned |
| monster.laser-dot-phantom | monster | 32x32 | 4 | art/monsters/laser-dot-phantom.png | Stages, Codex | Night Rooftops, boss (reuse existing repo art where it exists; only generate missing) | planned |
| chest.monster-box | chest | 48x48 | 4 | art/chests/monster-box.png | Drops | closed, opening, open, glow | planned |
| chest.elite-box | chest | 48x48 | 4 | art/chests/elite-box.png | Drops | closed, opening, open, glow | planned |
| chest.boss-chest-first | chest | 48x48 | 4 | art/chests/boss-chest-first.png | Drops | closed, opening, open, glow | planned |
| chest.boss-chest-repeat | chest | 48x48 | 4 | art/chests/boss-chest-repeat.png | Drops | closed, opening, open, glow | planned |
| pet.biscuit | companion | 48x48 | 4 | art/pets/biscuit.png | Pets, Codex | Biscuit the Tabby, idle loop | planned |
| pet.noodle | companion | 48x48 | 4 | art/pets/noodle.png | Pets, Codex | Noodle the Kitten, idle loop | planned |
| pet.pickle | companion | 48x48 | 4 | art/pets/pickle.png | Pets, Codex | Pickle the Grump, idle loop | planned |
| pet.bubbles | companion | 48x48 | 4 | art/pets/bubbles.png | Pets, Codex | Bubbles the Duck, idle loop | planned |
| pet.moth | companion | 48x48 | 4 | art/pets/moth.png | Pets, Codex | Mothra Jr., idle loop | planned |
| pet.ember | companion | 48x48 | 4 | art/pets/ember.png | Pets, Codex | Ember Moth, idle loop | planned |
| ach.a1 | achievement badge | 32x32 | 1 | art/achievements/a1.png | Quests | First Hairball | planned |
| ach.a2 | achievement badge | 32x32 | 1 | art/achievements/a2.png | Quests | Rune Hoarder | planned |
| ach.a3 | achievement badge | 32x32 | 1 | art/achievements/a3.png | Quests | Careful Shopper | planned |
| ach.a4 | achievement badge | 32x32 | 1 | art/achievements/a4.png | Quests | Mercy Is Real | planned |
| ach.a5 | achievement badge | 32x32 | 1 | art/achievements/a5.png | Quests | Lucky Streak | planned |
| ach.a6 | achievement badge | 32x32 | 1 | art/achievements/a6.png | Quests | Full Cupboard | planned |
| event.e1 | event banner | 320x96 | 1 | art/events/e1.png | Quests | Moonlit Market Week | planned |
| event.e2 | event banner | 320x96 | 1 | art/events/e2.png | Quests | Yarn Festival | planned |
| event.e3 | event banner | 320x96 | 1 | art/events/e3.png | Quests | Rainy-Day Nap | planned |
| diff.cozy | badge | 32x32 | 1 | art/badges/diff-cozy.png | Stages | cozy | planned |
| diff.spicy | badge | 32x32 | 1 | art/badges/diff-spicy.png | Stages | spicy | planned |
| diff.feral | badge | 32x32 | 1 | art/badges/diff-feral.png | Stages | feral | planned |
| nav.skills | nav icon | 24x24 | 2 | art/nav/skills.png | Left rail | normal + active | planned |
| nav.passives | nav icon | 24x24 | 2 | art/nav/passives.png | Left rail | normal + active | planned |
| nav.runes | nav icon | 24x24 | 2 | art/nav/runes.png | Left rail | normal + active | planned |
| nav.drops | nav icon | 24x24 | 2 | art/nav/drops.png | Left rail | normal + active | planned |
| nav.stages | nav icon | 24x24 | 2 | art/nav/stages.png | Left rail | normal + active | planned |
| nav.gear | nav icon | 24x24 | 2 | art/nav/gear.png | Left rail | normal + active | planned |
| nav.pets | nav icon | 24x24 | 2 | art/nav/pets.png | Left rail | normal + active | planned |
| nav.workshop | nav icon | 24x24 | 2 | art/nav/workshop.png | Left rail | normal + active | planned |
| nav.quests | nav icon | 24x24 | 2 | art/nav/quests.png | Left rail | normal + active | planned |
| nav.codex | nav icon | 24x24 | 2 | art/nav/codex.png | Left rail | normal + active | planned |
| nav.planner | nav icon | 24x24 | 2 | art/nav/planner.png | Left rail | normal + active | planned |
| nav.notes | nav icon | 24x24 | 2 | art/nav/notes.png | Left rail | normal + active | planned |
| ui.tier-pips | ui effect | 64x64 | 6 | art/ui/tier-pips.png | Runes, Skills, Passives | short one-shot | planned |
| ui.upgrade-flash | ui effect | 64x64 | 6 | art/ui/upgrade-flash.png | Runes, Skills, Passives | short one-shot | planned |
| ui.fuse-flash | ui effect | 64x64 | 6 | art/ui/fuse-flash.png | Runes, Skills, Passives | short one-shot | planned |
| ui.socket-click | ui effect | 64x64 | 6 | art/ui/socket-click.png | Runes, Skills, Passives | short one-shot | planned |
| ui.levelup-burst | ui effect | 64x64 | 6 | art/ui/levelup-burst.png | Runes, Skills, Passives | short one-shot | planned |
