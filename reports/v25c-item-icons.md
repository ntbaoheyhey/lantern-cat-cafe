# V25c Item Icons Report: Armor Pieces and Accessories

## 1. Gate Check

- **Repository**: `ntbaoheyhey/taskbar-hero`
- **Branch**: `ai/antigravity-v25c-item-icons` (branched from latest `origin/main` commit `d0640ad`)
- **Gate verification**:
  - `git fetch origin +main:refs/remotes/origin/main` completed successfully.
  - `apps/web/src/art/v2Icons.tsx` exists on `origin/main` (`100644 blob 53d05ff67f6e97c7fd046e27e9519eff7253b9ed`).
  - `apps/web/src/layout/itemView.ts` exists on `origin/main` (`100644 blob eb42bc6bf6638d9af60690a7358467359aa13de9`).
- **Git author config check**:
  - `git config user.name`: `ntbaoheyhey`
  - `git config user.email`: `108352255+ntbaoheyhey@users.noreply.github.com`

---

## 2. Overview & Deliverables

Delivered 24 original pixel-art icons for equipment and accessories in `apps/web/src/art/itemIcons.tsx` with comprehensive tests in `apps/web/src/art/itemIcons.test.tsx`:
- **12 Armor Icons (3 sets × 4 slots)**:
  - Cozy Knit Set: `arm.cozy.helmet`, `arm.cozy.armor`, `arm.cozy.gloves`, `arm.cozy.boots` (warm cream/orange).
  - Ranger Leather Set: `arm.ranger.helmet`, `arm.ranger.armor`, `arm.ranger.gloves`, `arm.ranger.boots` (forest green/leather brown).
  - Moon Knight Set: `arm.moon.helmet`, `arm.moon.armor`, `arm.moon.gloves`, `arm.moon.boots` (steel blue/silver with crescent moon emblem).
- **12 Accessory Icons (4 slots × 3 designs)**:
  - Collars: `acc.bell`, `acc.ribbon`, `acc.studded`
  - Earrings: `acc.fishhook`, `acc.feather`, `acc.pearl`
  - Rings: `acc.paw`, `acc.hunter`, `acc.lucky`
  - Charms: `acc.catnip`, `acc.mouse`, `acc.star`

All icons follow the v2 pixel-art specification:
- String maps with `.` transparent and 1-px dark outline `k`.
- Colors exclusively sourced from `v2Icons` `PALETTE`.
- Dimensions strictly between 10 and 12 px wide and tall (11×11, 11×12, or 12×11).
- No wasted border: non-transparent pixels touch at least 3 of 4 edges on every icon.
- Unique silhouettes within each slot.
- Fully compatible with `v2Frames.tsx` rarity frames at 3x scale on dark and light themes.

---

## 3. Visual Showcase (Screenshot Sheets)

### Dark Theme (`#1a1220`)
All 24 icons rendered at 3x scale inside each of the 5 rarity frames (`frameCommon`, `frameUncommon`, `frameRare`, `frameEpic`, `frameLegendary`):

![Dark Theme Screenshot Sheet](reports/v25c-item-icons/sheet-dark.png)

### Light Theme (`#f5eee6`)
All 24 icons rendered at 3x scale inside each of the 5 rarity frames on the light background:

![Light Theme Screenshot Sheet](reports/v25c-item-icons/sheet-light.png)

---

## 4. Icon Catalog & Description

Each of the 24 icons and what it shows:

| Key | Slot / Design | Size | Visual Description |
| :--- | :--- | :--- | :--- |
| `arm.cozy.helmet` | Helmet (Cozy) | 11 × 11 px | Warm knit orange dome beanie with a fluffy cream pom-pom on top and ribbed fold cuff. |
| `arm.cozy.armor` | Armor (Cozy) | 11 × 11 px | Chunky cable-knit sweater with folded sleeves, warm ribbed crewneck, and vertical cream cable braids. |
| `arm.cozy.gloves` | Gloves (Cozy) | 11 × 11 px | Pair of warm cream-and-orange knit mittens with inward-facing thumbs, linked by a draped yarn string. |
| `arm.cozy.boots` | Boots (Cozy) | 12 × 11 px | Pair of puffy low-cut fuzzy booties with rolled cream fleece cuffs and soft rounded soles. |
| `arm.ranger.helmet` | Helmet (Ranger) | 11 × 11 px | Forest-green archer cap with a sharp upright white-tipped feather and buckled leather band. |
| `arm.ranger.armor` | Armor (Ranger) | 11 × 11 px | Sleeveless green leather vest with cutaway armholes, diagonal chest strap, and gold-buckled waist belt. |
| `arm.ranger.gloves` | Gloves (Ranger) | 11 × 11 px | Pair of fingerless leather archer gloves exposing pink cat paw pads at the top with gold wrist buckles. |
| `arm.ranger.boots` | Boots (Ranger) | 11 × 11 px | Pair of tall rugged leather adventurer boots with folded green cuffs and calf buckles. |
| `arm.moon.helmet` | Helmet (Moon) | 11 × 11 px | Silver-blue knight sallet helm with a golden crescent crest, horizontal visor slit, and cheek bevor. |
| `arm.moon.armor` | Armor (Moon) | 11 × 11 px | Steel-and-azure breastplate with flared angular pauldrons, tapered waist, and an embossed golden crescent emblem. |
| `arm.moon.gloves` | Gloves (Moon) | 11 × 11 px | Pair of heavy articulated silver-blue plate gauntlets with flared vambraces and golden crescent backhand glints. |
| `arm.moon.boots` | Boots (Moon) | 11 × 11 px | Pair of segmented steel-and-blue plate greaves with pointed knee poleyns and flared sabaton foot armor. |
| `acc.bell` | Collar (Bell) | 11 × 11 px | Crimson collar band suspending a spherical golden jingle bell with an iconic horizontal sound slit and center clapper. |
| `acc.ribbon` | Collar (Ribbon) | 11 × 11 px | Vibrant rose-pink collar tied in a wide bowtie knot with two fluttering ribbon tails. |
| `acc.studded` | Collar (Studded) | 11 × 11 px | Dark studded leather collar with sharp metallic pyramid spikes projecting outward and downward. |
| `acc.fishhook` | Earring (Fishhook) | 11 × 11 px | Polished golden fishing hook with top hanging eyelet, straight shank, curved bend, and sharp barbed tip. |
| `acc.feather` | Earring (Feather) | 11 × 11 px | Dangling turquoise and emerald avian feather earring with delicate central quill line on a gold loop. |
| `acc.pearl` | Earring (Pearl) | 11 × 11 px | Radiant iridescent spherical pearl stud with white glint and lilac-violet glow mounted in four gold prongs. |
| `acc.paw` | Ring (Paw) | 12 × 11 px | Polished gold ring band crowned with a three-toed pink cat paw print signet. |
| `acc.hunter` | Ring (Hunter) | 11 × 11 px | Rugged bronze ring band mounting a curved, sharp ivory predatory beast fang set in a ruby socket. |
| `acc.lucky` | Ring (Lucky) | 11 × 11 px | Gleaming gold ring band set with a vibrant emerald four-leaf clover shamrock signet. |
| `acc.catnip` | Charm (Catnip) | 11 × 11 px | Sprig of aromatic green catnip leaves tied with twine on a charm loop, accented by scent sparkles. |
| `acc.mouse` | Charm (Mouse) | 11 × 11 px | Miniature grey plush toy mouse charm with pink inner ears, whiskers, pointed pink nose, and curled string tail. |
| `acc.star` | Charm (Star) | 11 × 11 px | Radiant celestial five-pointed golden star charm suspended from a gold ring, centered with a cyan glint. |

---

## 5. Design Decisions & Readability Analysis

- **Silhouettes per slot**:
  - *Helmets*: Cozy is a soft rounded dome with a top pom-pom; Ranger is an asymmetrical peaked cap with a tall side feather; Moon is an angular visor helm with a crest.
  - *Armors*: Cozy is a thick cable sweater with sleeves down the sides; Ranger is a sleeveless vest with cut armholes and belt; Moon is a wide-pauldron armored breastplate.
  - *Gloves*: Cozy shows connected round mittens with thumbs; Ranger shows fingerless gloves with exposed pink cat paw beans; Moon shows flared metallic gauntlets.
  - *Boots*: Cozy shows short puffy booties; Ranger shows tall leather boots; Moon shows segmented greaves with knee poleyns and sabatons.
  - *Collars*: Bell features a large hanging sphere with slit; Ribbon features a wide bow with tails; Studded features angular outward spikes.
  - *Earrings*: Fishhook is an open J-curve with barb; Feather is an organic leafy teardrop; Pearl is a solid luminous sphere.
  - *Rings*: Paw features a 3-lobed signet; Hunter features a curved ivory talon; Lucky features a 4-leaf clover.
  - *Charms*: Catnip is a botanical sprig; Mouse is an adorable toy rodent with tail; Star is a geometric 5-pointed star.
