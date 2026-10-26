STATUS: DONE

# Taskbar Hero: Live Demo Claims and Parity Verification

Date: 2026-10-26, Asia/Saigon. Branch: `ai/antigravity-demo-check`. Target: claims in demo report on `ai/codex-demo-build-report` @ `69a24c7e6328d7fb56b4fe4087f99a69750bc1e7`.
Investigation performed without modifying site settings, deployment configuration, codebases, or database state.

---

## 1. Gate and Allowlist Check

- **Task goal:** Check two claims in the demo report on `ai/codex-demo-build-report` @ `69a24c7` without changing anything.
- **Allowed files:** `reports/demo-check.md` and `reports/demo-check/**` only.
- **Hard stops observed:** No PR opened, no merge to `main`, no GitHub Actions, no Vercel/deploy, no change to the demo Site's sharing settings, no contract/auth/secret modifications, no database writes, no package/lockfile changes.
- **Files touched:** Only `reports/demo-check.md` and evidence files in `reports/demo-check/`.

---

## 2. Checks and Evidence

### Check 1: Audience — PASS

- **Claim:** The demo report (`reports/demo-build-antigravity.md`) and `deployment.json` at `69a24c7` say `audience: "owner-private"`. A later report notes the Site policy reads public.
- **Verification Method:** Launched a fresh, isolated Chromium browser context (incognito mode; no login credentials, no stored session cookies, no authentication headers) to open both URLs:
  - Game root: `https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site`
  - Review gallery: `https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site/review/classes.html`
- **Observed Results:**
  - **Game Root (`/`):**
    - HTTP Response Status: `200 OK`
    - Final URL: `https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site/`
    - Title: `Taskbar Hero`
    - Authentication challenge: None. Page loads immediately for unauthenticated visitors.
    - Content loaded: Full interactive application loads, including HUD bar (`Lv 1`, `0/60 XP`, `Chapter 1 · Round 1`), Mode note (`Demo mode — progress is saved in this browser.`), onboarding modal (`How to Play`), and Class Selection interface (`Choose Your Class`).
    - Evidence screenshot: `reports/demo-check/audience-root-fresh.png`
  - **Class Review Gallery (`/review/classes.html`):**
    - HTTP Response Status: `307 Temporary Redirect` -> `200 OK`
    - Final URL: `https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site/review/classes`
    - Title: `Taskbar Hero · Class previews`
    - Authentication challenge: None. Page loads immediately for unauthenticated visitors.
    - Content loaded: Heading `Proposed class looks`, subtitle `Antigravity’s static previews for review. These looks have not been applied to the game.`, back link `← Play demo`, and all 7 class preview cards (Warrior, Guardian, Rogue, Hunter, Archer, Witch, Alchemist) rendering static sprite PNGs.
    - Evidence screenshot: `reports/demo-check/audience-review-classes-fresh.png`
- **Machine-readable result:** Stored in `reports/demo-check/audience-check.json`.

---

### Check 2: Parity — PASS

- **Claim:** The demo was built from V26 e2e @ `33481ce` plus an overlay patch. It does not contain the stage-redraw fix (`7760775`) or the responsive window changes (`282843d`). Known failure: actors vanish after viewport resize.
- **Verification Method:**
  1. Loaded the live demo in Chromium at initial viewport `1600x900`.
  2. Dismissed the onboarding prompt and selected the `Warrior` class (confirming via the switch dialog).
  3. Inspected stage canvas: immediately upon initial mount, `StageCanvas` boots Phaser while `StageScene` is in `CREATING` state (`isActive()` is `false`), dropping the initial show call (`left: 0, right: 0`).
  4. Triggered state update via `EQUIP BEST` button while the scene is active (`RUNNING`). Verified that both cat and monster sprites render on canvas.
  5. Resized viewport across `1600x900` -> `390x844` -> `1280x720`.
  6. Evaluated canvas pixel data across the left half (cat) and right half (monster) after each resize settles.
- **Observed Results:**

| Viewport | Stage Canvas Dimensions | Left Half (Cat) Pixels | Right Half (Monster) Pixels | Cat Present? | Monster Present? | Result |
|---|---|---|---|---|---|---|
| **1600×900 (post-equip)** | 266 × 96 | **314** | **209** | **TRUE** | **TRUE** | Actors visible |
| **390×844 (after resize)** | 195 × 96 | **0** | **0** | **FALSE** | **FALSE** | **Vanished** |
| **1280×720 (after resize)** | 256 × 96 | **0** | **0** | **FALSE** | **FALSE** | **Vanished** |

