# Asset slots

Generated from the live catalog by tools/cardrpg-look/spine/generate-contract.mjs. The executable contract is assets/cardrpg-look/spine/{config,slots}.json. Accepted export or sequence metadata changes require no TypeScript edits. Runtime identities stay exact; enemy VFX folders replace colon with hyphen.

| Unit | Side / role | Size / height | Animations | Skills shown |
|---|---|---|---|---|
| mochi | party / guardian | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | mochi-1: Door knock; mochi-2: Warm welcome; mochi-3: Apron crossing; mochi-4: Last light shelter |
| soot | party / hexer | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | soot-1: Cocoa spark; soot-2: Black cup; soot-3: Lantern wick; soot-4: Midnight service |
| clover | party / healer | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | clover-1: Leaf tap; clover-2: Patient steep; clover-3: Clearleaf rinse; clover-4: Greenhouse morning |
| panko | party / guardian | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | panko-1: Pan reply; panko-2: Bread cover; panko-3: Crust return; panko-4: Oven door |
| mallow | party / striker | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | mallow-1: Whisk flare; mallow-2: Split ember; mallow-3: Burnt sugar; mallow-4: Closing blaze |
| sorrel | party / controller | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | sorrel-1: Moon spoon; sorrel-2: Cold brew; sorrel-3: Decanted moon; sorrel-4: Shared pot |
| biscuit | party / striker | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | biscuit-1: Rolling pin; biscuit-2: Sideboard step; biscuit-3: Last crumb; biscuit-4: Bakers procession |
| inkcap | party / controller | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | inkcap-1: Ink thread; inkcap-2: Quiet spores; inkcap-3: Paper decoy; inkcap-4: Dreaming canopy |
| cinnamon | party / healer | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | cinnamon-1: Spice pinch; cinnamon-2: Comfort cup; cinnamon-3: Clean apron; cinnamon-4: Second serving |
| brioche | party / guardian | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | brioche-1: Bell patrol; brioche-2: Borrowed blanket; brioche-3: Starched collar; brioche-4: Constellation apron |
| velvet | party / witch | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | velvet-1: Silk nick; velvet-2: Candle bounce; velvet-3: Stolen flame; velvet-4: Velvet curtain |
| marigold | party / healer | cat / 512 (512–512) | idle, appear, attack, skill, ult, hurt, ko, victory | marigold-1: Seed stitch; marigold-2: Garden bell; marigold-3: Spring pruning; marigold-4: First tea blossom |
| button-guard | enemy / guard | standard / 614 (563–666) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:button-guard:basic: Button Guard basic; enemy:button-guard: Shields and Warms its whole row. |
| sock-skipper | enemy / flanker | small / 461 (410–512) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:sock-skipper:basic: Sock Skipper basic; enemy:sock-skipper: Targets rear cats and applies Bleed. |
| spool-ram | enemy / charger | standard / 614 (563–666) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:spool-ram:basic: Spool Ram basic; enemy:spool-ram: Charges for one turn, then hits a row. |
| needle-moth | enemy / ranger | small / 461 (410–512) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:needle-moth:basic: Needle Moth basic; enemy:needle-moth: Three seeded hits on random cats. |
| teacup-healer | enemy / healer | standard / 614 (563–666) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:teacup-healer:basic: Teacup Healer basic; enemy:teacup-healer: Heals its weakest ally every two rounds. |
| kettle-knight | enemy / elite | standard / 614 (563–666) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:kettle-knight:basic: Kettle Knight basic; enemy:kettle-knight: Below half HP, basics Burn the front row. |
| yarn-giant | enemy / yarn | boss / 922 (870–998) | idle, appear, attack, skill, ult, hurt, ko, victory, idle-phase2, enrage | enemy:yarn-giant:basic: Yarn Giant basic; enemy:yarn-giant: Row + Shred signatures; closing phase All + Bitter. |
| binding-thread | enemy / thread | small / 461 (410–512) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:binding-thread:basic: Binding Thread basic; enemy:binding-thread: Knots apply Shred; every third turn Dazes the weakest cat. |
| practice-cushion | enemy / dummy | small / 461 (410–512) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:practice-cushion:basic: Practice Cushion basic; enemy:practice-cushion: A gentle third-round bump teaches a break interrupt. |
| pollen-scout | enemy / ranger | small / 461 (410–512) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:pollen-scout:basic: Pollen Scout basic; enemy:pollen-scout: Every third round plants a Binding Thread, up to two. |
| rain-spool | enemy / charger | boss / 922 (870–998) | idle, appear, attack, skill, ult, hurt, ko, victory, idle-phase2, enrage | enemy:rain-spool:basic: Rain Spool basic; enemy:rain-spool: Every third round Cloudburst washes shields away before a row hit. |
| crumb-sentinel | enemy / guard | standard / 614 (563–666) | idle, appear, attack, skill, ult, hurt, ko, victory | enemy:crumb-sentinel:basic: Crumb Sentinel basic; enemy:crumb-sentinel: Every third round Sugar burst detonates Crumb trails on cats. |
| pantry-crown | enemy / yarn | boss / 922 (870–998) | idle, appear, attack, skill, ult, hurt, ko, victory, idle-phase2, enrage | enemy:pantry-crown:basic: Pantry Crown basic; enemy:pantry-crown: Every third round Empty banquet drains energy and silences the table. |

Each unit folder is assets/cardrpg-look/spine/<id>/. Deliver <id>.json OR <id>.skel, <id>.atlas and its named PNG pages; the initial page is <id>.png. Placeholders live in placeholder/. Per-unit sequence/sequence.json is the license/tool fallback.

Shared required bones: root, hip, head, hp-anchor, vfx-origin, main-hand, off-hand. Sockets: hpAnchor ← hp-anchor; head ← head; vfxOrigin ← vfx-origin; mainHand ← main-hand; offHand ← off-hand; feet ← root; chest ← hip.

Every skill launches from main-hand or vfx-origin, impacts the target vfx-origin and places rings at root. Cast/impact/cut-in event fractions, optional designer VFX folders, budgets and exact clip lists are in slots.json. The runtime flips enemies; art always faces right. Boss width is at most 1126.4 Spine units. See DESIGNER-SPEC for delivery, validation and acceptance.

Spool Ram preparation: the rules charge event (not an extra required Spine event) selects the existing `skill` clip for either basic/signature ID. Its `cast`/`hit` cues wind the caster bobbin; hit is a contact marker, not guaranteed damage. The following actual strike keeps the usual attack/skill mapping. Standard designer VFX slots override strikes only; the cached painted preparation variant stays distinct.