- **Readability at 3x**:
  - Spacing inside the 16×16 rarity frames allows 10–12 px icons to sit comfortably within the 8×8 to 12×12 transparent center cutouts.
  - The 1-px dark outline (`k`) ensures crisp separation against both the dark background (`#1a1220`) and the lighter parchment theme (`#f5eee6`).
  - Small elements such as the mouse's pink nose/whiskers and the fishhook's barb were placed asymmetrically to maximize pixel density and clarity without visual crowding.

---

## 6. Files Changed

- `apps/web/src/art/itemIcons.tsx` (new)
- `apps/web/src/art/itemIcons.test.tsx` (new)
- `reports/v25c-item-icons.md` (this report)
- `reports/v25c-item-icons/sheet-dark.png` (new)
- `reports/v25c-item-icons/sheet-light.png` (new)

---

## 7. Command Outputs

### Command 1: `pnpm install --frozen-lockfile`
```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 402ms using pnpm v10.28.0
```

### Command 2: `pnpm --filter @taskbar-hero/web test -- itemIcons`
```text
> @taskbar-hero/web@0.0.0 test /private/tmp/taskbar-hero-v25c/apps/web
> vitest run -- itemIcons

 RUN  v5.0.5 /private/tmp/taskbar-hero-v25c/apps/web

 ✓ src/art/itemIcons.test.tsx (29 tests) 71ms
   ✓ ITEM_ICON_KEYS equals the 24 keys in order 1ms
   ✓ icon map arm.cozy.helmet is valid pixel art meeting all constraints 1ms
   ✓ icon map arm.cozy.armor is valid pixel art meeting all constraints 1ms
   ✓ icon map arm.cozy.gloves is valid pixel art meeting all constraints 1ms
   ✓ icon map arm.cozy.boots is valid pixel art meeting all constraints 1ms
   ✓ icon map arm.ranger.helmet is valid pixel art meeting all constraints 0ms
   ✓ icon map arm.ranger.armor is valid pixel art meeting all constraints 0ms
   ✓ icon map arm.ranger.gloves is valid pixel art meeting all constraints 0ms
   ✓ icon map arm.ranger.boots is valid pixel art meeting all constraints 0ms
   ✓ icon map arm.moon.helmet is valid pixel art meeting all constraints 0ms
   ✓ icon map arm.moon.armor is valid pixel art meeting all constraints 0ms
   ✓ icon map arm.moon.gloves is valid pixel art meeting all constraints 0ms
   ✓ icon map arm.moon.boots is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.bell is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.ribbon is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.studded is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.fishhook is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.feather is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.pearl is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.paw is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.hunter is valid pixel art meeting all constraints 2ms
   ✓ icon map acc.lucky is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.catnip is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.mouse is valid pixel art meeting all constraints 0ms
   ✓ icon map acc.star is valid pixel art meeting all constraints 0ms
   ✓ no two icons have identical maps 0ms
   ✓ maps all non-weapon items in v2.ITEMS to valid keys and weapons to null 2ms
   ✓ correctly maps specific test item ids 0ms
   ✓ renders ItemPixelIcon with expected attributes and role 56ms

 Test Files  46 passed (46)
      Tests  502 passed (502)
   Start at  01:24:54
   Duration  5.92s
```

### Command 3: `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```text
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v25c
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

### Command 4: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
```text
> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v25c
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
└─ Done in 927ms
└─ Done in 1.3s
└─ Done in 1.4s
└─ Done in 2s
packages/api-contract typecheck$ tsc --noEmit
└─ Done in 508ms
apps/web typecheck$ tsc --noEmit
└─ Done in 3.7s

> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-v25c
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
└─ Done in 405ms
└─ Done in 807ms
└─ Done in 816ms
└─ Done in 1.3s
packages/api-contract lint$ tsc --noEmit
└─ Done in 427ms
apps/web lint$ tsc --noEmit
└─ Done in 4s

> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-v25c
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth: 2 test files, 7 passed (7)
packages/chain: 2 test files, 18 passed (18)
packages/game-rules: 13 test files, 265 passed | 2 expected fail (267)
supabase/tests: 1 test file, 37 passed (37)
packages/api-contract: 2 test files, 7 passed (7)
apps/web: 46 test files, 502 passed (502)

All 6 projects passed!

> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-v25c
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
└─ Done in 350ms
└─ Done in 766ms
└─ Done in 808ms
└─ Done in 1.3s
packages/api-contract build$ tsc --noEmit
└─ Done in 406ms
apps/web build$ tsc --noEmit && vite build
✓ 1715 modules transformed.
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/index-DRCa5LIp.js               126.72 kB │ gzip:  36.87 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.23 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 657ms
└─ Done in 4.4s
```