- **Failure Analysis:**
  - When the viewport resizes, `StageCanvas.tsx` destroys the previous `Phaser.Game` instance and constructs a new one matching the new logical width.
  - In `StageScene.ts` (at `33481ce`), `create()` immediately executes `this.show(this.state0, this.reduced)`.
  - Inside `show()`, `if (!this.sys.isActive() || !state.cat.classId) return;` aborts because Phaser's scene manager has not yet transitioned the scene to `RUNNING`.
  - Because no subsequent store state update occurs during a passive window resize, `show()` is never re-invoked.
  - Consequently, both the cat and monster completely vanish from the canvas upon any viewport dimension change.
- **Screenshots:**
  - `reports/demo-check/canvas-1600x900.png` (both actors rendered)
  - `reports/demo-check/canvas-390x844.png` (empty canvas, actors vanished)
  - `reports/demo-check/canvas-1280x720.png` (empty canvas, actors vanished)
  - `reports/demo-check/stage-1600x900.png`, `stage-390x844.png`, `stage-1280x720.png`
  - `reports/demo-check/page-1600x900.png`, `page-390x844.png`, `page-1280x720.png`
- **Machine-readable summary:** Stored in `reports/demo-check/parity-check.json`.

---

### Check 3: Content — PASS

Factual listing of content on public pages that has not received user approval:

#### A. Proposed Class-Art Gallery (D3 / D5 Pending)
- **Location:** `https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site/review/classes.html` (redirects to `/review/classes`).
- **Asset path:** `https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site/review/class-looks/{class}.png`
- **Classes displayed:**
  1. `Warrior`: `class-looks/warrior.png`
  2. `Guardian`: `class-looks/guardian.png`
  3. `Rogue`: `class-looks/rogue.png`
  4. `Hunter`: `class-looks/hunter.png`
  5. `Archer`: `class-looks/archer.png`
  6. `Witch`: `class-looks/witch.png`
  7. `Alchemist`: `class-looks/alchemist.png`
- **Approval status:**
  - Governed by `docs/class-refs.md`: Decision D3 deadline is 2 Nov 2026 (cutoff 5 Nov 2026); Decision D5 establishes fallback to written descriptions or existing placeholder art.
  - The user has **not approved** D3/D5.
  - Note on runtime: The live game runtime at `/` still renders placeholder rig art (`apps/web/src/game/rig/palettes.ts`), but the proposed gallery is published publicly at `/review/classes.html`.

#### B. Staged Saves and Fixtures
- **Default Starter Save:**
  - Pre-seeded in `MockGameApiV2.ts` for demo mode:
    - Initial stack currencies: `500 fish`, `50 yarn`, `30 cloth`, `20 iron`, `20 wood` (permitting instant crafting without progression).
    - Starter equipment granted automatically upon class selection (e.g. `wp:rusty-sword:starter`).
    - Staged Relic voucher parameters: zero address `0x0000000000000000000000000000000000000000`, fixed demo signature (`0x1111...`), and 1-hour dummy expiry.
    - Local browser storage key: `taskbar-hero:v2-demo:1`.
- **Publicly Exposed Dev Routes (due to `VITE_GAME_V2=1` build flag):**
  - **`/?dev=arena` (Boss Arena Preview):**
    - Exposes 6 staged combat fixtures from `apps/web/src/game/arena/arenaFixtures.ts`:
      - `ch1-win`
      - `ch1-loss`
      - `ch3-win`
      - `ch3-loss`
      - `ch5-loss`
      - `ch2-win`
  - **`/?dev=sprites` (Sprite Preview Tool):**
    - Exposes interactive animation rig preview for all 14 looks × 6 animations, gear anchors, and class/armor sets.

#### C. Public Labels and Copy
- **Global Notices:**
  - Banner: `"Demo mode — progress is saved in this browser."`
  - Gallery disclaimer: `"Proposed class looks — Antigravity’s static previews for review. These looks have not been applied to the game."`
  - Forge panel notice: `"Relic minting will be available after wallet wiring."`
