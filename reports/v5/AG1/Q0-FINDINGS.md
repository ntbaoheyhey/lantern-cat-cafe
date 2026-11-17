# Q0: Judge's-Eye Review of v5-m0 Build
> [!WARNING]
> **STATUS: INVALID: legacy surface / stale images**
> Evaluated plain `http://127.0.0.1:6301` which loads legacy pixel shell (`legacy-entry.tsx`), not the V5 judge demo route. Findings Q0-F1 through Q0-F5 are RETRACTED. Superseded by Q0b on `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`.

- Preview URL: `http://127.0.0.1:6301` (v5-m0 baseline + I2 loader runtime) [LEGACY SURFACE - INVALIDATED]
- Review Viewports: Desktop 1280x720 & Mobile 390x844
- Review Flow: Guest Onboarding -> Dashboard -> Boss Encounter -> Battle Resolution & Receipt

---

## Findings Table

| ID | Severity | What a Judge Sees | Steps to Reproduce | Screenshot Path | Owner Session |
|:---:|:---:|---|---|---|:---:|
| **Q0-F1** | **MAJOR** | **Navigation Tab Truncation on Mobile**: The rightmost navigation tab (`? How to play` or `Market`) overflows the 390px viewport and gets clipped as `? How...` / `Mark`. | 1. Open `http://127.0.0.1:6301` in 390x844 viewport.<br>2. Click "Start playing".<br>3. Click "Menu" toggle.<br>4. Inspect the top tab bar. | `reports/v5/AG1/q0/mobile_04_midbattle.png` | CXI |
| **Q0-F2** | **MAJOR** | **Battle Result Hang at 0 HP**: When hero HP reaches 0 / 360, the battle panel remains stuck on `FIGHTING...` with the `Skip` button visible for several seconds rather than immediately presenting a clear Defeat outcome receipt. | 1. Open `http://127.0.0.1:6301`.<br>2. Navigate to Boss panel.<br>3. Click "FIGHT".<br>4. Wait until Mochi HP hits 0.<br>5. Observe button stays frozen on "FIGHTING...". | `reports/v5/AG1/q0/desktop_05_receipt.png` | CXV |
| **Q0-F3** | **MAJOR** | **Missing Combat VFX & Arena Sprites**: Boss battle is visually driven purely by two generic HTML progress bars; bottom retro strip remains in passive idle loop; zero boss sprites, slash trails, or spell VFX render on screen. | 1. Open `http://127.0.0.1:6301`.<br>2. Click "TRY THE BOSS" and start fight.<br>3. Watch battle progression.<br>4. Notice complete absence of animated battle staging. | `reports/v5/AG1/q0/desktop_04_midbattle.png` | CXV |
| **Q0-F4** | **MINOR** | **Floating Damage Floater Collision**: Floating damage digits (`-50`, `-62`) render directly on top of the fighter name labels (`Mochi` and `Yarn Giant · Level 1`), causing text overlap. | 1. Initiate Boss fight.<br>2. Observe floating damage numbers during attack ticks. | `reports/v5/AG1/q0/mobile_04_midbattle.png` | CXV |
| **Q0-F5** | **MINOR** | **Hidden Desktop Navigation**: On 1280x720 desktop, primary navigation tabs (Hero, Inventory, Boss, Forge, Market) are collapsed behind a small bottom-right "Menu" toggle button instead of being persistently accessible. | 1. Open `http://127.0.0.1:6301` at 1280x720.<br>2. Dismiss landing dialog.<br>3. Notice tabs are completely hidden until finding "Menu". | `reports/v5/AG1/q0/desktop_02_dashboard.png` | CXI |

---

## Dispatched Requests (REQ) Summary
- `Q0-F1` -> Dispatched REQ to `INBOX-CXI.md` (add scroll-snap or reduce tab padding for 390px mobile).
- `Q0-F2` -> Dispatched REQ to `INBOX-CXV.md` (ensure 0 HP instantly triggers battle outcome receipt state).
- `Q0-F3` -> Dispatched REQ to `INBOX-CXV.md` (priority focus for V1/V2 VFX timeline hooks).
