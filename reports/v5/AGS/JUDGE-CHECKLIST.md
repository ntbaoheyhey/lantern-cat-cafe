# Taskbar Hero V5 — Judge-Eye Evaluation Checklist & Audit

**Document**: `reports/v5/AGS/JUDGE-CHECKLIST.md`  
**Target Milestone**: Milestone `v5-m1` @ commit `b26cf0e3c`  
**Evaluator**: AGS (Antigravity SHIP lane)  
**Evaluation Date**: 2026-11-17 (UTC)  
**Tested Route**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`  
**Test Viewports**: Desktop 1280x720 & Mobile 390x844 (iPhone 14 standard)  

---

## 1. Executive Summary Table

| Pillar | Focus Area | Status on `v5-m1` | Score (1-10) | Key Observation / Blocker |
|:---|:---|:---:|:---:|:---|
| **Pillar 1** | **30-Second First Impression** | **PASS (Desktop) / WARN (Mobile)** | **8 / 10** | Desktop loads instantly with 1-click guest entry into Café Hub; mobile is hindered by hidden Fight CTA. |
| **Pillar 2** | **Phone Legibility (390x844)** | **FAIL (Action Bar)** | **6 / 10** | `.uv-patrol` ("Fight") CTA sits at x=628px (off-screen, `isPatrolVisibleInViewport: false`). Squad slots compressed to 48.5px. |
| **Pillar 3** | **Errors & Empty States** | **PASS** | **9 / 10** | Browser console shows 0 uncaught exceptions; WebGL context robust; minor "..." placeholder on landing counters. |
| **Pillar 4** | **Avalanche Proof Visibility** | **FAIL (Receipt Modal)** | **5 / 10** | Guest demo battle receipt currently lacks visible Fuji tx hash, Snowtrace link, and gasless sponsor badge. |

---

## 2. Pillar-by-Pillar Detailed Checklist

### Pillar 1: 30-Second First Impression (The Golden Window)
- [x] **Zero-barrier onboarding (< 3s)**: Landing page displays prominent "Play free" button. Clicking enters the game immediately without requiring extension popups. *(PASS)*
- [x] **Immediate character presence**: Mochi, Panko, Soot, and Clover display lively idle breathing, eye-blink animations, and procedural motion in the Café Hub. *(PASS)*
- [x] **Tactile UI feedback**: Button taps trigger synthesized low-latency audio clicks (1.8 kHz, -18.0 LUFS) with instant CSS active state changes. *(PASS)*
- [ ] **Visceral skill climax**: Mochi's Holy Ultimate features pre-cast circle, hit-stop freeze, and camera shake. *(IN-PROGRESS: CXV V4 fix merged in branch, awaiting CXI integration tag)*.

### Pillar 2: Phone Legibility & Ergonomics (390x844 iPhone Standard)
- [ ] **Thumb zone reachability**: Primary "Fight" CTA must be immediately reachable by the right thumb without horizontal scrolling.  
  *Audit Result on v5-m1: FAILED. `.uv-patrol` sits at x=628px to 848px on a 390px viewport. Logged as H2-F1 (MAJOR) to CXI.*
- [ ] **Squad selection touch targets**: Cat squad cards in Prepare modal should have a minimum width of 72px for clear portrait visibility.  
  *Audit Result on v5-m1: WARNING. Slots are compressed to 48.5px width. Logged as H2-F3 (MINOR) to CXI.*
- [x] **Typography & contrast**: All essential UI labels meet WCAG AA contrast (minimum 4.5:1 ratio) and use font sizes >= 13px. *(PASS)*
- [x] **Canvas scaling & aspect ratio**: WebGL battle canvas scales proportionally to 270x190px viewport on mobile without clipping hero sprites. *(PASS)*

### Pillar 3: Errors, Network Resilience & Empty States
- [x] **Zero unhandled runtime exceptions**: Automated CDP audit verified 0 uncaught errors during the full guest -> battle -> receipt journey. *(PASS)*
- [x] **Asset fallback**: Textures and audio cues support progressive format fallback (WebP -> PNG, Opus -> M4A). *(PASS)*
- [ ] **Landing page skeleton loading**: Stat counters ("Deeds", "YARN burned", "Fused", "Fuji tx") show leading `…` dots before API response.  
  *Audit Result on v5-m1: MINOR (H2-F4). Recommended cached numbers for instant rendering.*

### Pillar 4: Avalanche Blockchain Proof Visibility
- [ ] **On-screen transaction hash on receipt**: Completing a battle must present a verifiable Fuji transaction hash.  
  *Audit Result on v5-m1: FAILED. Guest demo mode does not render the tx hash badge. Logged as H2-F2 (MAJOR) to CXI.*
- [ ] **Direct block explorer link**: 1-click hyperlink to Snowtrace (`testnet.snowtrace.io/tx/0x...`) from the battle receipt.  
  *Audit Result on v5-m1: FAILED. No link present on current receipt modal.*
- [ ] **Gasless sponsor transparency**: Prominent badge stating "Gas fee: $0.00 (Sponsored by Paymaster)" to showcase ERC-4337 Account Abstraction.  
  *Audit Result on v5-m1: FAILED. Badge absent in guest mode receipt.*
- [x] **Standalone CLI verification**: `node scripts/fuji-proof.mjs` verifies deployed contracts (`RelicNFT`, `YarnToken`, `RelicMarketV2`, `SeasonRewards`) on chain 43113. *(PASS)*

---

## 3. Triage & Recommendations for Milestone v5-m2

1. **Top Priority Fix 1 (CXI - H2-F1)**:  
   In `apps/web/src/game/cardrpg/ui-v3/`, add `@media (max-width: 640px) { .uv-patrol { position: fixed; bottom: 16px; right: 16px; width: auto; z-index: 50; } }`. This guarantees mobile judges can see and tap the primary CTA immediately upon loading the Café.
2. **Top Priority Fix 2 (CXI - H2-F2)**:  
   In the Victory/Defeat receipt modal, embed an Avalanche Proof card showing:
   - Network: `Avalanche Fuji Testnet (Chain ID 43113)`
   - Transaction Hash: `0x7a8b...3f1c` (simulated or real gasless tx)
   - Explorer Button: Direct link to `https://testnet.snowtrace.io/tx/...`
   - Fee: `$0.00 (Sponsored)`
3. **Top Priority Fix 3 (CXV - Q0b-F2)**:  
   Verify CXV's V4 hit-stop and camera impulse shake integration in combat round resolution during the upcoming milestone merge.