- **Class Specializations and Numerical Descriptions:**
  - `Warrior` (MELEE): "Cleave: every 3rd swing also hits the next monster for 50%" | HP 1x, ATK 1x, DEF 1x, Attack Speed 1.00s
  - `Guardian` (MELEE): "Bonk: each hit delays target attack by 500 ms" | HP 1.3x, ATK 1.35x, DEF 1.3x, Attack Speed 1.40s
  - `Rogue` (MELEE): "Twin Strike: strikes 2 times per attack" | HP 0.85x, ATK 0.3x, DEF 0.85x, Attack Speed 0.80s
  - `Hunter` (REACH): "Mark Prey: marks target (+20% damage taken) and +10% material find" | HP 1x, ATK 0.9x, DEF 0.85x, Attack Speed 1.10s
  - `Archer` (RANGED): "Volley: every 5th shot fires 3 arrows for 50% extra damage" | HP 0.85x, ATK 0.75x, DEF 0.85x, Attack Speed 0.90s
  - `Witch` (RANGED): "Burn: bolts splash 40% and burn for 30% damage over 3s" | HP 0.85x, ATK 1.2x, DEF 0.7x, Attack Speed 1.60s
  - `Alchemist` (RANGED): "Poison: poisons for 50% damage over 4s and heals 3% max HP on kill" | HP 1x, ATK 0.85x, DEF 0.85x, Attack Speed 1.30s
- **Progression and World Map Copy:**
  - Chapter 1: "Living Room" · Boss: "Yarn Giant"
  - Chapter 2: "Kitchen" · Boss: "Cucumber Scare"
  - Chapter 3: "Balcony"
  - Chapter 4: "Garden"
  - Chapter 5: "Attic"
  - Heading: "Cat Café Quest Chapters"
- **Character Panel Accessory Lock Labels:**
  - `"Lv 5"`, `"Lv 10"`, `"Lv 20"` accessory slots.

---

## 3. Real Verification Commands Output

Docs-only diff: full application suite skipped as per prompt self-check instructions: `install + gen:deno drift + card's own checks`.

### `pnpm install --frozen-lockfile`

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 354ms using pnpm v10.28.0
```

### `pnpm gen:deno && git diff --exit-code -- supabase/functions`

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

`git diff --exit-code -- supabase/functions` returned 0 (no drift).

### Card's Own Checks

```text
--- Check 1: Audience ---
Fresh browser context with zero cookies/login:
- Root URL: https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site -> HTTP 200 (Loads successfully)
- Review URL: https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site/review/classes.html -> HTTP 307 -> 200 (Loads successfully)
Evidence: reports/demo-check/audience-root-fresh.png, reports/demo-check/audience-review-classes-fresh.png

--- Check 2: Parity ---
1600x900 post-equip: canvas [266, 96], leftCount=314, rightCount=209 (Both actors present)
390x844 after resize: canvas [195, 96], leftCount=0, rightCount=0 (Both actors vanished)
1280x720 after resize: canvas [256, 96], leftCount=0, rightCount=0 (Both actors vanished)
Evidence: reports/demo-check/canvas-1600x900.png, reports/demo-check/canvas-390x844.png, reports/demo-check/canvas-1280x720.png

--- Check 3: Content ---
Documented unapproved proposed gallery (D3/D5 pending), staged saves/fixtures (initial stacks, /?dev=arena, /?dev=sprites), and UI copy. Facts only.
```

---

## 4. Acceptance Criteria Ticks

- [x] **PASS** — Check 1: Audience verified in fresh browser context with no login; observed whether root and `/review/classes.html` load; no settings modified.
- [x] **PASS** — Check 2: Parity verified on live demo; reproduced known resize redraw defect across 1600×900, 390×844, and 1280×720 with canvas pixel checks and screenshots.
- [x] **PASS** — Check 3: Content cataloged with unapproved items (proposed gallery under D3/D5, staged saves/fixtures, labels). Facts only.
- [x] **PASS** — Allowlist: Diff contains strictly `reports/demo-check.md` and `reports/demo-check/**`.
- [x] **PASS** — Git author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.

---

## 5. NOT Verified

- No hosting or sharing configuration settings on the ChatGPT Sites provider were inspected from provider administrative consoles (prohibited by prompt).
- No deployment or infrastructure modification was executed.
- No recommendation regarding sharing or hosting changes is made (reserved strictly for user decision).
